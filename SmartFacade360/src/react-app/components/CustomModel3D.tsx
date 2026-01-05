import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader, FBXLoader } from 'three-stdlib';

interface CustomModel3DProps {
  modelUrl: string;
  modelType: 'obj' | 'glb' | 'gltf' | 'fbx' | 'ifc' | 'revit';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  modelId: string;
}

// Component for GLTF/GLB models
function GLTFModel({ url, position, rotation, scale }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('GLTFModel - Loading URL:', url);
    
    // Verificar que la URL es válida antes de intentar cargarla
    if (!url || !url.startsWith('blob:')) {
      console.error('GLTFModel - Invalid URL:', url);
      setError('URL inválida');
      return;
    }

    // Precargar el modelo para verificar que es válido
    try {
      useGLTF.preload(url);
      setError(null);
      console.log('GLTFModel - Modelo precargado exitosamente');
    } catch (error) {
      console.error('GLTFModel - Error precargando modelo:', error);
      setError('Error cargando modelo');
    }
  }, [url]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  if (error) {
    console.warn('GLTFModel - Error state:', error);
    // Mostrar un placeholder en caso de error
    return (
      <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshPhysicalMaterial
            color="#EF4444"
            roughness={0.7}
            metalness={0.3}
            envMapIntensity={0.8}
          />
        </mesh>
      </group>
    );
  }

  // Usar useGLTF hook directamente para cargar el modelo
  let gltf;
  try {
    gltf = useGLTF(url);
  } catch (error) {
    console.error('GLTFModel - Error usando useGLTF hook:', error);
    return (
      <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshPhysicalMaterial
            color="#EF4444"
            roughness={0.7}
            metalness={0.3}
            envMapIntensity={0.8}
          />
        </mesh>
      </group>
    );
  }

  const scene = Array.isArray(gltf) ? gltf[0].scene : gltf.scene;

  if (!scene) {
    console.log('GLTFModel - No scene found, showing placeholder');
    return (
      <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color="#3B82F6"
            roughness={0.5}
            metalness={0.5}
            envMapIntensity={1.0}
            opacity={0.7}
            transparent
          />
        </mesh>
      </group>
    );
  }

  console.log('GLTFModel - Rendering loaded model');
  return (
    <primitive
      ref={meshRef}
      object={scene.clone()}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
}

