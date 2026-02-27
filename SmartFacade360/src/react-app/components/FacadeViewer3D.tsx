
// @ts-ignore - Ignoring implicit any for three/examples/jsm imports if types are missing
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Instances, Instance, PerformanceMonitor, TransformControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { useMemo, useState, Suspense, Component, ReactNode } from 'react';


import * as THREE from 'three';
import CustomModel3D from './CustomModel3D';
import { useSupabaseModelLoader } from '../hooks/useSupabaseModelLoader';

interface UploadedModel {
  id: string;
  name: string;
  url: string;
  type: 'obj' | 'glb' | 'gltf' | 'fbx' | 'ifc' | 'revit';
  status: 'uploading' | 'ready' | 'error';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

interface FacadeViewer3DProps {
  architecturalStyle: string;
  material: string;
  accentColor: string;
  propertyModel: string;
  roofType?: string;
  windowStyle?: string;
  exteriorFeature?: string;
  sceneObjects?: Array<{
    id: string;
    name: string;
    category: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  }>;
  uploadedModels?: UploadedModel[];
  viewMode?: 'facade' | 'preview';
  selectedModelId?: string | null;
  onSelectModel?: (id: string | null) => void;
}

// Optimized Brick System using InstancedMesh
function HyperRealisticBrickTexture({ width, height, baseColor }: { width: number; height: number; baseColor: string }) {
  const brickWidth = 0.24;
  const brickHeight = 0.075;
  const mortarWidth = 0.012;

  const brickData = useMemo(() => {
    const data: Array<{ position: [number, number, number]; rotation: [number, number, number] }> = [];
    const rows = Math.ceil(height / (brickHeight + mortarWidth));
    const cols = Math.ceil(width / (brickWidth + mortarWidth));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offset = row % 2 === 0 ? 0 : brickWidth / 2;
        const x = -width / 2 + (col * (brickWidth + mortarWidth)) + offset;
        const y = -height / 2 + (row * (brickHeight + mortarWidth));

        if (x < width / 2 - brickWidth / 2 && x > -width / 2 + brickWidth / 2) {
          data.push({ position: [x, y, 0.025], rotation: [0, 0, 0] });
        }
      }
    }
    return data;
  }, [width, height]);

  const mortar = useMemo(() => (
    <mesh position={[0, 0, 0.015]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color="#E8E8E8" roughness={0.9} />
    </mesh>
  ), [width, height]);

  return (
    <group>
      <Instances range={brickData.length}>
        <boxGeometry args={[brickWidth - mortarWidth, brickHeight - mortarWidth, 0.05]} />
        <meshStandardMaterial color={baseColor} roughness={0.8} />
        {brickData.map((data, i) => (
          <Instance key={i} position={data.position as [number, number, number]} />
        ))}
      </Instances>
      {mortar}
    </group>
  );
}

interface HouseConfig {
  scale: [number, number, number];
  height: number;
  width: number;
  depth: number;
}

// Procedural Grass Component
function ProceduralGrass({ count = 2000, radius = 15 }: { count?: number; radius?: number }) {
  const grassData = useMemo(() => {
    const data: Array<{ position: [number, number, number]; scale: [number, number, number]; rotation: [number, number, number] }> = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.5) * radius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;

      const scale = 0.8 + Math.random() * 0.6;
      data.push({ position: [x, 0, z], scale: [scale, scale, scale], rotation: [0, Math.random() * Math.PI, 0] });
    }
    return data;
  }, [count, radius]);

  return (
    <Instances range={grassData.length}>
      <coneGeometry args={[0.05, 0.4, 3]} />
      <meshStandardMaterial color="#4ade80" roughness={0.8} />
      {grassData.map((data, i) => (
        <Instance
          key={i}
          position={data.position as [number, number, number]}
          scale={data.scale as [number, number, number]}
          rotation={data.rotation as [number, number, number]}
          color={Math.random() > 0.5 ? "#4ade80" : "#22c55e"}
        />
      ))}
    </Instances>
  );
}

