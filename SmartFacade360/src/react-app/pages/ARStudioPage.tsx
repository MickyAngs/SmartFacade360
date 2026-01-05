import { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import ARStudio from '@/react-app/components/ARStudio';
import type { UploadedModel } from '@/shared/types';
import Toast from '@/react-app/components/Toast';
import NavigationMenu from '@/react-app/components/NavigationMenu';

export default function ARStudioPage() {
  const [uploadedModels, setUploadedModels] = useState<UploadedModel[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Mantener referencias fuertes a los archivos
  const modelFilesRef = useRef<Map<string, { file: File; url: string }>>(new Map());
  
  useEffect(() => {
    return () => {
      console.log('ARStudioPage - Limpiando URLs al desmontar');
      modelFilesRef.current.forEach((data) => {
        URL.revokeObjectURL(data.url);
      });
      modelFilesRef.current.clear();
    };
  }, []);

  const handleModelUpload = (model: { 
    id: string; 
    name: string; 
    file: File; 
    url: string; 
    type: 'obj' | 'glb' | 'gltf' | 'fbx' | 'ifc' | 'revit'; 
    size: string; 
    status: 'uploading' | 'ready' | 'error'; 
  }) => {
    console.log('ARStudioPage - handleModelUpload llamado con:', model);
    
    // Guardar referencia fuerte del archivo
    modelFilesRef.current.set(model.id, {
      file: model.file,
      url: model.url
    });
    
    const position: [number, number, number] = [0, 0, 0];
    const rotation: [number, number, number] = [0, 0, 0];
    const scale: [number, number, number] = [1, 1, 1];
    
    const newModel: UploadedModel = {
      ...model,
      position,
      rotation,
      scale
    };
    
    setUploadedModels(prev => [...prev, newModel]);
    
    if (model.status === 'ready') {
      setToastMessage(`¡Modelo "${model.name}" subido exitosamente!`);
      setShowToast(true);
    }
  };

  const handleRemoveModel = (id: string) => {
    console.log('ARStudioPage - Removiendo modelo con ID:', id);
    
    const refData = modelFilesRef.current.get(id);
    if (refData) {
      URL.revokeObjectURL(refData.url);
      modelFilesRef.current.delete(id);
    }
    
    setUploadedModels(prev => prev.filter(model => model.id !== id));
    setToastMessage('Modelo eliminado');
    setShowToast(true);
  };

  const arCompatibleModels = uploadedModels.filter(m => 
    m.status === 'ready' && (m.type === 'glb' || m.type === 'gltf')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <NavigationMenu />
      
      <Toast 
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Phone Container */}
        <div 
          className="bg-black rounded-3xl p-2 shadow-2xl border-4 border-gray-900 relative overflow-hidden"
          style={{ 
            width: '360px',
            height: '800px',
            maxWidth: '360px',
            maxHeight: '800px',
            minWidth: '360px',
            minHeight: '800px'
          }}
        >
          {/* Screen Container */}
          <div className="bg-white rounded-2xl w-full h-full overflow-hidden relative">
            {/* App Content */}
            <div className="flex-1 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 h-full overflow-y-auto">
              {/* Header */}
              <header className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link 
                      to="/"
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Camera className="w-7 h-7 text-white" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <h1 className="text-lg font-bold text-white">
                        AR Studio
                      </h1>
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                    </div>
                    
                    <div className="w-9"></div>
                  </div>
                  
                  <p className="text-center text-sm text-purple-100">
                    Sube modelos 3D y experimenta la Realidad Aumentada
                  </p>
                </div>
              </header>

              {/* Main Content */}
              <div className="px-3 py-4 pb-20">
                {/* Welcome Card */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-3">
                      <Camera className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-gray-900">¡Bienvenido al AR Studio!</h2>
                      <p className="text-sm text-gray-600">
                        Tu espacio para Realidad Aumentada
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {uploadedModels.length}
                      </p>
                      <p className="text-xs text-purple-700 mt-1">Modelos</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {arCompatibleModels.length}
                      </p>
                      <p className="text-xs text-green-700 mt-1">AR Ready</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {uploadedModels.reduce((acc, m) => acc + m.file.size, 0) / (1024 * 1024) > 0 
                          ? `${(uploadedModels.reduce((acc, m) => acc + m.file.size, 0) / (1024 * 1024)).toFixed(1)}` 
                          : '0'}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">MB Total</p>
                    </div>
                  </div>
                </div>

                {/* AR Studio Component */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <ARStudio
                    onModelUpload={handleModelUpload}
                    uploadedModels={uploadedModels.map(model => ({
                      id: model.id,
                      name: model.name,
                      file: model.file,
                      url: model.url,
                      type: model.type,
                      size: model.size,
                      status: model.status
                    }))}
                    onRemoveModel={handleRemoveModel}
                  />
                </div>

                {/* Info Cards */}
                <div className="mt-4 space-y-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
                    <h3 className="font-bold mb-2 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      ¿Por qué AR Studio?
                    </h3>
                    <ul className="text-sm space-y-1 opacity-90">
                      <li>• Visualiza modelos en tu espacio real</li>
                      <li>• Compatible con móviles iOS y Android</li>
                      <li>• Soporta formatos GLB y GLTF</li>
                      <li>• Experiencia inmersiva y realista</li>
                    </ul>
                  </div>

                  {arCompatibleModels.length === 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                      <h3 className="font-semibold text-yellow-900 mb-2 text-sm">
                        💡 Formatos Soportados
                      </h3>
                      <div className="space-y-1">
                        <p className="text-xs text-yellow-800">
                          <strong>🎯 Para AR:</strong> .glb, .gltf (Realidad Aumentada)
                        </p>
                        <p className="text-xs text-yellow-800">
                          <strong>🏗️ Revit:</strong> .rvt, .rfa, .rte, .rtc (Autodesk)
                        </p>
                        <p className="text-xs text-yellow-800">
                          <strong>📦 Otros:</strong> .obj, .ifc (Visualización 3D)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
