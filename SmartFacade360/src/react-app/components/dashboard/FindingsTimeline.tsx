import { AlertTriangle, Droplets, Thermometer, ShieldAlert, FileSymlink, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';

interface FindingsTimelineProps {
    findings: any[]; // Using any temporarily until types are synced
}

export default function FindingsTimeline({ findings }: FindingsTimelineProps) {
    const [exportingId, setExportingId] = useState<string | null>(null);

    if (!findings || findings.length === 0) {
        return <div className="text-gray-400 text-center py-8">No hay anomalías detectadas.</div>;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'crack': return <AlertTriangle className="w-5 h-5 text-red-400" />;
            case 'moisture': return <Droplets className="w-5 h-5 text-blue-400" />;
            case 'thermal': return <Thermometer className="w-5 h-5 text-amber-400" />;
            default: return <ShieldAlert className="w-5 h-5 text-gray-400" />;
        }
    };

    const getBadgeColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'high': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-green-500/20 text-green-400 border-green-500/30';
        }
    };

    const handleExportBCF = async (id: string) => {
        setExportingId(id);
        const toastId = toast.loading('Generando BCF para BIM (ISO 19650)...');

        try {
            const response = await fetch(`/api/v1/export/bcf/${id}`);

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Fallo exportando BCF.');
            }

            const blob = await response.blob();
            saveAs(blob, `sf360_issue_${id}.bcfzip`);

            toast.success('Empaquetado BCF descargado. Listo para Revit/Navis.', { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setExportingId(null);
        }
    };

    return (
        <div className="relative border-l border-gray-700 ml-4 space-y-6">
            {findings.slice(0, 10).map((finding) => (
                <div key={finding.id} className="relative pl-6 group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center group-hover:border-teal-400 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-teal-400"></div>
                    </div>

                    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/60 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                {getIcon(finding.pathology_type)}
                                <span className="font-semibold text-gray-200 capitalize">{finding.pathology_type} en {finding.element_type || 'Estructura'}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded border font-medium uppercase ${getBadgeColor(finding.severity_level)}`}>
                                {finding.severity_level}
                            </span>
                        </div>

                        <p className="text-sm text-gray-400 mb-2">
                            Desviación Métrica: <span className="text-white font-mono">{finding.metric_deviation} mm</span>
                        </p>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex flex-col gap-1">
                                {finding.nte_reference && (
                                    <div className="inline-flex items-center text-xs text-teal-300 bg-teal-900/20 px-2 py-1 rounded max-w-max">
                                        <span className="font-mono">Ref: {finding.nte_reference}</span>
                                    </div>
                                )}
                                <div className="text-xs text-gray-500">
                                    {new Date(finding.created_at).toLocaleString()}
                                </div>
                            </div>

                            <button
                                onClick={() => handleExportBCF(finding.id)}
                                disabled={exportingId === finding.id}
                                title="Exportar a Revit (BCF)"
                                aria-label="Exportar BCF para BIM"
                                className="flex items-center gap-1.5 text-xs text-gray-300 bg-gray-700/50 hover:bg-teal-800/50 hover:text-teal-200 hover:border-teal-500/30 border border-gray-600/50 px-3 py-1.5 rounded-md transition-all font-medium disabled:opacity-50"
                            >
                                {exportingId === finding.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSymlink className="w-3.5 h-3.5" />}
                                {exportingId === finding.id ? 'Generando...' : 'BIM BCF'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