// Procedural Forest Component
function ProceduralForest({ count = 80, radius = 30 }: { count?: number; radius?: number }) {
  const treeData = useMemo(() => {
    const data: Array<{ position: [number, number, number]; scale: number; type: 'pine' | 'deciduous' }> = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 7 + Math.random() * radius;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const scale = 0.8 + Math.random() * 1.5;
      const type = Math.random() > 0.6 ? 'deciduous' : 'pine';
      data.push({ position: [x, 0, z], scale, type });
    }
    return data;
  }, [count, radius]);

  const pines = treeData.filter(t => t.type === 'pine');
  const deciduous = treeData.filter(t => t.type === 'deciduous');

  return (
    <group>
      <group>
        <Instances range={pines.length}>
          <cylinderGeometry args={[0.2, 0.4, 1.5, 7]} />
          <meshStandardMaterial color="#4a3728" roughness={0.9} />
          {pines.map((data, i) => (
            <Instance key={`p - trunk - ${i} `} position={[data.position[0], 0.75 * data.scale, data.position[2]]} scale={[data.scale, data.scale, data.scale]} />
          ))}
        </Instances>
        <Instances range={pines.length}>
          <coneGeometry args={[1.3, 3.5, 7]} />
          <meshStandardMaterial color="#1a472a" roughness={0.8} />
          {pines.map((data, i) => (
            <Instance key={`p - leaves - ${i} `} position={[data.position[0], 2.8 * data.scale, data.position[2]]} scale={[data.scale, data.scale, data.scale]} />
          ))}
        </Instances>
      </group>

      <group>
        <Instances range={deciduous.length}>
          <cylinderGeometry args={[0.2, 0.3, 2, 7]} />
          <meshStandardMaterial color="#5D4037" roughness={0.9} />
          {deciduous.map((data, i) => (
            <Instance key={`d - trunk - ${i} `} position={[data.position[0], 1 * data.scale, data.position[2]]} scale={[data.scale, data.scale, data.scale]} />
          ))}
        </Instances>
        <Instances range={deciduous.length}>
          <dodecahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
          {deciduous.map((data, i) => (
            <Instance
              key={`d - leaves - ${i} `}
              position={[data.position[0], 2.5 * data.scale, data.position[2]]}
              scale={[data.scale, data.scale, data.scale]}
              color={Math.random() > 0.5 ? "#4d7c0f" : "#65a30d"}
            />
          ))}
        </Instances>
      </group>
    </group>
  );
}

