import { useState, useMemo } from 'react';
import {
    Leaf, Droplets, Zap, DollarSign,
    TrendingUp, TrendingDown, Activity,
    MoreHorizontal, Download, Filter,
    LayoutGrid, Share2, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router';

// --- Theme & Constants ---
const THEME = {
    bg: '#0F1117',        // Carbon Black
    cardBg: '#161922',    // Slightly lighter card
    border: '#2A2E3B',    // Subtle border
    textMain: '#E2E8F0',
    textMuted: '#94A3B8',
    emerald: '#00D084',   // Neon Emerald
    teal: '#00B8D9',      // Cold Teal
    amber: '#FFB74D',     // Subtle Warning
    red: '#FF5252',
    grid: '#1E232F'
};

// --- Mock Data ---
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MAINTENANCE_DATA = [
    { month: 'Jan', preventative: 4200, emergency_roi: 1500 },
    { month: 'Feb', preventative: 4100, emergency_roi: 2200 },
    { month: 'Mar', preventative: 4300, emergency_roi: 3100 },
    { month: 'Apr', preventative: 4500, emergency_roi: 3800 },
    { month: 'May', preventative: 4200, emergency_roi: 4200 }, // Crossover
    { month: 'Jun', preventative: 4000, emergency_roi: 5600 },
    { month: 'Jul', preventative: 3800, emergency_roi: 6100 },
    { month: 'Aug', preventative: 3700, emergency_roi: 6800 },
    { month: 'Sep', preventative: 3900, emergency_roi: 7200 },
    { month: 'Oct', preventative: 4100, emergency_roi: 7500 },
    { month: 'Nov', preventative: 4400, emergency_roi: 8100 },
    { month: 'Dec', preventative: 4200, emergency_roi: 8900 },
];

const ZONES = [
    { name: 'Lobby', usage: 0.8 },
    { name: 'Office L1', usage: 0.65 },
    { name: 'Office L2', usage: 0.72 },
    { name: 'Server Rm', usage: 0.95 },
    { name: 'Cafeteria', usage: 0.4 },
    { name: 'Parking', usage: 0.3 },
    { name: 'Roof', usage: 0.5 },
    { name: 'HVAC Core', usage: 0.88 },
];

// --- Simple Chart Components ---

const GaugeChart = ({ value }: { value: number }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    // Arc is 240 degrees (2/3 circle)
    const offset = circumference * (1 - (240 / 360) * (value / 100));
    const fullOffset = circumference * (1 - (240 / 360));

    return (
        <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full transform rotate-[150deg]" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke="#1E232F"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={fullOffset}
                    strokeLinecap="round"
                />
                {/* Value Arc */}
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke={THEME.emerald}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
                <span className="text-3xl font-bold font-mono tracking-tighter" style={{ color: THEME.emerald }}>{value}</span>
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Score</span>
            </div>
        </div>
    );
};

const DonutChart = ({ percent }: { percent: number }) => {
    const radius = 30;
    const c = 2 * Math.PI * radius;
    const offset = c - (percent / 100) * c;

    return (
        <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="#1E232F" strokeWidth="6" />
                <circle
                    cx="40" cy="40" r={radius}
                    fill="none"
                    stroke={THEME.emerald}
                    strokeWidth="6"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {percent}%
            </div>
        </div>
    );
};

const DualLineChart = () => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const maxVal = 10000; // Y axis max
    const height = 250;
    const width = 800;
    const xStep = width / (MAINTENANCE_DATA.length - 1);
    const padding = 40;

    // Helper to get coordinates
    const getPoints = (key: 'preventative' | 'emergency_roi') => {
        return MAINTENANCE_DATA.map((d, i) => {
            const x = i * xStep;
            const y = height - (d[key] / maxVal) * height;
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <div className="w-full h-[300px] relative mt-4 select-none">
            {/* SVG Graph */}
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height + padding}`} overflow="visible">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                    <g key={tick}>
                        <line
                            x1="0" y1={height * tick}
                            x2={width} y2={height * tick}
                            stroke="#1E232F" strokeDasharray="4 4"
                        />
                        <text x="-10" y={height * tick + 4} fill="#64748B" fontSize="10" textAnchor="end">
                            ${((1 - tick) * maxVal / 1000).toFixed(0)}k
                        </text>
                    </g>
                ))}

                {/* Lines */}
                <polyline
                    points={getPoints('preventative')}
                    fill="none"
                    stroke={THEME.teal}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <polyline
                    points={getPoints('emergency_roi')}
                    fill="none"
                    stroke={THEME.amber}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Interactive Overlay & Tooltips */}
                {MAINTENANCE_DATA.map((d, i) => {
                    const x = i * xStep;
                    const y1 = height - (d.preventative / maxVal) * height;
                    const y2 = height - (d.emergency_roi / maxVal) * height;

                    const isHovered = hoverIndex === i;

                    return (
                        <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)} className="cursor-crosshair">
                            {/* Invisible Hit Area */}
                            <rect x={x - xStep / 2} y={0} width={xStep} height={height} fill="transparent" />

                            {/* Axis Label */}
                            <text x={x} y={height + 20} fill={isHovered ? '#fff' : '#64748B'} fontSize="11" textAnchor="middle" fontWeight={isHovered ? 'bold' : 'normal'}>
                                {d.month}
                            </text>

                            {/* Hover Elements */}
                            {isHovered && (
                                <>
                                    <line x1={x} y1={0} x2={x} y2={height} stroke="white" strokeOpacity="0.1" />

                                    {/* Teal Dot */}
                                    <circle cx={x} cy={y1} r="5" fill={THEME.bg} stroke={THEME.teal} strokeWidth="3" />
                                    {/* Amber Dot */}
                                    <circle cx={x} cy={y2} r="5" fill={THEME.bg} stroke={THEME.amber} strokeWidth="3" />

                                    {/* Tooltip ROI */}
                                    <foreignObject x={Math.min(x + 10, width - 150)} y={y2 - 50} width="140" height="60">
                                        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded shadow-xl text-xs">
                                            <div className="text-slate-400 mb-1">ROI (Emergency)</div>
                                            <div className="font-bold text-amber-400 text-lg">${d.emergency_roi.toLocaleString()}</div>
                                        </div>
                                    </foreignObject>
                                </>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="absolute top-0 right-0 flex gap-6 text-xs font-medium">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-1 rounded bg-teal-500" />
                    <span className="text-slate-400">Main. Cost</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-1 rounded bg-amber-400" />
                    <span className="text-slate-400">ROI (Savings)</span>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export default function SustainabilityDashboard() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="min-h-screen font-sans text-slate-200 selection:bg-emerald-500/30" style={{ backgroundColor: THEME.bg }}>

            {/* Top Navigation Bar */}
            <nav className="border-b border-indigo-950/50 bg-[#0F1117]/80 backdrop-blur-md sticky top-0 z-50 px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Leaf className="text-emerald-500 w-6 h-6" />
                        <span className="text-lg font-bold tracking-tight text-white uppercase font-mono">
                            Eco<span className="text-emerald-500">Dash</span>
                            <span className="text-xs ml-2 text-slate-500 font-normal normal-case tracking-normal border border-slate-800 px-2 py-0.5 rounded">v2.4.0 (Live)</span>
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex gap-1 bg-[#161922] p-1 rounded-lg border border-white/5">
                        {['Overview', 'Energy', 'Water', 'Waste', 'Supply Chain'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${activeTab === tab.toLowerCase()
                                        ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-2 text-xs border-r border-slate-800 pr-4">
                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                        <span>Grid Status: <span className="text-emerald-400 font-semibold">Optimal</span></span>
                    </div>
                    <button className="hover:text-white"><SearchIcon /></button>
                    <button className="hover:text-white"><Share2 className="w-4 h-4" /></button>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-emerald-500 transition-colors">
                        VA
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="p-8 max-w-[1920px] mx-auto grid grid-cols-12 gap-6">

                {/* Header Section */}
                <div className="col-span-12 flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-white mb-1">Building Efficiency Overview</h1>
                        <p className="text-sm text-slate-500">Real-time sustainability metrics for <span className="text-slate-300 font-mono">HQ_TOWER_ALPHA</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#161922] border border-white/10 rounded text-xs font-medium text-slate-300 hover:bg-white/5">
                            <Filter className="w-3 h-3" /> Filter View
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded text-xs font-medium text-emerald-400 hover:bg-emerald-600/20">
                            <Download className="w-3 h-3" /> Export Report
                        </button>
                        <Link to="/digital-twin" className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded text-xs font-medium text-blue-400 hover:bg-blue-600/20">
                            <LayoutGrid className="w-3 h-3" /> View Twin
                        </Link>
                    </div>
                </div>

                {/* --- LEFT COLUMN: KPIs (3 cols) --- */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">

                    {/* KPI 1: Building Health */}
                    <Card className="flex flex-col items-center justify-center py-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-50"><Activity className="w-5 h-5 text-slate-600" /></div>
                        <GaugeChart value={92} />
                        <div className="mt-4 text-center">
                            <div className="text-emerald-400 text-sm font-medium flex items-center justify-center gap-1">
                                <TrendingUp className="w-3 h-3" /> +2.4%
                            </div>
                            <div className="text-slate-500 text-xs mt-1">vs Previous Month</div>
                        </div>
                        {/* Decorative glow */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500/20 shadow-[0_0_20px_rgba(0,208,132,0.4)]" />
                    </Card>

                    {/* KPI 2: Energy Loss Avoided */}
                    <Card>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">
                                Year To Date
                            </span>
                        </div>
                        <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-1">Loss Avoided</div>
                        <div className="text-3xl font-bold text-white flex items-baseline gap-1">
                            $14,200 <span className="text-sm text-slate-600 font-normal">/ yr</span>
                        </div>
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {/* Mini Bars */}
                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="w-3 bg-slate-800 rounded-sm flex items-end h-8">
                                    <div style={{ height: `${h}%` }} className="w-full bg-emerald-500/80 rounded-sm hover:bg-emerald-400 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* KPI 3: Carbon Footprint */}
                    <Card className="flex items-center gap-6">
                        <DonutChart percent={15} />
                        <div>
                            <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider">Carbon Offset</div>
                            <div className="text-2xl font-bold text-white mb-1">1,204 <span className="text-xs text-slate-500">tCO2e</span></div>
                            <div className="text-[10px] text-slate-400 leading-tight max-w-[120px]">
                                Equivalent to <span className="text-white font-medium">4,500 trees</span> planted this year.
                            </div>
                        </div>
                    </Card>

                </div>

                {/* --- CENTER COLUMN: Main Chart (6 cols) --- */}
                <div className="col-span-12 lg:col-span-7">
                    <Card className="h-full">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    Maintenance ROI Analysis
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Comparing proactive maintenance costs vs emergency repair savings.</p>
                            </div>
                            <div className="flex bg-[#0F1117] rounded-md p-1 border border-white/5">
                                <button className="px-3 py-1 text-[10px] font-medium text-white bg-slate-800 rounded shadow-sm">12M</button>
                                <button className="px-3 py-1 text-[10px] font-medium text-slate-500 hover:text-white">6M</button>
                                <button className="px-3 py-1 text-[10px] font-medium text-slate-500 hover:text-white">30D</button>
                            </div>
                        </div>

                        {/* Dual Chart */}
                        <DualLineChart />

                        {/* Chart Insights */}
                        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
                            <InsightItem label="Total Savings" value="$84,200" trend="+12%" />
                            <InsightItem label="Critical Failures" value="0" trend="-100%" trendGood />
                            <InsightItem label="Energy Efficiency" value="A+" sub="Top 5% Peer Group" />
                        </div>
                    </Card>
                </div>

                {/* --- RIGHT COLUMN: Secondary Info (3 cols) --- */}
                <div className="col-span-12 lg:col-span-2 flex flex-col gap-6">

                    {/* Zone Consumption Map */}
                    <Card className="flex-1 min-h-[250px]">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <LayoutGrid className="w-3 h-3" /> Zone Load
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {ZONES.map((zone, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div
                                        className="h-16 rounded border border-white/5 flex items-center justify-center relative overflow-hidden transition-all group-hover:border-white/20"
                                        style={{ backgroundColor: `rgba(0, 208, 132, ${zone.usage * 0.3})` }}
                                    >
                                        <div className="absolute bottom-1 right-2 text-[10px] font-bold text-white/90">{(zone.usage * 100).toFixed(0)}%</div>
                                        <div className="text-[9px] text-white/50 uppercase font-medium absolute top-2 left-2">{zone.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-[10px] text-slate-500 text-center">
                            Showing real-time HVAC load distribution.
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h4>
                        <div className="space-y-2">
                            <ActionButton icon={Leaf} label="Optimise HVAC" />
                            <ActionButton icon={Droplets} label="Water Audit" />
                            <ActionButton icon={HelpCircle} label="System Diag" />
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
}

// --- Helper Components ---

function Card({ children, className = "" }: any) {
    return (
        <div className={`bg-[#161922] border border-[#2A2E3B] rounded-xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 ${className}`}>
            {children}
        </div>
    );
}

function InsightItem({ label, value, trend, trendGood, sub }: any) {
    return (
        <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">{label}</div>
            <div className="text-xl font-bold text-slate-200 mt-0.5">{value}</div>
            {trend && (
                <div className={`text-xs font-medium flex items-center gap-1 ${trendGood !== false ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {trendGood !== false ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend}
                </div>
            )}
            {sub && <div className="text-[10px] text-emerald-400 mt-1">{sub}</div>}
        </div>
    )
}

function ActionButton({ icon: Icon, label }: any) {
    return (
        <button className="w-full flex items-center justify-between p-2 rounded hover:bg-white/5 border border-transparent hover:border-white/5 group transition-all">
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                    <Icon className="w-3 h-3" />
                </div>
                <span className="text-xs text-slate-300 font-medium">{label}</span>
            </div>
            <MoreHorizontal className="w-3 h-3 text-slate-600" />
        </button>
    )
}

function SearchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    )
}
