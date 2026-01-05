import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Sparkles, ContactShadows } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import CustomModel3D from './CustomModel3D';

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
}

// Hiper-realístico sistema de texturas procedurales para ladrillos
function HyperRealisticBrickTexture({ width, height }: { width: number; height: number }) {
  const bricks = [];
  const brickWidth = 0.24;
  const brickHeight = 0.075;
  const mortarWidth = 0.012;
  
  const rows = Math.ceil(height / (brickHeight + mortarWidth));
  const cols = Math.ceil(width / (brickWidth + mortarWidth));
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offset = row % 2 === 0 ? 0 : brickWidth / 2;
      const x = -width / 2 + (col * (brickWidth + mortarWidth)) + offset;
      const y = -height / 2 + (row * (brickHeight + mortarWidth));
      
      if (x < width / 2 - brickWidth / 2 && x > -width / 2 + brickWidth / 2) {
        // Variación de color individual para cada ladrillo
        const hueVariation = (Math.random() - 0.5) * 0.08;
        const saturationVariation = (Math.random() - 0.5) * 0.3;
        const lightnessVariation = (Math.random() - 0.5) * 0.2;
        const roughnessVariation = 0.85 + Math.random() * 0.15;
        
        const baseColor = new THREE.Color('#B85450').offsetHSL(
          hueVariation,
          saturationVariation,
          lightnessVariation
        );
        
        // Desgaste aleatorio en algunos ladrillos
        const weathered = Math.random() < 0.15;
        const cracked = Math.random() < 0.08;
        
        bricks.push(
          <group key={`brick-${row}-${col}`}>
            {/* Ladrillo principal */}
            <mesh position={[x, y, 0.025]} castShadow receiveShadow>
              <boxGeometry args={[brickWidth - mortarWidth, brickHeight - mortarWidth, 0.05]} />
              <meshPhysicalMaterial 
                color={baseColor}
                roughness={roughnessVariation}
                metalness={0.02}
                normalScale={[0.8, 0.8]}
                bumpScale={0.03}
                clearcoat={weathered ? 0.1 : 0.05}
                clearcoatRoughness={0.8}
                envMapIntensity={0.4}
              />
            </mesh>
            
            {/* Biselado de bordes para realismo */}
            <mesh position={[x + brickWidth/2 - mortarWidth/2, y, 0.028]} castShadow>
              <boxGeometry args={[0.003, brickHeight - mortarWidth, 0.045]} />
              <meshPhysicalMaterial 
                color={baseColor.clone().offsetHSL(0, 0, -0.1)}
                roughness={0.95}
                metalness={0.01}
              />
            </mesh>
            <mesh position={[x - brickWidth/2 + mortarWidth/2, y, 0.028]} castShadow>
              <boxGeometry args={[0.003, brickHeight - mortarWidth, 0.045]} />
              <meshPhysicalMaterial 
                color={baseColor.clone().offsetHSL(0, 0, -0.1)}
                roughness={0.95}
                metalness={0.01}
              />
            </mesh>
            
            {/* Grietas ocasionales */}
            {cracked && (
              <mesh position={[x + (Math.random() - 0.5) * brickWidth * 0.6, y, 0.052]} castShadow>
                <boxGeometry args={[0.002, brickHeight * 0.8, 0.002]} />
                <meshBasicMaterial color="#2A2A2A" />
              </mesh>
            )}
            
            {/* Efecto de humedad ocasional */}
            {weathered && (
              <mesh position={[x, y, 0.051]}>
                <boxGeometry args={[brickWidth * 0.7, brickHeight * 0.3, 0.001]} />
                <meshPhysicalMaterial 
                  color={baseColor.clone().offsetHSL(0, 0.2, -0.3)}
                  transparent
                  opacity={0.3}
                  roughness={0.2}
                  metalness={0.1}
                />
              </mesh>
            )}
          </group>
        );
      }
    }
  }
  
  // Juntas de mortero realistas
  const mortarJoints = [];
  for (let row = 0; row <= rows; row++) {
    const y = -height / 2 + (row * (brickHeight + mortarWidth)) - mortarWidth / 2;
    mortarJoints.push(
      <mesh key={`mortar-h-${row}`} position={[0, y, 0.015]} receiveShadow>
        <boxGeometry args={[width, mortarWidth, 0.03]} />
        <meshPhysicalMaterial 
          color="#E8E8E8"
          roughness={0.9}
          metalness={0.0}
          envMapIntensity={0.1}
        />
      </mesh>
    );
  }
  
  return <group>{bricks}{mortarJoints}</group>;
}

