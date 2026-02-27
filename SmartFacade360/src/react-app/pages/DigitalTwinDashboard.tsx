import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';
import {
    Activity, Thermometer, Zap,
    TrendingUp, Server,
    Maximize2, ShieldAlert, Smartphone
} from 'lucide-react';
import { Link } from 'react-router';

// --- Theme Constants ---
const THEME = {
    bg: '#0A0F1A',
    teal: '#00F5D4',
    amber: '#FF9500',
    red: '#FF3B30',
    glass: 'rgba(16, 23, 42, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
};

// --- 3D Components ---

function BuildingTwin() {
    const group = useRef<THREE.Group>(null);

    // Slow rotation
    useFrame((_state, delta) => {
        if (group.current) {
            group.current.rotation.y += delta * 0.05;
        }
    });

    // Generate floors
    const floors = useMemo(() => new Array(15).fill(0).map((_, i) => ({
        y: i * 0.8 - 6,
        isCritical: i === 12 || i === 5 // Specific floors with issues
    })), []);

    return (
        <group ref={group}>
            {/* Central Core */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.5, 12, 1.5]} />
                <meshPhysicalMaterial
                    color="#1e293b"
                    roughness={0.2}
                    metalness={0.8}
                    transparent
                    opacity={0.8}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Building Frame / Wireframe */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[3, 12, 3]} />
                <meshBasicMaterial color={THEME.teal} wireframe transparent opacity={0.15} />
            </mesh>

            {/* Floors */}
            {floors.map((floor, idx) => (
                <group key={idx} position={[0, floor.y, 0]}>
                    {/* Floor Plate */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[2.8, 2.8]} />
                        <meshBasicMaterial color={floor.isCritical ? THEME.red : THEME.teal} transparent opacity={0.2} side={THREE.DoubleSide} />
                    </mesh>

                    {/* Wireframe Outline */}
                    <lineSegments>
                        <edgesGeometry args={[new THREE.BoxGeometry(2.8, 0.1, 2.8)]} />
                        <lineBasicMaterial color={floor.isCritical ? THEME.red : THEME.teal} transparent opacity={0.4} />
                    </lineSegments>

                    {/* Risk Heatmap Blob (if critical) */}
                    {floor.isCritical && (
                        <mesh position={[0.5, 0.2, 0.5]}>
                            <sphereGeometry args={[0.8, 16, 16]} />
                            <meshBasicMaterial color={THEME.red} transparent opacity={0.3} wireframe />
                        </mesh>
                    )}
                </group>
            ))}

            {/* Dynamic Data Particles around building */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <points position={[0, 0, 0]}>
                    <sphereGeometry args={[4, 64, 64]} />
                    <pointsMaterial color={THEME.teal} size={0.015} transparent opacity={0.4} />
                </points>
            </Float>
        </group>
    );
}

// --- UI Components ---

