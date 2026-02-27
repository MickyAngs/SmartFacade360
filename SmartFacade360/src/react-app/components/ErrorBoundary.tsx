import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Log forense a Supabase (Resiliencia PROTTOM / ISO 27037)
        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const logAudit = async () => {
                try {
                    await supabase.from('audit_logs').insert([{
                        event_type: '3d_error',
                        message: error.message,
                        error_details: { stack: error.stack, componentStack: errorInfo.componentStack },
                        traceability_id: crypto.randomUUID(),
                    }]);
                    console.log('Log forense guardado.');
                } catch (err) {
                    console.error('Error guardando log:', err);
                }
            };
            logAudit();
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ backgroundColor: '#0F111A', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: 'white', fontFamily: 'sans-serif' }}>
                    <div style={{ backgroundColor: '#222', border: '1px solid #ef4444', borderRadius: '1rem', padding: '2rem', maxWidth: '30rem', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#f59e0b' }}>
                            Interrupción Temporal Detectada
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            {this.state.error?.message || "Error grave atrapado por el límite de seguridad (ErrorBoundary)."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ width: '100%', backgroundColor: '#1f2937', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #374151', cursor: 'pointer' }}
                        >
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