// Sistema de ventanas hiper-realista con reflejos dinámicos
function UltraRealisticWindow({ position, size }: {
  position: [number, number, number];
  size: [number, number];
}) {
  const [x, y, z] = position;
  const [w, h] = size;
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Animación sutil del reflejo
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
      material.envMapIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });
  
  return (
    <group>
      {/* Marco exterior profundo */}
      <mesh position={[x, y, z - 0.12]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.25, h + 0.25, 0.24]} />
        <meshPhysicalMaterial 
          color="#1A1A1A"
          roughness={0.3}
          metalness={0.8}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
          envMapIntensity={1.2}
        />
      </mesh>
      
      {/* Marco intermedio */}
      <mesh position={[x, y, z - 0.08]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.18, h + 0.18, 0.16]} />
        <meshPhysicalMaterial 
          color="#F5F5F5"
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          envMapIntensity={0.8}
        />
      </mesh>
      
      {/* Alféizar de la ventana */}
      <mesh position={[x, y - h/2 - 0.08, z + 0.02]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.3, 0.16, 0.12]} />
        <meshPhysicalMaterial 
          color="#E0E0E0"
          roughness={0.3}
          metalness={0.05}
          clearcoat={0.6}
          envMapIntensity={0.9}
        />
      </mesh>
      
      {/* Dintel superior */}
      <mesh position={[x, y + h/2 + 0.06, z + 0.01]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.2, 0.12, 0.08]} />
        <meshPhysicalMaterial 
          color="#D0D0D0"
          roughness={0.4}
          metalness={0.03}
          envMapIntensity={0.7}
        />
      </mesh>
      
      {/* Cristal principal con reflejos dinámicos */}
      <mesh ref={meshRef} position={[x, y, z + 0.02]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.04]} />
        <meshPhysicalMaterial 
          color="#E8F4FD"
          transparent
          opacity={0.15}
          metalness={0.0}
          roughness={0.01}
          transmission={0.98}
          thickness={0.04}
          envMapIntensity={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          ior={1.52}
          reflectivity={0.9}
        />
      </mesh>
      
      {/* Barras divisorias de la ventana */}
      <mesh position={[x, y, z + 0.025]} castShadow>
        <boxGeometry args={[0.02, h, 0.03]} />
        <meshPhysicalMaterial 
          color="#FFFFFF"
          roughness={0.1}
          metalness={0.05}
          clearcoat={0.9}
          envMapIntensity={0.8}
        />
      </mesh>
      <mesh position={[x, y, z + 0.025]} castShadow>
        <boxGeometry args={[w, 0.02, 0.03]} />
        <meshPhysicalMaterial 
          color="#FFFFFF"
          roughness={0.1}
          metalness={0.05}
          clearcoat={0.9}
          envMapIntensity={0.8}
        />
      </mesh>
      
      {/* Herrajes y manijas */}
      <mesh position={[x + w/2 - 0.1, y - 0.2, z + 0.04]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.02]} />
        <meshPhysicalMaterial 
          color="#C0C0C0"
          metalness={0.95}
          roughness={0.1}
          envMapIntensity={2.0}
        />
      </mesh>
      
      {/* Contraventanas parcialmente abiertas */}
      <group position={[x - w/2 - 0.15, y, z + 0.01]} rotation={[0, Math.PI/6, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w/2, h, 0.04]} />
          <meshPhysicalMaterial 
            color="#2C5F41"
            roughness={0.8}
            metalness={0.0}
            clearcoat={0.3}
            envMapIntensity={0.6}
          />
        </mesh>
        {/* Listones de la contraventana */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0, h/2 - i * (h/7) - h/14, 0.025]} castShadow>
            <boxGeometry args={[w/2 - 0.02, 0.015, 0.01]} />
            <meshPhysicalMaterial 
              color="#1F4A33"
              roughness={0.9}
              metalness={0.0}
            />
          </mesh>
        ))}
      </group>
      
      {/* Iluminación interior sutil */}
      <pointLight 
        position={[x, y, z - 0.5]} 
        intensity={0.3}
        color="#FFF8DC"
        distance={2}
        decay={2}
      />
    </group>
  );
}

// Puerta de entrada ultra-detallada
function LuxuryEntranceDoor({ position, accentColor }: {
  position: [number, number, number];
  accentColor: string;
}) {
  const [x, y, z] = position;
  const doorColor = new THREE.Color(accentColor).offsetHSL(0, -0.1, -0.25);
  
  return (
    <group>
      {/* Marco de puerta profundo */}
      <mesh position={[x, y, z - 0.18]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2.3, 0.36]} />
        <meshPhysicalMaterial 
          color="#1A1A1A"
          roughness={0.2}
          metalness={0.8}
          clearcoat={0.9}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Umbral de mármol */}
      <mesh position={[x, y - 1.05, z + 0.02]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.2, 0.15]} />
        <meshPhysicalMaterial 
          color="#F8F8F8"
          roughness={0.1}
          metalness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          envMapIntensity={1.8}
        />
      </mesh>
      
      {/* Puerta principal con paneles tallados */}
      <mesh position={[x, y, z + 0.08]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 2.0, 0.16]} />
        <meshPhysicalMaterial 
          color={doorColor}
          roughness={0.3}
          metalness={0.0}
          clearcoat={0.8}
          clearcoatRoughness={0.3}
          envMapIntensity={0.7}
        />
      </mesh>
      
      {/* Paneles tallados decorativos */}
      {[
        [0, 0.4, 0.085],
        [0, -0.4, 0.085]
      ].map((pos, i) => (
        <mesh key={i} position={[x + pos[0], y + pos[1], z + pos[2]]} castShadow>
          <boxGeometry args={[0.7, 0.6, 0.02]} />
          <meshPhysicalMaterial 
            color={doorColor.clone().offsetHSL(0, 0, 0.1)}
            roughness={0.4}
            metalness={0.0}
            clearcoat={0.9}
            envMapIntensity={0.5}
          />
        </mesh>
      ))}
      
      {/* Manija y cerradura de lujo */}
      <mesh position={[x + 0.35, y - 0.1, z + 0.12]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.08]} />
        <meshPhysicalMaterial 
          color="#FFD700"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={3.0}
          clearcoat={1.0}
        />
      </mesh>
      
      {/* Placa de cerradura */}
      <mesh position={[x + 0.4, y - 0.1, z + 0.09]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.01]} />
        <meshPhysicalMaterial 
          color="#C0C0C0"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={2.5}
        />
      </mesh>
      
      {/* Mirilla de puerta */}
      <mesh position={[x, y + 0.3, z + 0.09]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.02]} />
        <meshPhysicalMaterial 
          color="#1A1A1A"
          metalness={0.8}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Iluminación de entrada premium */}
      <group position={[x - 0.7, y + 1.2, z + 0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.8]} />
          <meshPhysicalMaterial 
            color="#1A1A1A"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={2.0}
          />
        </mesh>
        <mesh position={[0, -0.3, 0]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshPhysicalMaterial 
            color="#FFF8DC"
            transparent
            opacity={0.9}
            transmission={0.8}
            thickness={0.1}
            envMapIntensity={1.0}
          />
        </mesh>
        <pointLight 
          position={[0, -0.3, 0]} 
          intensity={2.5}
          color="#FFF8DC"
          distance={8}
          decay={1.5}
          castShadow
        />
      </group>
    </group>
  );
}

