import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, TrendingUp, Leaf, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import { Finding } from '@/react-app/hooks/useRealtimeFindings';

interface ROIAnalyzerProps {
    buildingId: string;
    findings: Finding[];
}

export default function ROIAnalyzer({ buildingId, findings }: ROIAnalyzerProps) {
    const [operationalData, setOperationalData] = useState({ tradCost: 0, sfCost: 0, savings: 0, savingsPercent: 0 });
    const [greenData, setGreenData] = useState({ energyLossInSoles: 0 });
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        // 1. Cálculo de Ahorro Operativo
        const baseDays = findings.length > 5 ? 20 : 15;
        const tradCost = (500 * baseDays) + (200 * 4 * baseDays); // Andamios + 4 Técnicos
        const sfCost = (100 * 2) + (50 * 2); // Dron (2h) + Operador (2h)
        const savings = tradCost - sfCost;
        const savingsPercent = (savings / tradCost) * 100;

        setOperationalData({ tradCost, sfCost, savings, savingsPercent });

        // 2. Cálculo de Green AI (Pérdida Energética)
        const exchangeRate = 3.7; // 1 USD = 3.7 PEN
        const kWhFactor = 0.5; // 0.5 kWh por mm de desviación térmica
        const thermalLossSoles = findings
            .filter(f => f.pathology_type === 'thermal' || f.pathology_type === 'thermal_anomaly')
            .reduce((acc, f) => acc + (f.metric_deviation * kWhFactor * 365 * exchangeRate), 0);

        setGreenData({ energyLossInSoles: thermalLossSoles });

        // 3. Proyección de Depreciación vs Costo (Recharts)
        const totalSeverityScore = findings.reduce((acc, f) => {
            switch (f.severity_level) {
                case 'critical': return acc + 40;
                case 'high': return acc + 25;
                case 'medium': return acc + 15;
                default: return acc + 5;
            }
        }, 0);

        // Proyectamos a Hoy, +1 Mes, +3 Meses, +6 Meses
        const data = [
            { name: 'Hoy', costoIntervencion: sfCost, depreciacion: totalSeverityScore * 10 },
            { name: '+1 Mes', costoIntervencion: sfCost * 1.5, depreciacion: totalSeverityScore * 25 },
            { name: '+3 Meses', costoIntervencion: sfCost * 3, depreciacion: totalSeverityScore * 60 },
            { name: '+6 Meses', costoIntervencion: sfCost * 8, depreciacion: totalSeverityScore * 150 },
        ];
        setChartData(data);

    }, [findings]);

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("Reporte de Valorización de Activos (PROTTOM)", 20, 20);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`ID Edificio: ${buildingId}`, 20, 30);
            doc.text(`Ahorro Operativo Estimado: $${operationalData.savings.toFixed(2)} (${operationalData.savingsPercent.toFixed(1)}%)`, 20, 40);
            doc.text(`Pérdida Energética Anual (Green AI): S/ ${greenData.energyLossInSoles.toFixed(2)}`, 20, 50);

            doc.setFont("helvetica", "bold");
            doc.text("Conclusión:", 20, 70);
            doc.setFont("helvetica", "normal");
            doc.text("Reparar hoy es exponencialmente más barato que enfrentar la depreciación estructural.", 20, 80);

            doc.save(`building_${buildingId}_roi_report.pdf`);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="bg-black/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl w-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-gray-400 font-medium text-sm tracking-wider uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" /> Valorización & ROI (NTE E.060)
                </h2>
                <button
                    onClick={handleExportPDF}
                    title="Generar Reporte de Transferencia"
                    className="p-2 bg-gray-800 hover:bg-teal-900/50 border border-gray-700 hover:border-teal-400/50 rounded-lg transition-all text-gray-300 hover:text-teal-300"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Operative Savings */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 relative group" title="Basado en el método tradicional versus inspección con drón (NTE E.060)">
                    <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs uppercase font-semibold">
                        <DollarSign className="w-4 h-4 text-emerald-400" /> Ahorro Operativo
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        ${operationalData.savings.toLocaleString('en-US')}
                    </div>
                    <div className={`text-sm font-medium ${operationalData.savingsPercent > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        +{operationalData.savingsPercent.toFixed(1)}% vs. Tradicional
                    </div>
                </div>

                {/* Green AI */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 relative group" title="Estimado por Green AI; reduce huella carbono 15%">
                    <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs uppercase font-semibold">
                        <Leaf className="w-4 h-4 text-lime-400" /> Pérdida Energética (Green AI)
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        S/ {greenData.energyLossInSoles.toLocaleString('es-PE', { maximumFractionDigits: 0 })} <span className="text-sm font-normal text-gray-500">/ año</span>
                    </div>
                    {/* Impact Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                            className={`h-1.5 rounded-full ${greenData.energyLossInSoles > 1000 ? 'bg-red-500' : 'bg-lime-500'}`}
                            style={{ width: `${Math.min((greenData.energyLossInSoles / 5000) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-grow w-full h-56 mt-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                            itemStyle={{ color: '#E5E7EB' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="costoIntervencion" name="Costo Intervención" stroke="#34D399" strokeWidth={3} dot={{ r: 4, fill: '#34D399', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="depreciacion" name="Depreciación" stroke="#F87171" strokeWidth={3} dot={{ r: 4, fill: '#F87171', strokeWidth: 0 }} />
                    </LineChart>
                </ResponsiveContainer>
                {/* Annotation */}
                <div className="absolute top-2 right-4 text-[10px] text-gray-500 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">
                    Reparar hoy es hasta 10x más barato
                </div>
            </div>
        </div>
    );
}
