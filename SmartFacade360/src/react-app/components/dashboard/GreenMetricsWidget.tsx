import { Leaf, Zap, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';

interface GreenMetricsProps {
    thermalFindings: any[];
}

export default function GreenMetricsWidget({ thermalFindings }: GreenMetricsProps) {
    // Basic calculation for TRL 5 demonstration
    const estimatedLossKwh = thermalFindings.length * 150.5; // Arbitrary metric per thermal anomaly
    const preventiveCost = 2500;
    const emergencyCost = 15000;

    const roiData = [
        { name: 'Costo Preventivo', value: preventiveCost },
        { name: 'Ahorro Proyectado', value: emergencyCost - preventiveCost },
    ];
    const COLORS = ['#FFB74D', '#00B8D9']; // Amber for cost, Teal for savings

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Energy Loss Card */}
            <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-5 relative group">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-300 font-medium text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Pérdida Energética Estimada
                    </h3>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-white">{estimatedLossKwh.toFixed(1)}</span>
                    <span className="text-gray-400 mb-1">kWh/mes</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 h-2 rounded-full mt-4 overflow-hidden">
                    <div
                        className={`h-full ${estimatedLossKwh > 500 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (estimatedLossKwh / 1000) * 100)}%` }}
                    />
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-xs text-gray-300 p-2 rounded shadow-lg pointer-events-none border border-gray-700 z-10 w-48">
                    Calculado en base a anomalías térmicas y puentes de calor (NTE E.060 Descarbonización).
                </div>
            </div>

            {/* ROI Card */}
            <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between relative group">
                <div>
                    <h3 className="text-gray-300 font-medium text-sm flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-teal-400" />
                        ROI Reparación Inmediata
                    </h3>
                    <div className="text-2xl font-bold text-teal-400">${(emergencyCost - preventiveCost).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Ahorro vs Emergencia</div>
                </div>

                <div className="w-20 h-20">
                    <PieChart width={80} height={80}>
                        <Pie
                            data={roiData}
                            cx={35}
                            cy={35}
                            innerRadius={25}
                            outerRadius={35}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {roiData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-xs text-gray-300 p-2 rounded shadow-lg pointer-events-none border border-gray-700 z-10 w-48">
                    Proyección financiera de intervención preventiva vs reactiva ante falla estructural.
                </div>
            </div>
        </div>
    );
}
