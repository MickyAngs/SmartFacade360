import React, { useState, useEffect } from 'react';
import { Sparkles, X, Minimize2, Maximize2, Smartphone, Scan } from 'lucide-react';

interface ToggleRAViewProps {
    isOpen: boolean;
    onToggle: (open: boolean) => void;
    children: React.ReactNode;
}

export default function ToggleRAView({ isOpen, onToggle, children }: ToggleRAViewProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // UX Improvement: Persist preference but default to closed on session start
    // Logic handled by parent or here if needed.

    if (!isOpen) {
        return (
            <button
                onClick={() => onToggle(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-full shadow-lg shadow-purple-900/30 transition-all transform hover:scale-105 font-bold group"
                data-testid="enable-ar-toggle"
            >
                <div className="relative">
                    <Smartphone className="w-5 h-5 group-hover:hidden" />
                    <Scan className="w-5 h-5 hidden group-hover:block animate-pulse" />
                </div>
                <span>Ver en tu Espacio (RA)</span>
            </button>
        );
    }

    // Active State: Rendering the Panel
    return (
        <div
            className={`fixed z-40 bg-gray-900 border-l border-gray-800 shadow-2xl transition-all duration-300 ease-in-out flex flex-col
        ${isFullscreen ? 'inset-0 w-full h-full' : 'top-20 bottom-0 right-0 w-[60%] md:w-[50%] lg:w-[45%] rounded-l-2xl border-t border-b'}
      `}
        >
            {/* Header Control Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 backdrop-blur-md border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-white font-medium text-sm tracking-wide">RA Activo</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button
                        onClick={() => onToggle(false)}
                        className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                        title="Cerrar Vista RA"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area (Viewer) */}
            <div className="flex-1 relative overflow-hidden bg-black">
                {children}

                {/* Overlay hint if not fullscreen */}
                {!isFullscreen && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-white/80 pointer-events-none">
                        Panel izquierdo sigue activo
                    </div>
                )}
            </div>
        </div>
    );
}
