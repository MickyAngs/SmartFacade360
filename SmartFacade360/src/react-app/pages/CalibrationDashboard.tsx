import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { View, OrbitControls, Center, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Handshake, Activity, Ruler, Target, CheckCircle, Smartphone } from 'lucide-react';
import { Link } from 'react-router';

// --- Procedural Assets ---

function ProceduralBuilding({ mode }: { mode: 'cloud' | 'bim' }) {
    const meshRef = useRef<THREE.Group>(null);

    // Rotate slowly
    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.1;
        }
    });

    const buildingGeometry = useMemo(() => new THREE.BoxGeometry(2, 5, 2), []);

    // Create point cloud data
    const particles = useMemo(() => {
        const count = 5000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Random points within a box roughly 2x5x2
            const x = (Math.random() - 0.5) * 2;
            const y = (Math.random() - 0.5) * 5;
            const z = (Math.random() - 0.5) * 2;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Color based on height (y) for some variation
            // Concrete/Glass colors: Gray to slightly blueish
            const mix = (y + 2.5) / 5;
            colors[i * 3] = 0.5 + mix * 0.2; // R
            colors[i * 3 + 1] = 0.5 + mix * 0.2; // G
            colors[i * 3 + 2] = 0.6 + mix * 0.3; // B
        }
        return { positions, colors };
    }, []);

    if (mode === 'cloud') {
        return (
            <group ref={meshRef}>
                <points>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[particles.positions, 3]}
                        />
                        <bufferAttribute
                            attach="attributes-color"
                            args={[particles.colors, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        size={0.03}
                        vertexColors
                        transparent
                        opacity={0.8}
                        sizeAttenuation
                        depthWrite={false}
                    />
                </points>
                {/* Subtle holographic grid floor for cloud side */}
                <Grid position={[0, -2.5, 0]} args={[10, 10]} cellColor="white" sectionColor="white" fadeDistance={10} infiniteGrid />
            </group>
        );
    }

    return (
        <group ref={meshRef}>
            <Center>
                <mesh geometry={buildingGeometry}>
                    <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.3} />
                </mesh>
                {/* Inner "structure" to make it look complex */}
                <mesh scale={[0.9, 0.98, 0.9]}>
                    <boxGeometry args={[2, 5, 2]} />
                    <meshBasicMaterial color="#a0aec0" wireframe transparent opacity={0.1} />
                </mesh>
            </Center>
            <Grid position={[0, -2.5, 0]} args={[10, 10]} cellColor="#10b981" sectionColor="#10b981" fadeDistance={10} infiniteGrid />
        </group>
    );
}

// --- Main Page Component ---

