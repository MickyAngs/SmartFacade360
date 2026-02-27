import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { HeartPulse } from 'lucide-react';

interface HealthGaugeProps {
    score: number;
}

export default function HealthGauge({ score }: HealthGaugeProps) {
    // Calculate coloring based on PROTTOM guidelines
    let color = '#22c55e'; // Green stable
    let statusText = 'Estable';
    if (score < 60) {
        color = '#ef4444'; // Red critical
        statusText = 'Crítico';
    } else if (score <= 80) {
        color = '#f59e0b'; // Amber medium
        statusText = 'Atención';
    }

    const data = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];

    return (
        <div className="relative w-64 h-64 mx-auto flex flex-col items-center justify-center group">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        startAngle={180}
                        endAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell key="cell-0" fill={color} className="transition-all duration-1000 ease-in-out" />
                        <Cell key="cell-1" fill="#1f2937" /> {/* Dark background track */}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            {/* Center Content */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[20px] flex flex-col items-center">
                <HeartPulse className="w-8 h-8 mb-2" style={{ color }} />
                <span className="text-5xl font-bold text-white drop-shadow-lg">{Math.round(score)}</span>
                <span className="text-sm font-medium mt-1 uppercase tracking-widest" style={{ color }}>{statusText}</span>
            </div>

            {/* Tooltip on Hover */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-3 py-2 rounded-lg pointer-events-none whitespace-nowrap z-10 border border-white/10 backdrop-blur-sm">
                Score basado en findings.<br />
                Penalización por desviación &gt;5mm (NTE E.060 Art. 10.4)
            </div>
        </div>
    );
}
