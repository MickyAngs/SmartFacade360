
import { useState } from 'react';
import { Material } from '../../services/MaterialService';
import { ValidationService } from '../../services/ValidationService';
import { Info, Thermometer, Box, X } from 'lucide-react';

interface TechSheetProps {
    material: Material;
    onClose: () => void;
}

export default function TechSheet({ material, onClose }: TechSheetProps) {
    const [showJson, setShowJson] = useState(false);

    const handleDownloadSpecs = () => {
        ValidationService.logUserInteraction('download_spec', material.id, { material_name: material.name });
        // Mock download action or expand JSON
        setShowJson(!showJson);
    };

    // Safe checks for nulls using data driven design
    const co2 = material.co2_footprint ?? 0;
    const thermal = material.thermal_conductivity ?? 0;
    const sustainabilityScore = material.sustainability_score ?? 0;

    let scoreColor = '#ef4444'; // red
    if (sustainabilityScore > 50) scoreColor = '#eab308'; // yellow
    if (sustainabilityScore > 80) scoreColor = '#22c55e'; // green

    return (
        <div className="absolute top-20 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-6 rounded-xl shadow-2xl w-80 text-white z-50 animate-in slide-in-from-right">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Ficha Técnica
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{material.name}</h3>
                {material.tech_transfer_summary && (
                    <p className="text-xs text-slate-400 mb-2 italic">
                        {material.tech_transfer_summary}
                    </p>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Box size={14} />
                    <span>Durabilidad: {material.durability_years} años</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Eco-Calculator Section */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 rounded-bl-lg">
                        <span className="text-[10px] text-emerald-400 font-bold px-1">ECO-CALCULATOR</span>
                    </div>

                    {/* Carbon Savings */}
                    <div className="mb-4" data-testid="kpi-carbon-footprint">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs text-slate-400">Ahorro de Carbono vs Tradicional</span>
                            <span className="text-sm font-bold text-emerald-400">
                                {(60 - co2).toFixed(1)} kg/m²
                            </span>
                        </div>
                        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                            {/* Reference Marker (Traditional = 60) */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-red-400/50 z-10" style={{ left: '80%' }} title="Ladrillo Tradicional (60kg)"></div>
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.max(0, ((60 - co2) / 60) * 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>Material Actual ({co2})</span>
                            <span>Ref: Ladrillo (60)</span>
                        </div>
                    </div>

                    {/* Thermal Efficiency Visualization */}
                    <div data-testid="kpi-thermal-conductivity">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1"><Thermometer size={12} /> Eficiencia Térmica</span>
                            <span className="text-sm font-bold text-blue-400">{thermal} W/mK</span>
                        </div>
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full opacity-80"></div>
                        <div className="relative w-full h-2">
                            <div
                                className="absolute top-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white transform -translate-x-1/2 transition-all duration-500"
                                style={{ left: `${Math.min(100, (thermal / 2.5) * 100)}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-center text-slate-400 mt-1">
                            {thermal < 0.5 ? 'Aislamiento Superior' : 'Conductividad Estándar'}
                        </div>
                    </div>
                </div>

                {/* Legacy stats display (Sustainability Score) */}
                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50" data-testid="kpi-sustainability-score">
                    <span className="text-sm text-slate-400">Puntuación Sostenibilidad</span>
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-500"
                                style={{ width: `${sustainabilityScore}%`, backgroundColor: scoreColor }}
                            />
                        </div>
                        <span className="font-mono font-bold text-white text-sm">{sustainabilityScore}/100</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleDownloadSpecs}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors border border-slate-600"
            >
                <Info size={18} />
                {showJson ? 'Ocultar Specs' : 'Info Técnica Completa'}
            </button>

            {showJson && material.tech_specs && (
                <div className="mt-4 p-3 bg-black/50 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800">
                    <pre>{JSON.stringify(material.tech_specs, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
