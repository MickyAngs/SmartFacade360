import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';
import toast from 'react-hot-toast';

export interface Inspection {
    id: string;
    building_id: string;
    organization_id: string;
    health_score: number;
    inspection_date: string;
    [key: string]: any;
}

export interface Finding {
    id: string;
    inspection_id: string;
    organization_id: string;
    pathology_type: string;
    severity_level: 'low' | 'medium' | 'high' | 'critical';
    metric_deviation: number;
    nte_reference: string;
    [key: string]: any;
}

export function useRealtimeFindings(buildingId: string) {
    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isOffline, setIsOffline] = useState(false);

    const loadInitialData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // Fetch Latest Inspection
            const { data: insData, error: insError } = await supabase
                .from('inspections')
                .select('*')
                .eq('building_id', buildingId)
                .order('inspection_date', { ascending: false })
                .limit(1)
                .single();

            if (insError && insError.code !== 'PGRST116') throw insError;

            setInspection(insData);

            // Fetch Findings
            if (insData) {
                const { data: fData, error: fError } = await supabase
                    .from('findings')
                    .select('*')
                    .eq('inspection_id', (insData as any).id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (fError) throw fError;
                setFindings(fData || []);
            }
        } catch (err: any) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [buildingId]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        if (!inspection?.id) return;

        // Subscribe to real-time inserts on findings matching the current inspection
        const channel = supabase.channel('findings-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'findings',
                    filter: `inspection_id=eq.${inspection.id}`
                    // Note: Filtering by inspection_id instead of building_id because 
                    // the findings table has it as a direct foreign key.
                },
                (payload) => {
                    const newFinding = payload.new as Finding;

                    // 1. Update findings state immutably (keeping max 20)
                    setFindings(prev => {
                        const updated = [newFinding, ...prev];
                        return updated.slice(0, 20);
                    });

                    // 2. Optimistic Health Score recalculation
                    let penalty = 0;
                    switch (newFinding.severity_level) {
                        case 'critical': penalty = 40; break;
                        case 'high': penalty = 25; break;
                        case 'medium': penalty = 15; break;
                        case 'low': penalty = 5; break;
                    }
                    if (newFinding.metric_deviation > 5) {
                        penalty += 5; // Extra penalty for large deviation
                    }

                    setInspection(prev => {
                        if (!prev) return prev;
                        const newScore = Math.max(0, prev.health_score - penalty);
                        return { ...prev, health_score: newScore };
                    });

                    // 3. Critical Visual Notification
                    if (newFinding.severity_level === 'critical' || newFinding.metric_deviation > 5) {
                        toast.error(
                            `¡Alerta Estructural Crítica! Nueva ${newFinding.pathology_type} detectada. ` +
                            `Desviación: ${newFinding.metric_deviation}mm. ` +
                            `Ref: ${newFinding.nte_reference || 'NTE E.060'}`,
                            {
                                position: 'top-right',
                                duration: 8000,
                                icon: '🚨',
                                style: { background: '#7f1d1d', color: '#fff', border: '1px solid #ef4444' }
                            }
                        );
                    } else {
                        toast.success(`Nuevo hallazgo registrado: ${newFinding.pathology_type}`, { position: 'top-right' });
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsOffline(false);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    setIsOffline(true);
                }
            });

        // Offline polling/retry mechanism
        let retryInterval: NodeJS.Timeout;
        if (isOffline) {
            retryInterval = setInterval(() => {
                toast("Realtime desconectado – Intentando reconectar...", { icon: '🔄', id: 'reconnect' });
                // We could re-trigger loadInitialData() here as an offline fallback
            }, 15000);
        }

        // Cleanup
        return () => {
            supabase.removeChannel(channel);
            if (retryInterval) clearInterval(retryInterval);
        };
    }, [inspection?.id, isOffline]);

    return { inspection, findings, isLoading, error, isOffline };
}