// Chimenea funcional con humo
function RealisticChimney({ position }: { position: [number, number, number] }) {
  const smokeRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (smokeRef.current) {
      smokeRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      smokeRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });
  
  return (
    <group position={position}>
      {/* Base de chimenea */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 2.2, 0.8]} />
        <meshPhysicalMaterial 
          color="#B85450"
          roughness={0.9}
          metalness={0.0}
          envMapIntensity={0.4}
          clearcoat={0.1}
        />
      </mesh>
      <group position={[0, 0, 0.401]}>
        <HyperRealisticBrickTexture width={0.8} height={2.2} />
      </group>
      
      {/* Corona de chimenea */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.0, 0.2, 1.0]} />
        <meshPhysicalMaterial 
          color="#B0B0B0"
          roughness={0.7}
          metalness={0.1}
          envMapIntensity={0.8}
        />
      </mesh>
      
      {/* Conductos de humos */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.4]} />
        <meshPhysicalMaterial 
          color="#8A8A8A"
          metalness={0.6}
          roughness={0.3}
          envMapIntensity={1.2}
        />
      </mesh>
      
      {/* Humo realista */}
      <group ref={smokeRef} position={[0, 1.8, 0]}>
        <Sparkles 
          count={50}
          scale={2.0}
          size={4}
          speed={0.8}
          color="#F5F5F5"
          opacity={0.4}
        />
      </group>
    </group>
  );
}

// Tejado con tejas individuales ultra-detallado
function UltraDetailedRoof({ houseConfig, accentColor }: any) {
  const roofHeight = 1.6;
  const roofY = houseConfig.height / 2 + roofHeight / 3;
  const roofColor = new THREE.Color(accentColor).offsetHSL(0, -0.1, -0.3);
  
  const tiles = useMemo(() => {
    const tileArray = [];
    const tileWidth = 0.3;
    const tileHeight = 0.15;
    const rows = 12;
    const cols = Math.ceil(houseConfig.width * 2 / tileWidth);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = -houseConfig.width + (col * tileWidth) + (row % 2 === 0 ? 0 : tileWidth / 2);
        const z = -houseConfig.depth / 2 + (row * tileHeight * 0.8);
        const y = roofY + Math.abs(x) * 0.35 - 0.2;
        
        if (x > -houseConfig.width * 1.1 && x < houseConfig.width * 1.1) {
          const tileVariation = Math.random();
          const weathered = Math.random() < 0.2;
          
          tileArray.push(
            <group key={`tile-${row}-${col}`} position={[x, y, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[tileWidth, 0.02, tileHeight]} />
                <meshPhysicalMaterial 
                  color={roofColor.clone().offsetHSL(
                    (tileVariation - 0.5) * 0.05,
                    0,
                    (tileVariation - 0.5) * 0.1
                  )}
                  roughness={weathered ? 0.9 : 0.7}
                  metalness={0.02}
                  clearcoat={weathered ? 0.1 : 0.4}
                  envMapIntensity={0.6}
                />
              </mesh>
              
              {/* Bordes curvos de las tejas */}
              <mesh position={[0, 0.01, tileHeight/2]} rotation={[Math.PI/2, 0, 0]} castShadow>
                <cylinderGeometry args={[tileWidth/2, tileWidth/2, 0.02, 8]} />
                <meshPhysicalMaterial 
                  color={roofColor.clone().offsetHSL(0, 0, -0.1)}
                  roughness={0.8}
                  metalness={0.01}
                  envMapIntensity={0.5}
                />
              </mesh>
            </group>
          );
        }
      }
    }
    return tileArray;
  }, [houseConfig, roofColor]);
  
  return (
    <group>
      {/* Base estructural del tejado */}
      <mesh position={[0, roofY, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[houseConfig.width * 0.9, roofHeight, 4]} />
        <meshPhysicalMaterial 
          color={roofColor}
          roughness={0.8}
          metalness={0.05}
          envMapIntensity={0.7}
        />
      </mesh>
      
      {/* Tejas individuales */}
      {tiles}
      
      {/* Sistema de canalones premium */}
      <mesh position={[0, houseConfig.height / 2 + 0.1, houseConfig.depth / 2 + 0.2]} castShadow>
        <boxGeometry args={[houseConfig.width + 0.4, 0.15, 0.2]} />
        <meshPhysicalMaterial 
          color="#A0A0A0"
          metalness={0.8}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Bajantes de agua */}
      {[-houseConfig.width/2 - 0.1, houseConfig.width/2 + 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0, houseConfig.depth / 2 + 0.25]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, houseConfig.height + 0.2]} />
          <meshPhysicalMaterial 
            color="#909090"
            metalness={0.7}
            roughness={0.3}
            envMapIntensity={1.2}
          />
        </mesh>
      ))}
      
      {/* Chimenea funcional */}
      <RealisticChimney 
        position={[houseConfig.width * 0.25, roofY + 0.4, -houseConfig.depth * 0.15]}
      />
    </group>
  );
}