// Roof and House Components
function UltraDetailedRoof({ houseConfig, accentColor }: { houseConfig: HouseConfig; accentColor: string }) {
  const roofHeight = 1.6;
  const overhang = 0.4;
  const roofWidth = houseConfig.width + overhang * 2;
  const roofDepth = houseConfig.depth + overhang * 2; // Used for aspect ratio
  const roofY = houseConfig.height / 2 + roofHeight / 2;
  const roofColor = new THREE.Color(accentColor).offsetHSL(0, -0.1, -0.3);

  // Calculate scale to match house aspect ratio (basic approximation)
  const roofScaleZ = roofDepth / roofWidth;

  return (
    <group position={[0, roofY - 0.2, 0]}>
      <mesh rotation={[0, Math.PI / 4, 0]} scale={[1, 1, roofScaleZ]} castShadow receiveShadow>
        <coneGeometry args={[roofWidth * 0.8 / Math.SQRT2, roofHeight, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, -roofHeight / 2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, roofScaleZ]}>
        <boxGeometry args={[roofWidth * 0.6, 0.1, roofWidth * 0.6]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
}

function UltraRealisticWindow({ position, size }: { position: [number, number, number]; size: [number, number]; }) {
  const [x, y, z] = position;
  const [w, h] = size;
  const frameThickness = 0.1;
  const frameColor = "#1F2937";

  return (
    <group position={[x, y, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.05]} />
        <meshPhysicalMaterial color="#E0F2FE" transmission={0.6} roughness={0.0} metalness={0.1} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[w + frameThickness, h + frameThickness, 0.08]} />
        <meshStandardMaterial color={frameColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[w, 0.05, 0.02]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.05, h, 0.02]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
    </group>
  );
}

function HouseModel({ material, accentColor, houseConfig }: { material: string; accentColor: string; houseConfig: HouseConfig }) {
  const materialSystem = useMemo(() => {
    switch (material) {
      case 'Ladrillo Visto': return { color: '#B95C50', texture: 'brick' };
      case 'Hormigón Texturizado': return { color: '#9CA3AF', texture: 'concrete' };
      case 'Madera Compuesta': return { color: '#78350F', texture: 'wood' };
      default: return { color: '#F3F4F6', texture: 'paint' };
    }
  }, [material]);

  return (
    <group scale={houseConfig.scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[houseConfig.width, houseConfig.height, houseConfig.depth]} />
        <meshStandardMaterial color={materialSystem.color} roughness={0.7} />
      </mesh>

      {materialSystem.texture === 'brick' && (
        <group position={[0, 0, houseConfig.depth / 2 + 0.01]}>
          <HyperRealisticBrickTexture width={houseConfig.width} height={houseConfig.height} baseColor={materialSystem.color} />
        </group>
      )}

      <UltraDetailedRoof houseConfig={houseConfig} accentColor={accentColor} />
      <UltraRealisticWindow position={[-1.2, 0.2, houseConfig.depth / 2 + 0.05]} size={[1.2, 1.5]} />
      <UltraRealisticWindow position={[1.2, 0.2, houseConfig.depth / 2 + 0.05]} size={[1.2, 1.5]} />

      <group position={[0, -houseConfig.height / 2 + 1.1, houseConfig.depth / 2 + 0.05]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 2.2, 0.1]} />
          <meshStandardMaterial color="#4B5563" roughness={0.4} />
        </mesh>
        <mesh position={[0.35, 0, 0.06]}>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Supabase Integration Wrapper Logic and Component
 */
// useSupabaseModelLoader hook is imported from ../hooks

function ModelWrapper({ model, isSelected }: { model: UploadedModel; isSelected: boolean }) {
  const signedUrl = useSupabaseModelLoader(model.url);

  if (!signedUrl) return null; // Or a loading placeholder

  return (
    <>
      {isSelected ? (
        <TransformControls mode="translate">
          <CustomModel3D modelUrl={signedUrl} modelType={model.type} position={model.position} rotation={model.rotation} scale={model.scale} modelId={model.id} />
        </TransformControls>
      ) : (
        <CustomModel3D modelUrl={signedUrl} modelType={model.type} position={model.position} rotation={model.rotation} scale={model.scale} modelId={model.id} />
      )}
    </>
  );
}

// Simple Error Boundary for 3D content
class ModelErrorBoundary extends Component<{ fallback: ReactNode, children: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error("3D Model Error:", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function FacadeViewer3D({
  material,
  accentColor,
  propertyModel,
  sceneObjects = [],
  uploadedModels = [],
  viewMode = 'facade',
  selectedModelId,
  onSelectModel
}: FacadeViewer3DProps) {
  const [dpr, setDpr] = useState(1.5);
  const [performanceMode, setPerformanceMode] = useState<'low' | 'high'>('high');

  const handleSelect = (id: string | null) => {
    if (onSelectModel) {
      onSelectModel(id);
    }
  };

  const getHouseConfig = (): HouseConfig => {
    switch (propertyModel) {
      case 'Villa Mediterránea': return { scale: [1.3, 1.3, 1.3], height: 3.5, width: 7, depth: 5 };
      case 'Mansión': return { scale: [1.5, 1.5, 1.5], height: 4.5, width: 8, depth: 6 };
      default: return { scale: [1, 1, 1], height: 3.2, width: 5, depth: 4 };
    }
  };
  const houseConfig = getHouseConfig();

  return (
    <Canvas
      shadows={performanceMode === 'high'}
      dpr={dpr}
      camera={{ position: [8, 5, 8], fov: 40 }}
    >
      <PerformanceMonitor
        onDecline={() => { setDpr(1); setPerformanceMode('low'); }}
        onIncline={() => { setDpr(2); setPerformanceMode('high'); }}
        flipflops={3}
        onFallback={() => { setDpr(1); setPerformanceMode('low'); }}
      />

      <Environment preset="forest" background={false} />
      <fog attach="fog" args={['#d6e4ff', 8, 45]} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow={performanceMode === 'high'}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      <OrbitControls
        makeDefault // Make controls default to allow TransformControls to take over when active
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={30}
        enableDamping={true}
        dampingFactor={0.05}
      />

      <group position={[0, -1.8, 0]} onClick={() => handleSelect(null)}>
        {(viewMode === 'facade') && (
          <>
            <HouseModel material={material} accentColor={accentColor} houseConfig={houseConfig} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -houseConfig.height / 2, 0]} receiveShadow={performanceMode === 'high'}>
              <circleGeometry args={[40, 64]} />
              <meshStandardMaterial color="#4a7a4a" roughness={1} />
            </mesh>
            <group position={[0, -houseConfig.height / 2, 0]}>
              <ProceduralForest count={performanceMode === 'high' ? 120 : 60} radius={45} />
              <ProceduralGrass count={performanceMode === 'high' ? 25000 : 8000} radius={45} />
            </group>
          </>
        )}

        {performanceMode === 'high' && (
          <ContactShadows position={[0, -houseConfig.height / 2 + 0.05, 0]} opacity={0.5} scale={25} blur={2.5} far={4} />
        )}



        <ModelErrorBoundary fallback={
          <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="red" />
          </mesh>
        }>
          <Suspense fallback={null}>
            {uploadedModels.map((model) => (
              <group
                key={model.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(model.id);
                }}
              >
                <ModelWrapper model={model} isSelected={selectedModelId === model.id} />
              </group>
            ))}
            {sceneObjects.map((obj) => (
              <mesh key={obj.id} position={obj.position}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="orange" />
              </mesh>
            ))}
          </Suspense>
        </ModelErrorBoundary>
      </group>



      {/* React 18 / Postprocessing compatibility issue block 
      {performanceMode === 'high' && (
        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} radius={0.4} />
          <ToneMapping />
        </EffectComposer>
      )}
      */}
    </Canvas>
  );
}