export default function CalibrationDashboard() {
    const container = useRef<HTMLDivElement>(null!);
    const view1 = useRef<HTMLDivElement>(null!);
    const view2 = useRef<HTMLDivElement>(null!);

    return (
        <div ref={container} className="relative w-full h-screen bg-slate-900 overflow-hidden font-mono text-xs md:text-sm">

            {/* 3D Canvas Layer */}
            <div className="absolute inset-0 z-0">
                <Canvas eventSource={container} className="canvas">
                    <View track={view1}>
                        <color attach="background" args={['#0f172a']} />
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <ProceduralBuilding mode="cloud" />
                        <OrbitControls makeDefault />
                        <Environment preset="city" />
                        {/* Post-processing could go here: glitch, noise, etc */}
                    </View>
                    <View track={view2}>
                        <color attach="background" args={['#020617']} /> {/* Slightly darker for contrast */}
                        <ambientLight intensity={0.8} />
                        <ProceduralBuilding mode="bim" />
                        <OrbitControls makeDefault />
                    </View>
                </Canvas>
            </div>

            {/* HTML Interface Layer */}
            <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">

                {/* Header */}
                <header className="flex justify-between items-center p-4 border-b border-blue-900/50 bg-slate-900/80 backdrop-blur-md pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                        <h1 className="text-xl font-bold tracking-widest text-blue-100 uppercase">
                            PropTech<span className="text-blue-500">Vision</span> /// <span className="text-slate-500 text-sm">CALIBRATION_MODE</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 text-blue-300">
                        <div className="px-3 py-1 border border-blue-500/30 rounded bg-blue-500/10 flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            <span>REMOTE_DRONE_LINK: ACTIVE</span>
                        </div>
                        <Link to="/" className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors">
                            EXIT
                        </Link>
                    </div>
                </header>

                {/* Split Views Container */}
                <div className="flex-1 flex pointer-events-none">

                    {/* Left Panel: Point Cloud */}
                    <div className="flex-1 relative border-r border-blue-900/30 pointer-events-auto">
                        <div ref={view1} className="w-full h-full" />

                        {/* Overlay UI - Left */}
                        <div className="absolute top-4 left-4 p-4">
                            <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">RAW DATA</h2>
                            <p className="text-blue-400 text-xs tracking-widest uppercase">Photogrammetric Point Cloud</p>
                            <div className="mt-4 space-y-2">
                                <div className="bg-slate-900/80 p-2 border-l-2 border-blue-500 backdrop-blur-sm w-64">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-400">Point Density</span>
                                        <span className="text-blue-300">450 pts/m²</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                                        <div className="bg-blue-500 w-[75%] h-full" />
                                    </div>
                                </div>
                                <div className="bg-slate-900/80 p-2 border-l-2 border-yellow-500 backdrop-blur-sm w-48">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Noise Level</span>
                                        <span className="text-yellow-300">LOW</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-8 left-8 text-blue-200/50 text-[10px] space-y-1">
                            <p>SENSOR_ID: DRONE_X7_PRO</p>
                            <p>LIDAR_STATUS: ONLINE</p>
                            <p>ISO: 100 | S: 1/2000</p>
                        </div>
                    </div>

                    {/* Center Handshake Animation */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center pointer-events-none">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                            <div className="w-24 h-24 rounded-full border border-blue-500/50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                <Handshake className="w-10 h-10 text-green-400 animate-pulse" />
                            </div>
                            {/* Converging Lines */}
                            <div className="absolute top-1/2 -left-32 w-32 h-[1px] bg-gradient-to-r from-transparent to-blue-500" />
                            <div className="absolute top-1/2 -right-32 w-32 h-[1px] bg-gradient-to-l from-transparent to-green-500" />
                        </div>

                        <div className="mt-4 px-4 py-2 bg-slate-900/90 border border-green-500/30 rounded text-center backdrop-blur-sm">
                            <p className="text-green-400 font-bold tracking-widest text-xs animate-pulse">ALIGNMENT ACTIVE</p>
                            <p className="text-[10px] text-slate-400">Converging Geometries...</p>
                        </div>
                    </div>


                    {/* Right Panel: BIM */}
                    <div className="flex-1 relative pointer-events-auto">
                        <div ref={view2} className="w-full h-full" />

                        {/* Overlay UI - Right */}
                        <div className="absolute top-4 right-4 text-right p-4">
                            <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">IFC MODEL</h2>
                            <p className="text-green-400 text-xs tracking-widest uppercase">Digital Twin Reference</p>

                            <div className="mt-4 space-y-2 flex flex-col items-end">
                                <div className="bg-slate-900/80 p-2 border-r-2 border-green-500 backdrop-blur-sm w-64">
                                    <div className="flex justify-between mb-1 text-right">
                                        <span className="text-green-300">92/100</span>
                                        <span className="text-slate-400">Health Score</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                                        <div className="bg-green-500 w-[92%] h-full ml-auto" />
                                    </div>
                                </div>

                                <div className="bg-slate-900/80 p-2 border-r-2 border-blue-500 backdrop-blur-sm w-56 flex justify-between items-center px-3">
                                    <CheckCircle className="w-4 h-4 text-blue-400" />
                                    <span className="text-blue-100">Reg. E.060: Compliant</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Metrics Bar */}
                <div className="h-16 bg-slate-900/90 border-t border-blue-900/50 backdrop-blur-md flex items-center justify-around px-8 text-blue-100 pointer-events-auto">
                    {/* Metric 1 */}
                    <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity group cursor-pointer">
                        <Ruler className="w-5 h-5 text-blue-500 group-hover:text-blue-400" />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Deviation</p>
                            <p className="font-mono text-lg font-bold text-white group-hover:text-blue-300">0.05 mm</p>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-blue-900/50" />

                    {/* Metric 2 */}
                    <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity group cursor-pointer">
                        <Target className="w-5 h-5 text-green-500 group-hover:text-green-400" />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Coord System</p>
                            <p className="font-mono text-lg font-bold text-white group-hover:text-green-300">WGS84 / UTM-18S</p>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-blue-900/50" />

                    {/* Metric 3 */}
                    <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity group cursor-pointer">
                        <Activity className="w-5 h-5 text-red-500 group-hover:text-red-400" />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Processing Load</p>
                            <p className="font-mono text-lg font-bold text-white group-hover:text-red-300">12 ms</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