function HouseModel({ 
  architecturalStyle, 
  material, 
  accentColor, 
  propertyModel
}: Omit<FacadeViewer3DProps, 'sceneObjects'>) {
  const meshRef = useRef<THREE.Group>(null);

  const getHouseConfig = () => {
    switch (propertyModel) {
      case 'Casa Unifamiliar': return { 
        scale: [1, 1, 1] as [number, number, number], 
        height: 3.2, 
        width: 5, 
        depth: 4,
        stories: 1,
        wallThickness: 0.2
      };
      case 'Villa Mediterránea': return { 
        scale: [1.2, 1.2, 1.2] as [number, number, number], 
        height: 3.8, 
        width: 6, 
        depth: 5.5,
        stories: 2,
        wallThickness: 0.25
      };
      default: return { 
        scale: [1, 1, 1] as [number, number, number], 
        height: 3.2, 
        width: 5, 
        depth: 4,
        stories: 1,
        wallThickness: 0.2
      };
    }
  };

  const getMaterialSystem = () => {
    switch (material) {
      case 'Ladrillo Visto': 
        return {
          baseColor: '#B85450',
          roughness: 0.9,
          metalness: 0.0,
          envMapIntensity: 0.4,
          clearcoat: 0.1,
          procedural: true
        };
      case 'Hormigón Texturizado':
        return {
          baseColor: '#9CA3AF',
          roughness: 0.85,
          metalness: 0.05,
          envMapIntensity: 0.6,
          clearcoat: 0.2,
          procedural: false
        };
      case 'Piedra Natural':
        return {
          baseColor: '#8B7D6B',
          roughness: 0.95,
          metalness: 0.0,
          envMapIntensity: 0.3,
          clearcoat: 0.05,
          procedural: false
        };
      default: 
        return {
          baseColor: '#E5E7EB',
          roughness: 0.7,
          metalness: 0.1,
          envMapIntensity: 0.5,
          clearcoat: 0.3,
          procedural: false
        };
    }
  };

  const houseConfig = getHouseConfig();
  const materialSystem = getMaterialSystem();

  const renderFoundation = () => (
    <group>
      {/* Base de cimientos */}
      <mesh position={[0, -houseConfig.height / 2 - 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[houseConfig.width + 0.6, 0.5, houseConfig.depth + 0.6]} />
        <meshPhysicalMaterial 
          color="#4A4A4A"
          roughness={0.95}
          metalness={0.02}
          envMapIntensity={0.3}
        />
      </mesh>
      
      {/* Línea de humedad */}
      <mesh position={[0, -houseConfig.height / 2 + 0.1, 0]} receiveShadow>
        <boxGeometry args={[houseConfig.width + 0.1, 0.05, houseConfig.depth + 0.1]} />
        <meshPhysicalMaterial 
          color="#2A2A2A"
          roughness={0.9}
          metalness={0.1}
          envMapIntensity={0.4}
        />
      </mesh>
    </group>
  );

  const renderWindows = () => {
    const windows = [];
    const frontZ = houseConfig.depth / 2 + 0.01;
    const windowY = 0.4;
    
    // Ventanas frontales
    const windowCount = Math.floor(houseConfig.width / 1.8);
    const windowSpacing = houseConfig.width / (windowCount + 1);
    
    for (let i = 0; i < windowCount; i++) {
      const x = -houseConfig.width / 2 + windowSpacing * (i + 1);
      
      windows.push(
        <UltraRealisticWindow 
          key={`front-window-${i}`}
          position={[x, windowY, frontZ]} 
          size={[0.9, 1.2]} 
        />
      );
    }
    
    // Ventanas laterales
    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? -houseConfig.width / 2 - 0.01 : houseConfig.width / 2 + 0.01;
      windows.push(
        <UltraRealisticWindow 
          key={`side-window-${i}`}
          position={[x, windowY, 0]} 
          size={[0.8, 1.1]} 
        />
      );
    }
    
    // Ventanas del segundo piso si existe
    if (houseConfig.stories > 1) {
      for (let i = 0; i < windowCount; i++) {
        const x = -houseConfig.width / 2 + windowSpacing * (i + 1);
        
        windows.push(
          <UltraRealisticWindow 
            key={`second-window-${i}`}
            position={[x, windowY + houseConfig.height * 0.6, frontZ]} 
            size={[0.8, 1.0]} 
          />
        );
      }
    }
    
    return windows;
  };

  return (
    <group ref={meshRef} scale={houseConfig.scale}>
      {renderFoundation()}
      
      {/* Estructura principal */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[houseConfig.width, houseConfig.height, houseConfig.depth]} />
        <meshPhysicalMaterial 
          color={materialSystem.baseColor}
          roughness={materialSystem.roughness}
          metalness={materialSystem.metalness}
          envMapIntensity={materialSystem.envMapIntensity}
          clearcoat={materialSystem.clearcoat}
        />
      </mesh>

      {/* Texturas procedurales en fachada frontal */}
      {materialSystem.procedural && (
        <group position={[0, 0, houseConfig.depth / 2 + 0.001]}>
          <HyperRealisticBrickTexture 
            width={houseConfig.width} 
            height={houseConfig.height} 
          />
        </group>
      )}

      {/* Segundo piso si aplica */}
      {houseConfig.stories > 1 && (
        <group>
          <mesh position={[0, houseConfig.height * 0.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[houseConfig.width * 0.9, houseConfig.height * 0.7, houseConfig.depth * 0.9]} />
            <meshPhysicalMaterial 
              color={materialSystem.baseColor}
              roughness={materialSystem.roughness}
              metalness={materialSystem.metalness}
              envMapIntensity={materialSystem.envMapIntensity}
              clearcoat={materialSystem.clearcoat}
            />
          </mesh>
          
          {/* Separación entre pisos */}
          <mesh position={[0, houseConfig.height * 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[houseConfig.width + 0.15, 0.12, houseConfig.depth + 0.15]} />
            <meshPhysicalMaterial 
              color="#E0E0E0" 
              roughness={0.3}
              metalness={0.08}
              envMapIntensity={0.8}
              clearcoat={0.6}
            />
          </mesh>
        </group>
      )}

      <UltraDetailedRoof houseConfig={houseConfig} accentColor={accentColor} />
      {renderWindows()}
      
      <LuxuryEntranceDoor 
        position={[0, -houseConfig.height / 2 + 1.0, houseConfig.depth / 2 + 0.01]}
        accentColor={accentColor}
      />

      {/* Elementos arquitectónicos adicionales según estilo */}
      {architecturalStyle === 'Industrial' && (
        <group>
          <mesh position={[-houseConfig.width / 2 - 0.15, houseConfig.height / 4, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, houseConfig.height * 0.9]} />
            <meshPhysicalMaterial 
              color="#616161" 
              metalness={0.9} 
              roughness={0.3}
              envMapIntensity={2.0}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Objetos 3D del catálogo
function SceneObjectComponent({ object }: { object: any }) {
  const meshRef = useRef<THREE.Group>(null);
  const [x, y, z] = object.position as [number, number, number];
  const [rx = 0, ry = 0, rz = 0] = (object.rotation || [0, 0, 0]) as [number, number, number];
  const [sx = 1, sy = 1, sz = 1] = (object.scale || [1, 1, 1]) as [number, number, number];

  // Animación sutil y efectos visuales
  useFrame((state) => {
    if (meshRef.current) {
      if (object.category === 'Plantas y Árboles') {
        meshRef.current.rotation.y = ry + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      } else if (object.category === 'Iluminación') {
        // Pulsación sutil para luces
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
        meshRef.current.scale.setScalar(scale);
      } else if (object.category === 'Decoración' && object.name.includes('Fuente')) {
        // Movimiento para fuentes de agua
        meshRef.current.rotation.y += 0.005;
      }
    }
  });

  const renderObjectByCategory = () => {
    switch (object.category) {
      case 'Vehículos':
        return (
          <group>
            {/* Carrocería principal */}
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[4.5, 1.2, 1.8]} />
              <meshPhysicalMaterial 
                color={object.name.includes('Deportivo') ? '#DC2626' : 
                      object.name.includes('SUV') ? '#1F2937' : '#3B82F6'}
                metalness={0.9}
                roughness={0.1}
                envMapIntensity={2.0}
                clearcoat={1.0}
                clearcoatRoughness={0.05}
              />
            </mesh>
            
            {/* Ruedas */}
            {([ 
              [-1.6, 0, -0.8] as [number, number, number], 
              [-1.6, 0, 0.8] as [number, number, number], 
              [1.6, 0, -0.8] as [number, number, number], 
              [1.6, 0, 0.8] as [number, number, number]
            ]).map((pos, i) => (
              <group key={i}>
                <mesh position={pos} rotation={[Math.PI/2, 0, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.35, 0.35, 0.25]} />
                  <meshPhysicalMaterial color="#1F1F1F" roughness={0.9} metalness={0.1} />
                </mesh>
                {/* Llantas metálicas */}
                <mesh position={pos} rotation={[Math.PI/2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.25, 0.25, 0.27]} />
                  <meshPhysicalMaterial 
                    color="#C0C0C0" 
                    metalness={0.9} 
                    roughness={0.1}
                    envMapIntensity={2.0}
                  />
                </mesh>
              </group>
            ))}
            
            {/* Parabrisas */}
            <mesh position={[0.5, 0.9, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.0, 0.8, 1.6]} />
              <meshPhysicalMaterial 
                color="#E8F4FD"
                transparent
                opacity={0.3}
                metalness={0.0}
                roughness={0.01}
                transmission={0.9}
                envMapIntensity={1.5}
              />
            </mesh>
            
            {/* Faros */}
            <mesh position={[2.3, 0.4, -0.5]} castShadow>
              <sphereGeometry args={[0.2, 16, 12]} />
              <meshPhysicalMaterial color="#FFFFFF" emissive="#FFFFAA" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[2.3, 0.4, 0.5]} castShadow>
              <sphereGeometry args={[0.2, 16, 12]} />
              <meshPhysicalMaterial color="#FFFFFF" emissive="#FFFFAA" emissiveIntensity={0.2} />
            </mesh>
          </group>
        );

      case 'Plantas y Árboles':
        return (
          <group>
            {/* Tronco */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.2 + Math.random() * 0.1, 0.3 + Math.random() * 0.1, 3 + Math.random() * 2]} />
              <meshPhysicalMaterial 
                color={object.name.includes('Bambú') ? '#228B22' : '#8B4513'}
                roughness={0.95}
                metalness={0.0}
                envMapIntensity={0.4}
              />
            </mesh>
            
            {/* Copa/Follaje */}
            <mesh position={[0, 3 + Math.random() * 1, 0]} castShadow receiveShadow>
              <sphereGeometry args={[1.5 + Math.random() * 1, 16, 12]} />
              <meshPhysicalMaterial 
                color={object.name.includes('Cerezo') ? '#FFB6C1' :
                      object.name.includes('Palmera') ? '#32CD32' : '#228B22'}
                roughness={0.9}
                metalness={0.0}
                envMapIntensity={0.3}
              />
            </mesh>
            
            {/* Flores ocasionales */}
            {object.name.includes('Flor') && Array.from({length: 8}, (_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = 1.2 + Math.random() * 0.5;
              const flowerPos: [number, number, number] = [
                Math.cos(angle) * radius, 
                2.5 + Math.random() * 1, 
                Math.sin(angle) * radius
              ];
              return (
                <mesh 
                  key={i} 
                  position={flowerPos} 
                  castShadow
                >
                  <sphereGeometry args={[0.08, 8, 6]} />
                  <meshPhysicalMaterial 
                    color={object.name.includes('Rosa') ? '#FF69B4' : '#DA70D6'}
                    emissive="#FFB6C1" 
                    emissiveIntensity={0.1} 
                  />
                </mesh>
              );
            })}
          </group>
        );

      case 'Muebles Exteriores':
        return (
          <group>
            {object.name.includes('Mesa') ? (
              <>
                {/* Mesa */}
                <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.8, 0.8, 0.05]} />
                  <meshPhysicalMaterial color="#8B4513" roughness={0.8} metalness={0.1} />
                </mesh>
                <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.05, 0.08, 0.4]} />
                  <meshPhysicalMaterial color="#654321" roughness={0.9} metalness={0.0} />
                </mesh>
              </>
            ) : object.name.includes('Sofá') ? (
              <>
                {/* Sofá base */}
                <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                  <boxGeometry args={[2.0, 0.5, 0.8]} />
                  <meshPhysicalMaterial color="#8B5CF6" roughness={0.9} metalness={0.0} />
                </mesh>
                {/* Respaldo */}
                <mesh position={[0, 0.6, -0.35]} castShadow receiveShadow>
                  <boxGeometry args={[2.0, 0.7, 0.1]} />
                  <meshPhysicalMaterial color="#7C3AED" roughness={0.9} metalness={0.0} />
                </mesh>
                {/* Brazos */}
                <mesh position={[-0.95, 0.5, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.1, 0.6, 0.8]} />
                  <meshPhysicalMaterial color="#7C3AED" roughness={0.9} metalness={0.0} />
                </mesh>
                <mesh position={[0.95, 0.5, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.1, 0.6, 0.8]} />
                  <meshPhysicalMaterial color="#7C3AED" roughness={0.9} metalness={0.0} />
                </mesh>
              </>
            ) : (
              <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshPhysicalMaterial color="#92400E" roughness={0.8} metalness={0.1} />
              </mesh>
            )}
          </group>
        );

      case 'Iluminación':
        return (
          <group>
            {/* Poste */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.05, 0.08, 3]} />
              <meshPhysicalMaterial color="#2A2A2A" metalness={0.8} roughness={0.2} />
            </mesh>
            
            {/* Lámpara */}
            <mesh position={[0, 2.8, 0]} castShadow>
              <sphereGeometry args={[0.3, 16, 12]} />
              <meshPhysicalMaterial 
                color="#FFF8DC"
                transparent
                opacity={0.8}
                transmission={0.6}
                emissive="#FFFFAA"
                emissiveIntensity={0.3}
              />
            </mesh>
            
            {/* Luz real */}
            <pointLight 
              position={[0, 2.8, 0]} 
              intensity={2}
              color="#FFF8DC"
              distance={8}
              decay={2}
              castShadow
            />
          </group>
        );

      case 'Decoración':
        if (object.name.includes('Fuente')) {
          return (
            <group>
              {/* Base de la fuente */}
              <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1.2, 1.2, 0.2]} />
                <meshPhysicalMaterial color="#F8F8F8" roughness={0.1} metalness={0.2} />
              </mesh>
              
              {/* Pileta central */}
              <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.8, 0.8, 0.6]} />
                <meshPhysicalMaterial color="#E5E7EB" roughness={0.2} metalness={0.1} />
              </mesh>
              
              {/* Agua */}
              <mesh position={[0, 0.65, 0]} receiveShadow>
                <cylinderGeometry args={[0.75, 0.75, 0.1]} />
                <meshPhysicalMaterial 
                  color="#0EA5E9"
                  transparent
                  opacity={0.7}
                  transmission={0.8}
                  roughness={0.0}
                  metalness={0.0}
                />
              </mesh>
              
              {/* Efectos de agua */}
              <group position={[0, 0.8, 0] as [number, number, number]}>
                <Sparkles 
                  count={20}
                  scale={1.5}
                  size={2}
                  speed={0.3}
                  color="#87CEEB"
                  opacity={0.6}
                />
              </group>
            </group>
          );
        } else {
          return (
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.8, 1, 0.8]} />
              <meshPhysicalMaterial color="#D1D5DB" roughness={0.7} metalness={0.1} />
            </mesh>
          );
        }

      default:
        return (
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial color="#6B7280" roughness={0.8} metalness={0.2} />
          </mesh>
        );
    }
  };

  return (
    <group 
      ref={meshRef}
      position={[x, y, z] as [number, number, number]}
      rotation={[rx, ry, rz] as [number, number, number]}
      scale={[sx, sy, sz] as [number, number, number]}
    >
      {renderObjectByCategory()}
    </group>
  );
}

