import { useRef, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { shaderMaterial, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Activity, Search, Ruler, Cpu } from 'lucide-react';
import { Link } from 'react-router';

// --- Shaders ---

const ConcreteAnalysisMaterial = shaderMaterial(
    {
        uTime: 0,
        uResolution: new THREE.Vector2(0, 0),
        uMouse: new THREE.Vector2(0, 0),
        uScanLine: 0.5,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader
    `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uScanLine;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;

    // --- Noise Functions ---
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
            value += amplitude * noise(st);
            st *= 2.0;
            amplitude *= 0.5;
        }
        return value;
    }

    // --- SDF Shapes ---
    float sdCrack(vec2 p) {
        // Distort space for the crack
        float distortion = fbm(p * 10.0) * 0.15;
        vec2 distortedP = p + vec2(distortion, 0.0);
        
        // Main diagonal crack
        float d = abs(distortedP.x - distortedP.y * 0.2 - 0.45);
        
        // Vary width
        float width = 0.002 + 0.005 * noise(p * 20.0);
        return smoothstep(width, 0.0, d);
    }

    float sdMoisture(vec2 p) {
        float n = fbm(p * 4.0 + vec2(5.0));
        float mask = smoothstep(0.4, 0.7, n);
        // Localize it to top right
        float shape = smoothstep(0.4, 0.0, length(p - vec2(0.8, 0.8)));
        return mask * shape;
    }

    void main() {
        // Base Concrete Texture
        float n = fbm(vUv * 80.0); // Fine grain
        float n2 = fbm(vUv * 5.0); // Large stains
        
        vec3 concreteColor = vec3(0.5, 0.52, 0.55); // Blue-ish grey base
        vec3 finalColor = concreteColor * (0.8 + 0.4 * n); // Apply grain
        finalColor *= (0.9 + 0.2 * n2); // Apply stains
        
        // Pores
        float pore = step(0.98, random(vUv * 10.0));
        finalColor -= pore * 0.2;

        // --- Features ---
        
        // 1. Crack (Shear)
        float crackVal = sdCrack(vUv);
        vec3 crackColor = vec3(0.05, 0.02, 0.02); // Deep dark void
        
        // Parallax effect for depth (fake)
        // Simply darken edges
        
        // 2. Moisture
        float moistureVal = sdMoisture(vUv);
        vec3 dampColor = finalColor * 0.6; // Darker wet concrete

        // --- Analysis Overlay ---
        
        // Scanning Line
        float scanDist = abs(vUv.y - uScanLine);
        float scanBeam = smoothstep(0.02, 0.0, scanDist);
        float scanGrid = step(0.98, fract(vUv.x * 40.0)) * step(0.98, fract(vUv.y * 40.0));
        
        vec3 overlayColor = vec3(0.0);
        float overlayAlpha = 0.0;

        // Semantic Masks
        if (crackVal > 0.1) {
            // "Critical Crack" - Red Translucent
            finalColor = mix(finalColor, crackColor, 0.9); // Physical crack
            
            // Overlay highlight
            vec3 redZone = vec3(1.0, 0.0, 0.2);
            overlayColor += redZone * scanBeam * 2.0; // Glow on scan
            overlayAlpha = 0.3 * (sin(uTime * 4.0) * 0.5 + 0.5); // Pulse
            finalColor = mix(finalColor, redZone, 0.4);
        } else if (moistureVal > 0.1) {
            // "Moisture Seepage" - Yellow Translucent
            finalColor = mix(finalColor, dampColor, 0.8); // Physical wetness
            
            vec3 yellowZone = vec3(1.0, 0.8, 0.0);
            finalColor = mix(finalColor, yellowZone, 0.2);
        } else {
            // "Zone Stable" - Green tint scan
            if (scanBeam > 0.1) {
                finalColor += vec3(0.0, 1.0, 0.4) * 0.1;
                // Reticle grid
                if (scanGrid > 0.5) finalColor += vec3(0.0, 1.0, 0.4) * 0.5;
            }
        }

        // Vignette
        float dist = distance(vUv, vec2(0.5));
        finalColor *= smoothstep(0.8, 0.2, dist);

        gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ ConcreteAnalysisMaterial });

// --- Components ---

const HUDLabel = ({ position, title, subtitle, variant = 'info', confidence = null }: any) => {
    const colorClass =
        variant === 'danger' ? 'border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
            variant === 'warning' ? 'border-yellow-500 text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.4)]' :
                'border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.4)]';

    const lineClass =
        variant === 'danger' ? 'bg-red-500' :
            variant === 'warning' ? 'bg-yellow-500' :
                'bg-emerald-500';

    return (
        <Html position={position} center className="pointer-events-none w-[300px]">
            <div className="flex items-center gap-4">
                {/* Connecting Line Anchor */}
                <div className={`w-3 h-3 rounded-full border-2 border-white ${lineClass} animate-pulse relative`}>
                    <div className={`absolute top-1/2 left-3 w-12 h-[1px] ${lineClass} origin-left`} />
                </div>

                {/* Card */}
                <div className={`
            ml-12 backdrop-blur-md bg-black/80 border-l-4 ${colorClass} 
            p-3 rounded-r-md text-xs font-mono transition-all transform hover:scale-105 pointer-events-auto cursor-help
          `}>
                    <h3 className="font-bold uppercase tracking-wider text-[10px] opacity-70 mb-1 flex justify-between">
                        {title}
                        {confidence && <span className="text-white opacity-100">{confidence}%</span>}
                    </h3>
                    <p className="font-semibold text-sm leading-tight">{subtitle}</p>

                    {/* Micro-details */}
                    <div className="mt-2 pt-2 border-t border-white/10 flex gap-2 text-[9px] uppercase tracking-widest opacity-60">
                        <span>ID: #A7-29</span>
                        <span>SCAN: Lidar/RGB</span>
                    </div>
                </div>
            </div>
        </Html>
    );
};

const Scene = () => {
    const matRef = useRef<any>(null);
    const [scanY, setScanY] = useState(0);

    useFrame((state) => {
        if (matRef.current) {
            matRef.current.uTime = state.clock.elapsedTime;
            // Scan line loop
            const scan = (state.clock.elapsedTime * 0.2) % 1.2;
            matRef.current.uScanLine = scan;
            setScanY(scan); // Sync visuals
        }
    });

    return (
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[8, 4.5]} />
            {/* @ts-ignore */}
            <concreteAnalysisMaterial ref={matRef} />

            {/* HUD Elements anchored to specific UV locations effectively projected to 3D space */}
            {/* Coordinates based on shader logic: 
                Crack is roughly x = y*0.2 + 0.45.
                Moisture is top right (0.8, 0.8)
            */}

            {/* Crack Label */}
            <HUDLabel
                position={[0.5, -0.5 + scanY * 0.1, 0.1]}
                title="Pathology Analysis"
                subtitle="Shear Crack (Fisura por Cizallamient)"
                variant="danger"
                confidence="99.2"
            />

            {/* Moisture Label */}
            <HUDLabel
                position={[2.5, 1.2, 0.1]}
                title="Moisture Detect"
                subtitle="Active Infiltration / Chloride Attack"
                variant="warning"
                confidence="94.7"
            />

            {/* Stable Area Label */}
            <HUDLabel
                position={[-2.5, 0.5, 0.1]}
                title="Structural Integrity"
                subtitle="Stable Concrete Matrix (Zone OK)"
                variant="success"
            />

        </mesh>
    );
};

export default function DiagnosticAnalysis() {
    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-white">
            <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
                <color attach="background" args={['#050505']} />
                <Scene />
                <OrbitControls enableZoom={true} enablePan={true} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
            </Canvas>

            {/* Main Overlay UI */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">

                {/* Header */}
                <header className="flex justify-between items-start pointer-events-auto">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold rounded uppercase">
                                Forensic AI Mode
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                                CASE: BEAM-B44-SOUTH
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">
                            Material <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Pathology</span>
                        </h1>
                    </div>

                    <div className="text-right space-y-1">
                        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors text-xs uppercase tracking-widest">
                            Exit Diag Mode
                        </Link>
                    </div>
                </header>

                {/* Side Stats */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-64 space-y-4 pointer-events-auto">
                    <div className="bg-black/80 backdrop-blur border border-white/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-xs uppercase text-slate-400 mb-2">
                            <Activity className="w-4 h-4 text-red-500" />
                            Impact on WBS
                        </div>
                        <div className="text-2xl font-bold">$1,200</div>
                        <div className="text-[10px] text-red-400 mt-1 uppercase font-bold">
                            Level 4: Urgent Repair
                        </div>
                        <div className="w-full bg-slate-800 h-1 mt-2 rounded overflow-hidden">
                            <div className="bg-red-500 w-[85%] h-full" />
                        </div>
                    </div>

                    <div className="bg-black/80 backdrop-blur border border-white/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-xs uppercase text-slate-400 mb-2">
                            <Ruler className="w-4 h-4 text-blue-400" />
                            Crack Depth
                        </div>
                        <div className="text-2xl font-bold">28 mm</div>
                        <div className="text-[10px] text-slate-500 mt-1 uppercase">
                            Rebar Exposure Risk: HIGH
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <footer className="border-t border-white/10 pt-4 flex justify-between items-end opacity-80">
                    <div className="flex gap-8">
                        <div>
                            <p className="text-[10px] uppercase text-slate-500">Sensor Array</p>
                            <div className="flex items-center gap-2 text-xs">
                                <Search className="w-3 h-3 text-emerald-500" />
                                Lidar + High-Res RGB
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-slate-500">AI Model</p>
                            <div className="flex items-center gap-2 text-xs">
                                <Cpu className="w-3 h-3 text-purple-500" />
                                ResNet-50-CrackDetect
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-600 font-mono">
                        CALIBRATION ID: 00-AA-44-X1
                    </div>
                </footer>

            </div>

            {/* Film Grain / Overlay Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
        </div>
    );
}