// Component for FBX models
function FBXModel({ url, position, rotation, scale }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loadingError, setLoadingError] = useState(false);

  useEffect(() => {
    const loader = new FBXLoader();
    loader.load(
      url,
      (object) => {
        // Apply enhanced materials for FBX
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Create a more realistic material
            child.material = new THREE.MeshPhysicalMaterial({
              color: '#8B7D6B',
              roughness: 0.6,
              metalness: 0.3,
              envMapIntensity: 1.0,
              clearcoat: 0.2,
              clearcoatRoughness: 0.8
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Scale down FBX models as they tend to be large
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        if (maxSize > 4) {
          const scaleFactor = 4 / maxSize;
          object.scale.setScalar(scaleFactor);
        }
        
        setModel(object);
      },
      undefined,
      (error) => {
        console.error('Error loading FBX model:', error);
        setLoadingError(true);
      }
    );
  }, [url]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  if (loadingError) {
    return (
      <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshPhysicalMaterial
            color="#FF6B6B"
            roughness={0.7}
            metalness={0.3}
            envMapIntensity={0.8}
          />
        </mesh>
        {/* Error indicator */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#FF0000" />
        </mesh>
      </group>
    );
  }

  if (!model) {
    return (
      <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color="#3B82F6"
            roughness={0.5}
            metalness={0.5}
            envMapIntensity={1.0}
            opacity={0.7}
            transparent
          />
        </mesh>
        {/* Loading indicator */}
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#3B82F6" />
        </mesh>
      </group>
    );
  }

  return (
    <primitive
      ref={meshRef}
      object={model}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

// Component for OBJ models
function OBJModel({ url, position, rotation, scale }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new OBJLoader();
    loader.load(
      url,
      (object) => {
        // Apply default material
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: '#8B7D6B',
              roughness: 0.7,
              metalness: 0.2,
              envMapIntensity: 0.8
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setModel(object);
      },
      undefined,
      (error) => {
        console.error('Error loading OBJ model:', error);
      }
    );
  }, [url]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  if (!model) return null;

  return (
    <primitive
      ref={meshRef}
      object={model}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

// Component for IFC models - attempt to load real file or show placeholder
function IFCModel({ url, position, rotation, scale }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loadingError, setLoadingError] = useState(false);

  useEffect(() => {
    if (!url) {
      setLoadingError(true);
      return;
    }

    // Intentar cargar como OBJ primero (muchos archivos IFC se pueden convertir)
    const loader = new OBJLoader();
    loader.load(
      url,
      (object) => {
        // Aplicar material específico para IFC
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: '#6B7280',
              roughness: 0.6,
              metalness: 0.3,
              envMapIntensity: 1.0
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setModel(object);
      },
      undefined,
      (error) => {
        console.warn('No se pudo cargar archivo IFC como OBJ:', error);
        setLoadingError(true);
      }
    );
  }, [url]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Si no se pudo cargar el archivo real, mostrar placeholder con información
  if (loadingError || !model) {
    return (
      <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
        {/* Placeholder para archivo IFC */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 2, 1.5]} />
          <meshPhysicalMaterial
            color="#6B7280"
            roughness={0.6}
            metalness={0.3}
            envMapIntensity={1.0}
          />
        </mesh>
        
        {/* Etiqueta indicando que es IFC */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[2.2, 0.1, 1.7]} />
          <meshPhysicalMaterial
            color="#3B82F6"
            roughness={0.3}
            metalness={0.7}
            envMapIntensity={1.2}
          />
        </mesh>
        
        {/* Texto flotante */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <primitive
      ref={meshRef}
      object={model}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

// Component for Revit models - attempt to load real file or show placeholder
function RevitModel({ url, position, rotation, scale }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loadingError, setLoadingError] = useState(false);

  useEffect(() => {
    if (!url) {
      setLoadingError(true);
      return;
    }

    // Intentar cargar como OBJ (algunos archivos Revit exportados)
    const loader = new OBJLoader();
    loader.load(
      url,
      (object) => {
        // Aplicar material específico para Revit
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: '#8B7D6B',
              roughness: 0.7,
              metalness: 0.2,
              envMapIntensity: 0.8
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setModel(object);
      },
      undefined,
      (error) => {
        console.warn('No se pudo cargar archivo Revit como OBJ:', error);
        setLoadingError(true);
      }
    );
  }, [url]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  // Si no se pudo cargar el archivo real, mostrar placeholder con información
  if (loadingError || !model) {
    return (
      <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
        {/* Placeholder arquitectónico para Revit */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.5, 1.8, 2]} />
          <meshPhysicalMaterial
            color="#8B7D6B"
            roughness={0.7}
            metalness={0.2}
            envMapIntensity={0.8}
          />
        </mesh>
        
        {/* Detalles arquitectónicos - techo */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 0.15, 2.2]} />
          <meshPhysicalMaterial
            color="#F5F5F5"
            roughness={0.3}
            metalness={0.2}
            envMapIntensity={0.8}
          />
        </mesh>
        
        {/* Detalles adicionales - cornisas */}
        <mesh position={[0, 0.9, 1.1]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.1, 0.1]} />
          <meshPhysicalMaterial
            color="#E0E0E0"
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[0, 0.9, -1.1]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.1, 0.1]} />
          <meshPhysicalMaterial
            color="#E0E0E0"
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
        
        {/* Ventanas */}
        <mesh position={[1.0, 0.2, 1.05]} castShadow>
          <boxGeometry args={[0.6, 1, 0.1]} />
          <meshPhysicalMaterial
            color="#4A90E2"
            transparent
            opacity={0.7}
            roughness={0.1}
            metalness={0.0}
          />
        </mesh>
        <mesh position={[-1.0, 0.2, 1.05]} castShadow>
          <boxGeometry args={[0.6, 1, 0.1]} />
          <meshPhysicalMaterial
            color="#4A90E2"
            transparent
            opacity={0.7}
            roughness={0.1}
            metalness={0.0}
          />
        </mesh>
        
        {/* Indicador Revit flotante */}
        <group position={[0, 2.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.4, 0.08, 0.08]} />
            <meshStandardMaterial color="#059669" emissive="#059669" emissiveIntensity={0.2} />
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <primitive
      ref={meshRef}
      object={model}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

export default function CustomModel3D({
  modelUrl,
  modelType,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  modelId
}: CustomModel3DProps) {
  console.log('CustomModel3D - Rendering:', { modelId, modelType, modelUrl: modelUrl?.substring(0, 50) + '...', position });

  // Verificar que tenemos una URL válida
  if (!modelUrl) {
    console.warn('CustomModel3D - No model URL provided for:', modelId);
    return null;
  }

  // Verificar que la URL del blob es válida
  if (!modelUrl.startsWith('blob:')) {
    console.warn('CustomModel3D - Invalid URL format:', modelUrl);
    return null;
  }

  // Render based on model type
  if (modelType === 'glb' || modelType === 'gltf') {
    return <GLTFModel url={modelUrl} position={position} rotation={rotation} scale={scale} />;
  } else if (modelType === 'fbx') {
    return <FBXModel url={modelUrl} position={position} rotation={rotation} scale={scale} />;
  } else if (modelType === 'obj') {
    return <OBJModel url={modelUrl} position={position} rotation={rotation} scale={scale} />;
  } else if (modelType === 'ifc') {
    return <IFCModel url={modelUrl} position={position} rotation={rotation} scale={scale} />;
  } else if (modelType === 'revit') {
    return <RevitModel url={modelUrl} position={position} rotation={rotation} scale={scale} />;
  }

  console.warn('CustomModel3D - Unsupported model type:', modelType);
  return null;
}