export default function FacadeViewer3D({ 
  architecturalStyle, 
  material, 
  accentColor, 
  propertyModel,
  roofType,
  windowStyle,
  exteriorFeature,
  sceneObjects = [],
  uploadedModels = []
}: FacadeViewer3DProps) {
  
  console.log('FacadeViewer3D - Render con uploadedModels:', uploadedModels?.length || 0);
  
  // Verificar modelos subidos con logging detallado
  const hasCustomModel = uploadedModels && uploadedModels.length > 0 && uploadedModels.some(model => {
    console.log('FacadeViewer3D - Verificando modelo:', { 
      id: model.id, 
      status: model.status,
      hasUrl: !!model.url,
      urlValid: model.url?.startsWith('blob:')
    });
    return model.status === 'ready';
  });
  
  const mainModel = hasCustomModel ? uploadedModels.find(model => model.status === 'ready') : null;
  
  console.log('FacadeViewer3D - hasCustomModel:', hasCustomModel);
  console.log('FacadeViewer3D - mainModel:', mainModel ? { id: mainModel.id, name: mainModel.name, url: mainModel.url?.substring(0, 50) + '...' } : null);
  return (
    <div className="w-full h-full">
      <Canvas 
        shadows={{ type: THREE.PCFSoftShadowMap, autoUpdate: true }}
        camera={{ position: [8, 6, 8], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={45} />
        
        {/* Sistema de iluminación cinematográfica */}
        <ambientLight intensity={0.2} />
        
        {/* Luz principal (sol) */}
        <directionalLight 
          position={[25, 25, 15]} 
          intensity={3.5} 
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={100}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-bias={-0.0001}
          color="#FFF8DC"
        />
        
        {/* Luz de relleno */}
        <directionalLight position={[-20, 15, -10]} intensity={1.2} color="#87CEEB" />
        
        {/* Luz de contorno */}
        <directionalLight position={[10, 8, -20]} intensity={0.8} color="#FFE4B5" />
        
        {/* Luces puntuales para atmósfera */}
        <pointLight position={[-20, 25, -20]} intensity={2.0} color="#87CEEB" distance={50} decay={1.5} />
        <pointLight position={[20, 20, 20]} intensity={1.5} color="#FFF8DC" distance={40} decay={1.2} />
        
        {/* Luz hemisférica para cielo */}
        <hemisphereLight args={['#87CEEB', '#8B7355', 1.2]} />
        
        {/* Environment mapping de alta calidad */}
        <Environment preset="dawn" environmentIntensity={0.8} blur={0.1} />
        
        {/* Efectos atmosféricos */}
        <fog attach="fog" args={['#E6F3FF', 50, 120]} />
        
        {/* Suelo hiper-realista con textura de césped */}
        <group>
          {/* Césped principal ultra-detallado */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, 0]} receiveShadow>
            <planeGeometry args={[80, 80, 120, 120]} />
            <meshPhysicalMaterial 
              color="#3A6B3F"
              roughness={0.99}
              metalness={0.0}
              envMapIntensity={0.2}
              normalScale={[1.5, 1.5]}
              bumpScale={0.08}
            />
          </mesh>
          
          {/* Césped con variación de color - manchas más oscuras */}
          {Array.from({ length: 30 }, (_, i) => {
            const patchAngle = Math.random() * Math.PI * 2;
            const patchDist = Math.random() * 35;
            const patchX = Math.cos(patchAngle) * patchDist;
            const patchZ = Math.sin(patchAngle) * patchDist;
            const patchSize = 2 + Math.random() * 4;
            return (
              <mesh 
                key={`grass-patch-${i}`}
                rotation={[-Math.PI / 2, 0, Math.random() * Math.PI * 2]} 
                position={[patchX, -1.99, patchZ]} 
                receiveShadow
              >
                <planeGeometry args={[patchSize, patchSize]} />
                <meshPhysicalMaterial 
                  color={i % 3 === 0 ? "#2A5530" : i % 3 === 1 ? "#3A6B3F" : "#4A7C59"}
                  roughness={0.98}
                  metalness={0.0}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            );
          })}
          
          {/* Detalles de césped - briznas individuales */}
          {Array.from({ length: 200 }, (_, i) => {
            const bladeAngle = Math.random() * Math.PI * 2;
            const bladeDist = Math.random() * 25;
            const bladeX = Math.cos(bladeAngle) * bladeDist;
            const bladeZ = Math.sin(bladeAngle) * bladeDist;
            return (
              <mesh 
                key={`grass-blade-${i}`}
                position={[bladeX, -1.95, bladeZ]}
                rotation={[0, Math.random() * Math.PI * 2, Math.PI / 2 + (Math.random() - 0.5) * 0.3]}
                castShadow
              >
                <planeGeometry args={[0.02, 0.15]} />
                <meshPhysicalMaterial 
                  color={Math.random() > 0.5 ? "#2A8B2A" : "#3A9B3A"}
                  roughness={0.9}
                  metalness={0.0}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}
          
          {/* Camino de entrada de piedra */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.95, 8]} receiveShadow>
            <planeGeometry args={[3, 12]} />
            <meshPhysicalMaterial 
              color="#D3D3D3" 
              roughness={0.6}
              metalness={0.1}
              envMapIntensity={0.5}
            />
          </mesh>
          
          {/* Calle asfaltada con líneas */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.92, 18]} receiveShadow>
            <planeGeometry args={[60, 12]} />
            <meshPhysicalMaterial 
              color="#2A2A2A" 
              roughness={0.9}
              metalness={0.02}
              envMapIntensity={0.2}
            />
          </mesh>
          
          {/* Líneas de la calle */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.91, 18]} receiveShadow>
            <planeGeometry args={[0.2, 12]} />
            <meshBasicMaterial color="#FFFF00" />
          </mesh>
        </group>
        
        {/* Paisaje urbano ultra-realista */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 15 + Math.random() * 8;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const treeHeight = 8 + Math.random() * 4;
          const trunkRadius = 0.4 + Math.random() * 0.3;
          const foliageRadius = 2.5 + Math.random() * 1.5;
          const isStreetLamp = i % 4 === 0;
          
          if (isStreetLamp) {
            return (
              <group key={i} position={[x, 0, z]}>
                {/* Poste de farola */}
                <mesh position={[0, treeHeight / 2 - 1, 0]} castShadow>
                  <cylinderGeometry args={[0.08, 0.12, treeHeight, 16]} />
                  <meshPhysicalMaterial 
                    color="#2A2A2A"
                    metalness={0.8}
                    roughness={0.2}
                    envMapIntensity={1.5}
                  />
                </mesh>
                
                {/* Lámpara */}
                <mesh position={[0, treeHeight - 1, 0]} castShadow>
                  <sphereGeometry args={[0.4, 16, 12]} />
                  <meshPhysicalMaterial 
                    color="#FFF8DC"
                    transparent
                    opacity={0.9}
                    transmission={0.7}
                    thickness={0.1}
                    envMapIntensity={1.0}
                  />
                </mesh>
                
                {/* Iluminación de farola */}
                <pointLight 
                  position={[0, treeHeight - 1, 0]} 
                  intensity={3.0}
                  color="#FFF8DC"
                  distance={12}
                  decay={2}
                  castShadow
                />
              </group>
            );
          }
          
          return (
            <group key={i} position={[x, 0, z]}>
              {/* Tronco ultra-realista con textura de corteza */}
              <mesh position={[0, treeHeight / 2 - 1.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[trunkRadius, trunkRadius * 1.2, treeHeight, 32]} />
                <meshPhysicalMaterial 
                  color="#3D2817"
                  roughness={0.99}
                  metalness={0.0}
                  envMapIntensity={0.2}
                  normalScale={[2.0, 2.0]}
                  bumpScale={0.15}
                />
              </mesh>
              
              {/* Detalles de corteza */}
              {Array.from({ length: 8 }, (_, j) => {
                const barkAngle = (j / 8) * Math.PI * 2;
                const barkX = Math.cos(barkAngle) * (trunkRadius + 0.02);
                const barkZ = Math.sin(barkAngle) * (trunkRadius + 0.02);
                const barkY = (j * treeHeight / 8) - 1.5;
                return (
                  <mesh key={j} position={[barkX, barkY, barkZ]} castShadow>
                    <boxGeometry args={[0.05, treeHeight / 8 - 0.1, 0.03]} />
                    <meshPhysicalMaterial 
                      color="#2A1810"
                      roughness={1.0}
                      metalness={0.0}
                    />
                  </mesh>
                );
              })}
              
              {/* Copa principal con hojas realistas */}
              <mesh position={[0, treeHeight - 1, 0]} castShadow receiveShadow>
                <sphereGeometry args={[foliageRadius, 32, 24]} />
                <meshPhysicalMaterial 
                  color="#1A5F1A"
                  roughness={0.98}
                  metalness={0.0}
                  envMapIntensity={0.3}
                  transmission={0.05}
                  thickness={0.5}
                />
              </mesh>
              
              {/* Capas de follaje múltiples para profundidad */}
              {Array.from({ length: 5 }, (_, j) => {
                const layerAngle = (j / 5) * Math.PI * 2;
                const layerRadius = foliageRadius * 0.7;
                const layerX = Math.cos(layerAngle) * (layerRadius * 0.3);
                const layerZ = Math.sin(layerAngle) * (layerRadius * 0.3);
                const layerY = treeHeight - 1 + (Math.random() - 0.5) * 1.5;
                return (
                  <mesh key={j} position={[layerX, layerY, layerZ]} castShadow receiveShadow>
                    <sphereGeometry args={[layerRadius, 24, 16]} />
                    <meshPhysicalMaterial 
                      color={j % 2 === 0 ? "#228B22" : "#2E8B57"}
                      roughness={0.95}
                      metalness={0.0}
                      envMapIntensity={0.4}
                      transparent
                      opacity={0.85}
                      transmission={0.08}
                    />
                  </mesh>
                );
              })}
              
              {/* Hojas individuales para mayor detalle */}
              {Array.from({ length: 20 }, (_, j) => {
                const leafAngle = Math.random() * Math.PI * 2;
                const leafDist = Math.random() * foliageRadius;
                const leafX = Math.cos(leafAngle) * leafDist;
                const leafZ = Math.sin(leafAngle) * leafDist;
                const leafY = treeHeight - 1 + (Math.random() - 0.5) * foliageRadius * 1.2;
                return (
                  <mesh 
                    key={j} 
                    position={[leafX, leafY, leafZ]} 
                    rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
                    castShadow
                  >
                    <planeGeometry args={[0.3, 0.5]} />
                    <meshPhysicalMaterial 
                      color="#32CD32"
                      roughness={0.8}
                      metalness={0.0}
                      side={THREE.DoubleSide}
                      transparent
                      opacity={0.9}
                    />
                  </mesh>
                );
              })}
            </group>
          );
        })}
        
        {/* Casa principal o modelo personalizado - Los modelos subidos reemplazan COMPLETAMENTE la casa */}
        {mainModel ? (
          // SOLO mostrar el modelo personalizado subido - NO la casa generada
          <group key={`main-model-${mainModel.id}`}>
            <CustomModel3D
              modelUrl={mainModel.url}
              modelType={mainModel.type}
              position={mainModel.position}
              rotation={mainModel.rotation}
              scale={mainModel.scale}
              modelId={mainModel.id}
            />
            
            {/* Etiqueta indicando que es un modelo personalizado */}
            <group position={[mainModel.position[0], mainModel.position[1] + 4, mainModel.position[2]]}>
              <mesh>
                <planeGeometry args={[4, 0.8]} />
                <meshBasicMaterial 
                  color="#FFFFFF" 
                  transparent 
                  opacity={0.95} 
                  side={THREE.DoubleSide}
                />
              </mesh>
              
              {/* Borde de la etiqueta principal */}
              <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[4.2, 1.0]} />
                <meshBasicMaterial 
                  color="#10B981" 
                  transparent 
                  opacity={0.9} 
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
            
            {/* Luz especial para destacar el modelo personalizado */}
            <pointLight 
              position={[mainModel.position[0], mainModel.position[1] + 6, mainModel.position[2]]} 
              intensity={2.5}
              color="#10B981"
              distance={15}
              decay={1.2}
            />
            
            {/* Efectos adicionales para modelos personalizados */}
            <group position={[mainModel.position[0], mainModel.position[1] + 5, mainModel.position[2]]}>
              <Sparkles 
                count={30}
                scale={3.0}
                size={6}
                speed={0.5}
                color="#10B981"
                opacity={0.6}
              />
            </group>
            
            {/* Debug info para verificar que el modelo se mantiene */}
            <group position={[mainModel.position[0] - 3, mainModel.position[1] + 2, mainModel.position[2]]}>
              <mesh>
                <planeGeometry args={[2, 0.5]} />
                <meshBasicMaterial 
                  color="#000000" 
                  transparent 
                  opacity={0.8} 
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[1.9, 0.4]} />
                <meshBasicMaterial 
                  color="#00FF00" 
                  transparent 
                  opacity={0.9} 
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        ) : (
          // Solo mostrar la casa generada si NO hay modelos personalizados subidos
          <HouseModel 
            architecturalStyle={architecturalStyle}
            material={material}
            accentColor={accentColor}
            propertyModel={propertyModel}
            roofType={roofType}
            windowStyle={windowStyle}
            exteriorFeature={exteriorFeature}
          />
        )}
        
        {/* Objetos de la escena */}
        {sceneObjects && sceneObjects.length > 0 && (
          <group>
            {sceneObjects.map((object) => {
              console.log('FacadeViewer3D - Renderizando objeto:', object);
              return <SceneObjectComponent key={object.id} object={object} />;
            })}
          </group>
        )}
        
        {/* Modelos 3D adicionales (si hay más de uno) */}
        {uploadedModels && uploadedModels.length > 1 && (
          <group>
            {uploadedModels.slice(1).map((model, index) => {
              console.log('FacadeViewer3D - Renderizando modelo adicional:', model);
              
              // Posicionar modelos adicionales alrededor del modelo principal
              const angle = (index / (uploadedModels.length - 1)) * Math.PI * 2;
              const radius = 8 + index * 2;
              const x = Math.cos(angle) * radius;
              const z = Math.sin(angle) * radius;
              const position: [number, number, number] = [x, -1.8, z];
              
              return (
                <group key={`additional-model-${model.id}`}>
                  <CustomModel3D
                    modelUrl={model.url}
                    modelType={model.type}
                    position={position}
                    rotation={model.rotation}
                    scale={[0.8, 0.8, 0.8]} // Más pequeños que el principal
                    modelId={model.id}
                  />
                  
                  {/* Etiqueta flotante */}
                  <group position={[position[0], position[1] + 3.5, position[2]]}>
                    <mesh>
                      <planeGeometry args={[2, 0.5]} />
                      <meshBasicMaterial 
                        color="#FFFFFF" 
                        transparent 
                        opacity={0.9} 
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                    
                    <mesh position={[0, 0, 0.001]}>
                      <planeGeometry args={[2.1, 0.6]} />
                      <meshBasicMaterial 
                        color="#10B981" 
                        transparent 
                        opacity={0.8} 
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  </group>
                  
                  {/* Marcador en el suelo */}
                  <mesh 
                    position={[position[0], -1.98, position[2]]} 
                    rotation={[-Math.PI / 2, 0, 0]}
                  >
                    <ringGeometry args={[0.8, 1.2, 16]} />
                    <meshBasicMaterial 
                      color="#10B981" 
                      transparent 
                      opacity={0.6} 
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}
        
        {/* Indicadores visuales para objetos recién agregados */}
        {sceneObjects && sceneObjects.length > 0 && (
          <group>
            {sceneObjects.slice(-1).map((object) => (
              <group key={`indicator-${object.id}`} position={object.position as [number, number, number]}>
                <mesh position={[0, 3, 0]}>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <meshBasicMaterial color="#10B981" transparent opacity={0.9} />
                </mesh>
                <mesh position={[0, 3, 0]}>
                  <sphereGeometry args={[0.25, 8, 8]} />
                  <meshBasicMaterial color="#10B981" transparent opacity={0.3} />
                </mesh>
                <pointLight 
                  position={[0, 3, 0]} 
                  intensity={1.0}
                  color="#10B981"
                  distance={6}
                  decay={2}
                />
              </group>
            ))}
          </group>
        )}
        
        {/* Sombras de contacto para mayor realismo */}
        <ContactShadows 
          position={[0, -1.99, 0]}
          opacity={0.4}
          scale={20}
          blur={2.5}
          far={10}
          resolution={1024}
        />
        
        <OrbitControls 
          enablePan={true}
          enableRotate={true}
          enableZoom={true}
          minDistance={5}
          maxDistance={40}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={0}
          dampingFactor={0.05}
          enableDamping
          autoRotate={false}
          target={[0, 1.2, 0]}
        />
      </Canvas>
    </div>
  );
}