const GlassPanel = ({ children, className = "", title, icon: Icon, alertLevel = 'none' }: any) => {
    const borderColor = alertLevel === 'high' ? 'border-red-500/50' :
        alertLevel === 'medium' ? 'border-amber-500/50' :
            'border-white/10';

    const glow = alertLevel === 'high' ? 'shadow-[0_0_15px_rgba(255,59,48,0.2)]' :
        alertLevel === 'medium' ? 'shadow-[0_0_15px_rgba(255,149,0,0.2)]' : '';

    return (
        <div className={`backdrop-blur-xl bg-slate-900/60 border ${borderColor} ${glow} rounded-sm p-4 text-white font-mono ${className}`}>
            {title && (
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold">
                        {Icon && <Icon className="w-3 h-3" />}
                        {title}
                    </div>
                    {alertLevel !== 'none' && (
                        <div className={`w-2 h-2 rounded-full animate-pulse ${alertLevel === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    )}
                </div>
            )}
            {children}
        </div>
    );
};

const MiniChartLine = ({ color = THEME.teal, data }: { color: string, data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d - min) / (max - min || 1)) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none">
            {/* Gradient Fill */}
            <defs>
                <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
                </linearGradient>
            </defs>
            <path d={`M0,100 L0,${100 - ((data[0] - min) / (max - min || 1)) * 100} ${points.split(' ').map((p) => `L${p}`).join(' ')} L100,100 Z`} fill={`url(#grad-${color})`} />
            {/* Line */}
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {/* Highlight Red Peak */}
            {color === THEME.red && (
                <circle cx={points.split(' ')[6].split(',')[0]} cy={points.split(' ')[6].split(',')[1]} r="3" fill="#ef4444" className="animate-ping" />
            )}
        </svg>
    );
};

// --- Main Page ---

export default function DigitalTwinDashboard() {
    const [dataStream, setDataStream] = useState([40, 42, 35, 60, 85, 45, 30, 40, 38]);
    const [tempData, setTempData] = useState(42.3);
    const [isExpanded, setIsExpanded] = useState(true); // Controla la vista de marco móvil vs full screen

    // Simulation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setDataStream(prev => [...prev.slice(1), 30 + Math.random() * 50]);
            setTempData(_prev => 42 + (Math.random() - 0.5));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`min-h-screen transition-all duration-500 flex justify-center items-center ${isExpanded ? 'bg-slate-800 py-4 sm:py-8' : THEME.bg}`} style={{ backgroundColor: !isExpanded ? THEME.bg : '' }}>

            {/* Main Container - Mobile Frame or Fullscreen */}
            <div className={`flex flex-col relative overflow-hidden transition-all duration-500 ease-in-out ${isExpanded
                ? 'w-[375px] h-[812px] max-h-[95vh] rounded-[2rem] sm:rounded-[2.5rem] border-[6px] sm:border-[8px] border-slate-700 shadow-2xl relative custom-scrollbar'
                : 'w-full h-screen'
                }`} style={{ backgroundColor: THEME.bg }}>

                {/* Notch for mobile view */}
                {isExpanded && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-2.5 bg-slate-700 rounded-b-lg z-50"></div>}

                <div className={`h-full w-full relative ${isExpanded ? 'pt-3 overflow-y-auto' : ''}`}>
                    <div className="absolute inset-0 z-0">
                        <Canvas className="canvas">
                            <PerspectiveCamera makeDefault position={[5, 4, 8]} fov={45} />
                            <OrbitControls autoRotate autoRotateSpeed={0.5} enablePan={false} maxPolarAngle={Math.PI / 1.5} />
                            <ambientLight intensity={0.5} />
                            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color={THEME.teal} />
                            <pointLight position={[-10, -10, -10]} intensity={0.5} color={THEME.amber} />

                            <BuildingTwin />
                            <Grid args={[20, 20]} cellColor={THEME.teal} sectionColor={THEME.bg} fadeDistance={20} position={[0, -6, 0]} />
                            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                            <Environment preset="night" />
                        </Canvas>
                    </div>

                    {/* Header UI */}
                    <header className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-6 py-4 pointer-events-none">
                        <div className="flex items-center gap-4 pointer-events-auto">
                            <div className="border border-teal-500/30 bg-teal-500/10 p-2 rounded-sm backdrop-blur-sm">
                                <Maximize2 className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-widest uppercase font-mono">
                                    SmartTower<span className="text-teal-400">OS</span>
                                </h1>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    Connected
                                    <span className="text-slate-600">///</span>
                                    Latency: 12ms
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 pointer-events-auto">
                            <Link to="/" className="px-6 py-2 border border-slate-700 hover:border-teal-500 text-slate-300 hover:text-white bg-slate-900/80 backdrop-blur transition-all uppercase tracking-widest text-[10px] hover:shadow-[0_0_15px_rgba(0,245,212,0.3)]">
                                Close Module
                            </Link>
                        </div>
                    </header>

                    {/* Main UI Layout */}
                    <div className="absolute inset-x-0 bottom-0 top-20 p-6 flex justify-between pointer-events-none">

                        {/* Left Panel: IoT Data Streams */}
                        <div className="w-80 flex flex-col gap-4 pointer-events-auto">
                            <GlassPanel title="Vibration Analysis [Z-Axis]" icon={Activity} alertLevel="high">
                                <div className="mb-2 flex justify-between items-end">
                                    <span className="text-3xl font-bold text-white font-mono">0.42g</span>
                                    <span className="text-red-400 text-xs font-bold uppercase animate-pulse">Critical Peak</span>
                                </div>
                                <MiniChartLine color={THEME.red} data={dataStream} />
                                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                    <p>Sensor: ACC_Elevator_04</p>
                                    <p>Timestamp: T-minus 0s</p>
                                </div>
                            </GlassPanel>

                            <GlassPanel title="EMF Cable Fatigue" icon={Zap} alertLevel="medium">
                                <div className="flex justify-between text-xs mb-1 text-amber-200">
                                    <span>Load</span>
                                    <span>87%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-amber-500 w-[87%] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-amber-500/80 font-mono uppercase border border-amber-500/30 p-1 inline-block rounded-sm">
                                    ⚠️ Voltage Spike Detected
                                </p>
                            </GlassPanel>

                            <GlassPanel title="Facade Thermal Map" icon={Thermometer}>
                                <div className="flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-900 via-purple-900 to-red-500 rounded border border-white/10 relative overflow-hidden flex items-center justify-center">
                                        <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                                        <span className="font-bold text-white drop-shadow-md z-10">HOT</span>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-white font-mono">{tempData.toFixed(1)}°C</div>
                                        <div className="text-xs text-slate-400">Deviation: <span className="text-red-400">+4.2°C</span></div>
                                        <div className="text-[10px] text-slate-500 mt-1 uppercase">Zone: NE_Panel_14</div>
                                    </div>
                                </div>
                            </GlassPanel>
                        </div>

                        {/* Right Panel: KPIs & Timeline */}
                        <div className="w-80 flex flex-col gap-4 pointer-events-auto">
                            <GlassPanel title="System Status" icon={Server}>
                                <div className="grid grid-cols-2 gap-2 text-center mb-4">
                                    <div className="bg-slate-800/50 p-2 rounded border border-teal-500/20">
                                        <div className="text-teal-400 text-xl font-bold">98.2%</div>
                                        <div className="text-[10px] text-slate-400 uppercase">Uptime</div>
                                    </div>
                                    <div className="bg-slate-800/50 p-2 rounded border border-amber-500/20">
                                        <div className="text-amber-500 text-xl font-bold">3</div>
                                        <div className="text-[10px] text-slate-400 uppercase">Alerts</div>
                                    </div>
                                </div>
                                <div className="space-y-2 font-mono text-xs">
                                    <div className="flex justify-between items-center border-l-2 border-teal-500 pl-2 bg-teal-500/5 py-1">
                                        <span className="text-slate-300">HVAC Pressure</span>
                                        <span className="text-teal-400">Normal</span>
                                    </div>
                                    <div className="flex justify-between items-center border-l-2 border-teal-500 pl-2 bg-teal-500/5 py-1">
                                        <span className="text-slate-300">Grid Consumption</span>
                                        <span className="text-teal-400">Optimal</span>
                                    </div>
                                    <div className="flex justify-between items-center border-l-2 border-red-500 pl-2 bg-red-500/10 py-1">
                                        <span className="text-slate-300">Fire Suppression</span>
                                        <span className="text-red-400 animate-pulse">Check req.</span>
                                    </div>
                                </div>
                            </GlassPanel>

                            <GlassPanel title="Event Timeline" icon={TrendingUp}>
                                <div className="relative pl-4 border-l border-slate-700 space-y-4">
                                    {[
                                        { t: '10:42:05', msg: 'Structural vibration detected in Sector 4', type: 'critical' },
                                        { t: '10:40:12', msg: 'Routine HVAC cycle completed', type: 'info' },
                                        { t: '10:35:00', msg: 'Visitor access granted: Gate B', type: 'info' },
                                    ].map((evt, i) => (
                                        <div key={i} className="relative">
                                            <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${evt.type === 'critical' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-teal-500'}`} />
                                            <div className="text-[10px] text-slate-500 font-mono mb-0.5">{evt.t}</div>
                                            <div className={`text-xs ${evt.type === 'critical' ? 'text-white font-semibold' : 'text-slate-300'}`}>
                                                {evt.msg}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassPanel>

                            <div className="mt-auto backdrop-blur-md bg-gradient-to-r from-teal-900/50 to-slate-900/50 p-4 border-t border-teal-500/30">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <ShieldAlert className="w-8 h-8 text-teal-400" />
                                        <div>
                                            <div className="text-xs uppercase text-teal-400 font-bold tracking-widest">AI Audit Active</div>
                                            <div className="text-[10px] text-slate-400">Scanning for structural anomalies...</div>
                                        </div>
                                    </div>

                                    {/* Botón de Certificación Forense */}
                                    <button
                                        onClick={async () => {
                                            const { toast } = await import('react-hot-toast');
                                            const loadingToast = toast.loading('Generando Hash Criptográfico y PDF...');
                                            try {
                                                const token = localStorage.getItem('supabase.auth.token') || '';
                                                const response = await fetch('/api/v1/report/generate', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    // Se usa un UUID simulado temporal o real si existe en contexto
                                                    body: JSON.stringify({ inspectionId: '123e4567-e89b-12d3-a456-426614174000', format: 'pdf' })
                                                });

                                                if (!response.ok) throw new Error('Error al generar certificado');

                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `certificado_inspeccion_123e4567.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                toast.dismiss(loadingToast);
                                                toast.success('Certificado inalterable descargado (ISO 27037)');
                                            } catch (err: any) {
                                                toast.dismiss(loadingToast);
                                                toast.error(err.message || 'Error al generar evidencia');
                                            }
                                        }}
                                        className="w-full relative group overflow-hidden border border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20 py-2.5 rounded-sm transition-all"
                                    >
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                        <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-shine" />                            </button>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Mobile Preview Toggle Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="fixed bottom-4 right-4 bg-teal-500/20 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-teal-500/50 text-teal-400 hover:text-teal-300 hover:scale-105 transition-all z-50 pointer-events-auto"
                    title={!isExpanded ? "Previsualizar todo en Móvil" : "Volver a Vista Completa"}
                >
                    {isExpanded ? <Maximize2 size={24} strokeWidth={2.5} /> : <Smartphone size={24} strokeWidth={2.5} />}
                </button>

                {/* Helper text when in mobile frame to exit */}
                {isExpanded && (
                    <div className="absolute top-2 right-2 text-[10px] text-slate-500 opacity-50 z-50">
                        Vista Móvil
                    </div>
                )}
            </div>
        </div>
    );
}
