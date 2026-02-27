import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { Finding } from '@/react-app/hooks/useRealtimeFindings';

interface ThreeDViewerProps {
    buildingId: string;
    findings: Finding[];
}

// Fallback Mock Model (Un prisma rectangular simulando un edificio)
function MockBuilding() {
    return (
        <mesh position={[0, 10, 0]} castShadow receiveShadow>
            <boxGeometry args={[15, 20, 15]} />
            <meshStandardMaterial color="#1a202c" metalness={0.6} roughness={0.3} transparent opacity={0.6} />
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(15, 20, 15)]} />
                <lineBasicMaterial color="#00b8d9" linewidth={2} />
            </lineSegments>
        </mesh>
    );
}

// Individual Defect Annotation with GSAP Zoom Logic
function FindingAnnotation({ finding }: { finding: Finding }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);
    const { camera, controls } = useThree();

    // NTE E.060 Logic from Structural Auditor
    const isCritical = finding.severity_level === 'critical' || finding.metric_deviation > 5;

    // Scale proportional to deviation (0.1m minimum)
    const scale = Math.max(0.2, finding.metric_deviation / 10);

    // Coordenadas parseadas (Fallback if empty/malformed string)
    const position = useMemo(() => {
        try {
            if (typeof finding.coordinates === 'string') {
                const c = JSON.parse(finding.coordinates);
                return new THREE.Vector3(c.x, c.y, c.z);
            }
            if (finding.coordinates && typeof finding.coordinates === 'object') {
                const c = finding.coordinates as any;
                return new THREE.Vector3(c.x, c.y, c.z);
            }
        } catch (e) { }

        // Random fallback within the bound of the MockBuilding to test locally
        return new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            Math.random() * 20,
            (Math.random() - 0.5) * 15
        );
    }, [finding]);

    useFrame(({ clock }) => {
        if (isCritical && meshRef.current && !active) {
            meshRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 4) * 0.15);
        } else if (meshRef.current && !active) {
            meshRef.current.scale.setScalar(1);
        }
    });

    const handlePinClick = (e: any) => {
        e.stopPropagation();
        setActive(!active);

        // GSAP Smooth Zoom to Pin
        if (!active) {
            // Move camera towards the pin
            const offset = 5;
            gsap.to(camera.position, {
                duration: 1.5,
                x: position.x + offset,
                y: position.y + offset,
                z: position.z + offset,
                ease: 'power3.inOut'
            });

            // If OrbitControls is present, update its target
            if (controls) {
                gsap.to((controls as any).target, {
                    duration: 1.5,
                    x: position.x,
                    y: position.y,
                    z: position.z,
                    ease: 'power3.inOut'
                });
            }
        }
    };

    return (
        <mesh
            position={position}
            ref={meshRef}
            onClick={handlePinClick}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
            <sphereGeometry args={[scale, 32, 32]} />
            <meshStandardMaterial
                color={isCritical ? "#ef4444" : "#f59e0b"}
                emissive={isCritical ? "#dc2626" : "#d97706"}
                emissiveIntensity={hovered || active ? 2.0 : (isCritical ? 1.2 : 0.6)}
                transparent opacity={0.9}
            />

            {/* Interactive Popup (Visible on Click/Hover) */}
            {(hovered || active) && (
                <Html distanceFactor={12} center zIndexRange={[100, 0]}>
                    <div className="bg-[#0F111A]/95 border border-gray-700/80 backdrop-blur-md p-3 rounded-lg shadow-2xl text-xs w-56 flex flex-col gap-2 relative">
                        {/* Glow indicator line */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${isCritical ? 'bg-red-500' : 'bg-amber-500'} rounded-t-lg shadow-[0_0_10px_currentColor]`}></div>

                        <div className="flex justify-between items-start mt-1">
                            <strong className={`uppercase font-bold tracking-wider ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                                {isCritical ? 'CRITICAL RISK' : finding.severity_level}
                            </strong>
                            <span className="text-gray-400 font-mono text-[10px]">WGS84</span>
                        </div>

                        <div className="text-white font-medium capitalize border-b border-gray-800 pb-2">
                            {finding.pathology_type} en {finding.element_type || 'Elemento As-Built'}
                        </div>

                        <div className="text-gray-300 font-mono flex items-center justify-between">
                            <span>Desviación:</span>
                            <span className={isCritical ? 'text-red-300' : 'text-white'}>{finding.metric_deviation.toFixed(2)} mm</span>
                        </div>

                        {/* Structural Auditor E.060 Citation */}
                        {isCritical && (
                            <div className="text-[10px] text-red-200 bg-red-900/40 p-1.5 rounded border border-red-500/30 leading-snug">
                                <b>⚠ NTE E.060 Cap. 21:</b> Riesgo frágil estructural. Intervención requerida.
                            </div>
                        )}
                        {!isCritical && finding.nte_reference && (
                            <div className="text-[10px] text-teal-300 bg-teal-900/30 p-1.5 rounded leading-snug">
                                Ref: {finding.nte_reference}
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </mesh>
    );
}

// Resets Camera when clicking empty space
function CameraResetter() {
    const { camera, controls } = useThree();
    const handleBackgroundClick = () => {
        gsap.to(camera.position, { duration: 1.5, x: 30, y: 20, z: 30, ease: 'power3.inOut' });
        if (controls) {
            gsap.to((controls as any).target, { duration: 1.5, x: 0, y: 10, z: 0, ease: 'power3.inOut' });
        }
    };
    return (
        <mesh scale={100} onClick={handleBackgroundClick} visible={false}>
            <sphereGeometry />
        </mesh>
    );
}

export default function ThreeDViewer({ buildingId, findings }: ThreeDViewerProps) {
    return (
        <div className="w-full h-[600px] md:h-full bg-black/60 rounded-2xl border border-white/5 relative overflow-hidden group shadow-2xl">
            {/* Cinematic Overlay Info */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-teal-400 font-bold tracking-widest text-sm uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    SF360 Spatial Twin
                </h3>
                <p className="text-gray-400 text-xs mt-1 font-mono tracking-wide">ISO 19650 Active | WGS84 Coords</p>
            </div>

            <div className="absolute bottom-4 right-4 z-10 pointer-events-none bg-[#0F111A]/90 px-3 py-2 rounded-lg text-xs border border-gray-800 text-gray-300 flex flex-col gap-2 backdrop-blur-md">
                <span className="flex items-center gap-2 font-mono"><div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_5px_currentColor]"></div> {">"} 5.0mm (E.060 Crit)</span>
                <span className="flex items-center gap-2 font-mono"><div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div> Warning</span>
            </div>

            <Canvas camera={{ position: [30, 20, 30], fov: 45 }} shadows dpr={[1, 2]}>
                <color attach="background" args={['#07080b']} /> {/* Deep Carbon Black */}

                {/* Iluminación Cinematográfica */}
                <ambientLight intensity={0.2} color="#4f46e5" /> {/* Indigo ambient tint */}
                <spotLight position={[20, 40, 20]} intensity={2.5} castShadow angle={Math.PI / 4} penumbra={0.5} color="#cbd5e1" />
                <pointLight position={[-20, 10, -20]} intensity={1.5} color="#14b8a6" /> {/* Teal backend light */}

                <React.Suspense fallback={<Html center className="text-teal-400 font-mono text-sm whitespace-nowrap"><div className="animate-spin border-t-2 border-teal-400 w-4 h-4 rounded-full mx-auto mb-2"></div>Cargando Gemelo Digital 4K...</Html>}>
                    {/* El modelo BIM Dinámico .glb irá aquí, instanciado vía path en Supabase; por ahora usamos el fallback para PROTTOM TRL 5 */}
                    <MockBuilding />

                    {/* Anotaciones Estructurales RAG -> 3D Pins */}
                    {findings.map((f) => (
                        <FindingAnnotation key={f.id} finding={f} />
                    ))}

                    <CameraResetter />
                </React.Suspense>

                <OrbitControls
                    makeDefault
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={5}
                    maxDistance={150}
                    maxPolarAngle={Math.PI / 2} // Restrict below ground
                />

                {/* Grid Holográfico / Suelo WGS84 */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#0f111a" roughness={0.8} />
                    <gridHelper args={[100, 100, '#14b8a6', '#1f2937']} position={[0, 0.01, 0]} />
                </mesh>
            </Canvas>
        </div>
    );
}
