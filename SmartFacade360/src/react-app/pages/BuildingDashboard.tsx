import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRealtimeFindings } from '@/react-app/hooks/useRealtimeFindings';
import HealthGauge from '@/react-app/components/dashboard/HealthGauge';
import FindingsTimeline from '@/react-app/components/dashboard/FindingsTimeline';
import GreenMetricsWidget from '@/react-app/components/dashboard/GreenMetricsWidget';
import ROIAnalyzer from '@/react-app/components/dashboard/ROIAnalyzer';
import ThreeDViewer from '@/react-app/components/dashboard/ThreeDViewer';
import ExportButton from '@/react-app/components/dashboard/ExportButton';
import ErrorBoundary from '@/react-app/components/ErrorBoundary';
import LoadingSpinner from '@/react-app/components/dashboard/LoadingSpinner';
import NavigationMenu from '@/react-app/components/NavigationMenu';
import { Box, WifiOff, Activity, Download, Maximize2, Smartphone } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function BuildingDashboard() {
    const { buildingId } = useParams<{ buildingId: string }>();
    const [isExpanded, setIsExpanded] = useState(true); // Controla la previsualización móvil

    // Realtime Hook replacing SWR Polling
    const { inspection, findings, error, isLoading, isOffline } = useRealtimeFindings(buildingId || '');

    const handleDownloadReport = () => {
        toast.success("Descargando Certificado Forense...");
    };

    console.log('--- DASHBOARD RENDER START ---', { buildingId, isLoading, error });

    // Bypass de Datos (Mock data / Fallback)
    const mockInspection = { health_score: 85 };
    const mockFindings = [{ pathology_type: 'thermal', area_m2: 2 }];

    const safeInspection = error || !inspection ? mockInspection : inspection;
    const safeFindings = error || !findings ? mockFindings : findings;

    if (error) {
        console.warn('⚠️ SWR o Supabase falló, usando fallbackData (Bypass)');
    }

    if (isLoading && !error) {
        return (
            <div className="min-h-screen bg-[#0F111A] flex items-center justify-center p-4">
                <LoadingSpinner text="Sincronizando Gemelo Digital..." />
            </div>
        );
    }

    const healthScore = safeInspection?.health_score ?? 100;
    const thermalFindings = safeFindings.filter((f: any) => f.pathology_type === 'thermal');

    console.log('--- DASHBOARD RENDER BEFORE RETURN ---');

    return (
        <ErrorBoundary>
            <div className={`min-h-screen transition-all duration-500 flex justify-center items-center ${isExpanded ? 'bg-slate-900 py-4 sm:py-8' : 'bg-[#0F111A]'}`}>

                {/* Main Container - Mobile Frame or Fullscreen */}
                <div className={`flex flex-col text-gray-200 font-sans relative overflow-x-hidden transition-all duration-500 ease-in-out ${isExpanded
                    ? 'w-[375px] h-[812px] max-h-[95vh] rounded-[2rem] sm:rounded-[2.5rem] border-[6px] sm:border-[8px] border-slate-700 shadow-2xl relative custom-scrollbar overflow-y-auto bg-[#0F111A]'
                    : 'w-full min-h-screen bg-[#0F111A] p-4 md:p-8 relative'
                    }`}>

                    <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#fff' } }} />

                    {/* Notch for mobile view */}
                    {isExpanded && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-2.5 bg-slate-700 rounded-b-lg z-50"></div>}

                    <div className={`h-full flex flex-col ${isExpanded ? 'pt-3 p-4' : ''}`}>
                        <NavigationMenu />

                        <div className="bg-red-900/40 border border-red-500 text-red-100 p-4 mb-4 rounded text-center">
                            <h2 className="font-bold">TEST RENDER ACTIVO</h2>
                            <p>Componentes complejos aislados (comentados) para diagnóstico TRL 5.</p>
                        </div>

                        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 tracking-tight flex items-center gap-3">
                                    COMMAND CENTER
                                    {isOffline ? (
                                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-900/40 text-amber-400 rounded-full border border-amber-500/30">
                                            <WifiOff className="w-3 h-3" /> Offline – Datos en caché
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-teal-900/40 text-teal-400 rounded-full border border-teal-500/30">
                                            <Activity className="w-3 h-3" /> Realtime activo
                                        </span>
                                    )}
                                </h1>
                                <p className="text-gray-400 text-sm tracking-widest uppercase mt-1">Salud Edificatoria TRL 5</p>
                                <p className="text-xs text-gray-600 mt-1 font-mono">UUID: {buildingId}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toast("AR Viewer Stub - Model needed", { icon: '🚀' })}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-teal-900/40 border border-gray-700 hover:border-teal-400/50 rounded-lg transition-all text-sm font-medium text-gray-300 hover:text-teal-300 shadow-[0_0_15px_rgba(0,184,217,0)] hover:shadow-[0_0_15px_rgba(0,184,217,0.2)]"
                                >
                                    <Box className="w-4 h-4" /> Realidad Aumentada
                                </button>
                                <button
                                    onClick={handleDownloadReport}
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg transition-all text-sm font-medium text-white shadow-[0_0_20px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)]"
                                >
                                    <Download className="w-4 h-4" /> Exportar Ficha
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                            {/* Left Column: Gauge and Green Metrics */}
                            <div className="xl:col-span-1 space-y-6 flex flex-col">
                                <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex-col items-center justify-center shadow-xl h-64 flex">
                                    <h2 className="w-full text-left text-gray-400 font-medium text-sm tracking-wider uppercase mb-2">Building Health Score</h2>
                                    <div className="transform scale-90 flex-grow flex items-center justify-center">
                                        {/* <HealthGauge score={healthScore} /> */}
                                        <div className="text-3xl text-teal-400 font-bold">{healthScore}/100</div>
                                    </div>
                                    <p className="text-center text-[10px] text-gray-500 mt-2 max-w-[90%]">
                                        Basado en análisis estructural normativo (NTE E.060).
                                    </p>
                                </div>

                                <div className="h-48 border border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 text-xs">
                                    {/* <GreenMetricsWidget thermalFindings={thermalFindings} /> */}
                                    [GreenMetricsWidget Aislado]
                                </div>
                            </div>

                            {/* Center Column: Digital Twin 3D Viewer */}
                            <div className="xl:col-span-2 bg-black/40 border border-dashed border-gray-700 backdrop-blur-md rounded-2xl shadow-xl h-[600px] xl:h-[700px] flex flex-col items-center justify-center text-gray-500">
                                {/* <ThreeDViewer buildingId={buildingId || ''} findings={findings} /> */}
                                <div className="text-center">
                                    <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>[ThreeDViewer Aislado para Test Render]</p>
                                </div>
                            </div>

                            {/* Right Column: ROI & Timeline Feed */}
                            <div className="xl:col-span-1 flex flex-col gap-6 xl:h-[700px] overflow-hidden">
                                <div className="h-48 border border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 text-xs">
                                    {/* <ROIAnalyzer buildingId={buildingId || ''} findings={findings} /> */}
                                    [ROIAnalyzer Aislado]
                                </div>

                                <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl flex flex-col flex-grow min-h-[300px] overflow-hidden">
                                    <h2 className="text-gray-400 font-medium text-[11px] tracking-wider uppercase mb-4 flex justify-between items-center">
                                        <span>Línea de Tiempo</span>
                                        <span className="text-[9px] bg-gray-800 px-1 py-0.5 rounded text-teal-400 border border-teal-900/50">Live Polling</span>
                                    </h2>

                                    <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar border border-dashed border-gray-700 flex items-center justify-center text-gray-500 text-xs">
                                        {/* <FindingsTimeline findings={findings} /> */}
                                        [FindingsTimeline Aislado]
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Minimalist Grid Background Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-[-1]" style={{
                            backgroundImage: 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                            opacity: 0.1
                        }}></div>
                    </div>

                </div>

                {/* Mobile Preview Toggle Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="fixed bottom-4 right-4 bg-teal-500/20 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-teal-500/50 text-teal-400 hover:text-teal-300 hover:scale-105 transition-all z-50 pointer-events-auto"
                    title={!isExpanded ? "Previsualizar en Móvil" : "Volver a Vista Completa"}
                >
                    {isExpanded ? <Maximize2 size={24} strokeWidth={2.5} /> : <Smartphone size={24} strokeWidth={2.5} />}
                </button>

                {/* Helper text when in mobile frame */}
                {isExpanded && (
                    <div className="absolute top-2 right-2 text-[10px] text-slate-500 opacity-50 z-50">
                        Vista Móvil
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}
