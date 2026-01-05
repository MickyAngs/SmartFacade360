import { useState, useRef, useEffect } from 'react';
import { Upload, AlertCircle, Box, Eye, Smartphone, Sparkles, Camera, Zap, ExternalLink } from 'lucide-react';
import ModelUploader from './ModelUploader';
import ARViewer from './ARViewer';

interface ARStudioUploadedModel {
  id: string;
  name: string;
  file: File;
  url: string;
  type: 'obj' | 'glb' | 'gltf' | 'fbx' | 'ifc' | 'revit';
  size: string;
  status: 'uploading' | 'ready' | 'error';
}

interface ARStudioProps {
  onModelUpload?: (model: ARStudioUploadedModel) => void;
  uploadedModels?: ARStudioUploadedModel[];
  onRemoveModel?: (id: string) => void;
}

export default function ARStudio({ 
  onModelUpload, 
  uploadedModels = [], 
  onRemoveModel 
}: ARStudioProps) {
  const [activeSection, setActiveSection] = useState<'upload' | 'ar' | 'help'>('upload');
  const [showARViewer, setShowARViewer] = useState(false);
  const [selectedModelForAR, setSelectedModelForAR] = useState<ARStudioUploadedModel | null>(null);
  
  // Mantener referencias fuertes a los archivos
  const modelFilesRef = useRef<Map<string, { file: File; url: string }>>(new Map());

  // Limpiar URLs cuando el componente se desmonta
  useEffect(() => {
    return () => {
      modelFilesRef.current.forEach((data) => {
        URL.revokeObjectURL(data.url);
      });
      modelFilesRef.current.clear();
    };
  }, []);

  const handleModelUpload = (model: ARStudioUploadedModel) => {
    console.log('ARStudio - Nuevo modelo:', model);
    
    // Guardar referencia fuerte del archivo
    modelFilesRef.current.set(model.id, {
      file: model.file,
      url: model.url
    });

    // Propagar al componente padre si existe
    if (onModelUpload) {
      onModelUpload(model);
    }

    // Auto-activar AR si el modelo es compatible y está listo
    if (model.status === 'ready' && (model.type === 'glb' || model.type === 'gltf')) {
      console.log('ARStudio - Auto-activando AR para modelo:', model.name);
      setTimeout(() => {
        setSelectedModelForAR(model);
        setShowARViewer(true);
      }, 1000); // Pequeño delay para que el usuario vea la confirmación
    }
  };

  const handleRemoveModel = (id: string) => {
    console.log('ARStudio - Removiendo modelo:', id);
    
    // Liberar URL del ref
    const refData = modelFilesRef.current.get(id);
    if (refData) {
      URL.revokeObjectURL(refData.url);
      modelFilesRef.current.delete(id);
    }

    // Propagar al componente padre si existe
    if (onRemoveModel) {
      onRemoveModel(id);
    }
  };

  const handleExportToArkio = (model?: ARStudioUploadedModel) => {
    if (!model && uploadedModels.length === 0) return;
    
    const modelToExport = model || uploadedModels[0];
    
    // Create download link for the model file
    const link = document.createElement('a');
    link.href = modelToExport.url;
    link.download = modelToExport.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Open Arkio download page
    setTimeout(() => {
      window.open('https://arkio.is/download/', '_blank');
    }, 100);
  };

  const openARViewer = (model?: ARStudioUploadedModel) => {
    const modelToShow = model || uploadedModels.find(m => 
      m.status === 'ready' && (m.type === 'glb' || m.type === 'gltf')
    );
    
    if (modelToShow) {
      setSelectedModelForAR(modelToShow);
      setShowARViewer(true);
    }
  };

  const arCompatibleModels = uploadedModels.filter(m => 
    m.status === 'ready' && (m.type === 'glb' || m.type === 'gltf')
  );

  const renderUploadSection = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-purple-100 rounded-lg p-2">
            <Upload className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Subir Modelos 3D</h3>
            <p className="text-sm text-gray-600">Para Realidad Aumentada</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="bg-green-100 border border-green-300 rounded-lg p-2">
            <p className="font-semibold text-green-900 text-xs mb-1">✅ Para Realidad Aumentada (móvil)</p>
            <p className="text-green-700 text-xs"><strong>.glb, .gltf</strong> - AR en móviles</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="font-semibold text-blue-900 text-xs mb-1">💻 Visualización 3D (PC y móvil)</p>
            <p className="text-blue-700 text-xs"><strong>.obj, .fbx, .rvt, .ifc</strong> - Todos los formatos funcionan en 3D</p>
          </div>
        </div>
      </div>

      <ModelUploader
        onModelUpload={handleModelUpload}
        uploadedModels={uploadedModels}
        onRemoveModel={handleRemoveModel}
      />
    </div>
  );

  const renderARSection = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-indigo-100 rounded-lg p-2">
            <Camera className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Realidad Aumentada</h3>
            <p className="text-sm text-gray-600">Ve tus modelos en el mundo real</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="text-indigo-900 font-medium">
              {arCompatibleModels.length} modelos listos
            </p>
            <p className="text-indigo-700 text-xs">
              Formatos compatibles con AR
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              arCompatibleModels.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="text-xs text-gray-600">
              {arCompatibleModels.length > 0 ? 'AR Ready' : 'Sin modelos AR'}
            </span>
          </div>
        </div>
      </div>

      {arCompatibleModels.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No hay modelos AR</h3>
          <p className="text-gray-600 text-sm mb-3">
            Solo archivos <strong>.glb</strong> o <strong>.gltf</strong> funcionan con Realidad Aumentada
          </p>
          
          {uploadedModels.length > 0 && uploadedModels.some(m => m.type === 'revit' || m.type === 'obj' || m.type === 'fbx' || m.type === 'ifc') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
              <p className="text-xs text-yellow-900 mb-1">
                <strong>ℹ️ Nota:</strong> Tienes modelos subidos pero no son compatibles con AR:
              </p>
              <ul className="text-xs text-yellow-800 space-y-1">
                {uploadedModels.some(m => m.type === 'revit') && (
                  <li>• <strong>Revit (.rvt, .rfa)</strong> - Solo visualización 3D</li>
                )}
                {uploadedModels.some(m => m.type === 'obj') && (
                  <li>• <strong>OBJ</strong> - Solo visualización 3D</li>
                )}
                {uploadedModels.some(m => m.type === 'fbx') && (
                  <li>• <strong>FBX</strong> - Solo visualización 3D</li>
                )}
                {uploadedModels.some(m => m.type === 'ifc') && (
                  <li>• <strong>IFC</strong> - Solo visualización 3D</li>
                )}
              </ul>
              <p className="text-xs text-yellow-900 mt-2">
                Los navegadores móviles solo soportan GLB/GLTF para AR.
              </p>
            </div>
          )}
          
          {/* PC/Desktop Compatibility Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-red-900 text-sm mb-2">⚠️ AR NO funciona en PC</h4>
            <div className="space-y-1 text-xs text-red-800">
              <p><strong>Realidad Aumentada requiere móvil</strong> (iPhone/Android)</p>
              <p>En PC solo tienes visualización 3D normal en el diseñador</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">💻 ¿Qué funciona en PC?</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <p>✅ <strong>Visualización 3D completa</strong> en el diseñador</p>
              <p>✅ Rotación y zoom con mouse</p>
              <p>❌ AR requiere móvil con cámara</p>
            </div>
          </div>

          {/* Optional Arkio - Collapsed */}
          {uploadedModels.length > 0 && uploadedModels.some(m => m.type !== 'glb' && m.type !== 'gltf') && (
            <details className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <summary className="cursor-pointer text-sm text-purple-900 font-medium flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Herramienta profesional externa (opcional)</span>
              </summary>
              <div className="mt-3">
                <p className="text-xs text-purple-800 mb-3">
                  Arkio.is soporta todos los formatos para VR profesional
                </p>
                <button
                  onClick={() => handleExportToArkio()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <span>Exportar a Arkio VR</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </details>
          )}
          
          <button
            onClick={() => setActiveSection('upload')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Subir Modelo GLB/GLTF
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm">Modelos Disponibles</h4>
          
          <div className="space-y-2">
            {arCompatibleModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Box className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {model.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="uppercase font-semibold text-green-600">{model.type}</span>
                      <span>•</span>
                      <span>{model.size}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openARViewer(model)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver AR</span>
                </button>
              </div>
            ))}
          </div>

          {/* Global AR Launcher */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
            <div className="text-center">
              <button
                onClick={() => openARViewer()}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-base font-semibold transition-all shadow-lg transform hover:scale-105"
              >
                <Camera className="w-5 h-5" />
                <span>Activar Realidad Aumentada</span>
                <Sparkles className="w-5 h-5" />
              </button>
              <p className="text-sm text-purple-700 mt-2">
                Experimenta tus modelos en el mundo real
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHelpSection = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-blue-100 rounded-lg p-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Guía de Uso</h3>
            <p className="text-sm text-gray-600">Cómo usar el Studio AR</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm mr-2">1</span>
            Subir Modelos
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-green-500">✅</span>
              <span><strong>Para AR:</strong> .glb, .gltf</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-yellow-500">🏗️</span>
              <span><strong>Revit (solo 3D):</strong> .rvt, .rfa, .rte, .rtc</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500">📦</span>
              <span><strong>Otros (solo 3D):</strong> .obj, .ifc</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500">⚠</span>
              <span>Tamaño máximo: 50MB por archivo</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm mr-2">2</span>
            Usar Realidad Aumentada
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-green-500">📱</span>
              <span>Usa un dispositivo móvil</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500">🌐</span>
              <span>iPhone: Safari | Android: Chrome</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-500">💡</span>
              <span>Asegúrate de tener buena iluminación</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm mr-2">3</span>
            Consejos Pro
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-yellow-500">⭐</span>
              <span>Los archivos .glb cargan más rápido</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-500">🎯</span>
              <span>Apunta a superficies planas para AR</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500">🔄</span>
              <span>Mueve el dispositivo para detectar el plano</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* AR Viewer Modal */}
      <ARViewer
        isOpen={showARViewer}
        onClose={() => {
          setShowARViewer(false);
          setSelectedModelForAR(null);
        }}
        modelUrl={(() => {
          if (!selectedModelForAR) return null;
          // Obtener URL del ref para mayor confiabilidad
          const refData = modelFilesRef.current.get(selectedModelForAR.id);
          return refData?.url || selectedModelForAR.url;
        })()}
        modelType={selectedModelForAR?.type}
        modelName={selectedModelForAR?.name}
      />

      <div className="space-y-3 p-3">
        {/* Studio Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="relative">
              <Camera className="w-8 h-8 text-purple-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <h2 className="font-bold text-lg text-gray-900">AR Studio</h2>
            <Sparkles className="w-6 h-6 text-pink-500" />
          </div>
          <p className="text-sm text-gray-600">
            Sube modelos 3D y experimenta la Realidad Aumentada
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'upload', label: 'Subir', icon: Upload },
              { id: 'ar', label: 'AR', icon: Camera },
              { id: 'help', label: 'Ayuda', icon: AlertCircle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as any)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm font-medium transition-all ${
                  activeSection === id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-h-80 overflow-y-auto">
          {activeSection === 'upload' && renderUploadSection()}
          {activeSection === 'ar' && renderARSection()}
          {activeSection === 'help' && renderHelpSection()}
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
          <h4 className="font-semibold text-gray-900 mb-2 text-xs flex items-center">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1 animate-pulse"></div>
            Estado del Studio
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-gray-600">Modelos</p>
              <p className="font-semibold text-purple-600 text-sm">{uploadedModels.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">AR Ready</p>
              <p className="font-semibold text-green-600 text-sm">{arCompatibleModels.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Tamaño</p>
              <p className="font-semibold text-blue-600 text-xs">
                {(() => {
                  const totalBytes = uploadedModels.reduce((acc, m) => acc + m.file.size, 0);
                  const mb = totalBytes / (1024 * 1024);
                  return mb > 0 ? `${mb.toFixed(1)}MB` : '0MB';
                })()}
              </p>
            </div>
          </div>
        </div>

        {arCompatibleModels.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-semibold text-green-800">
                🎉 ¡AR Activado!
              </p>
            </div>
            <p className="text-xs text-green-700">
              Tienes {arCompatibleModels.length} modelo{arCompatibleModels.length !== 1 ? 's' : ''} listo{arCompatibleModels.length !== 1 ? 's' : ''} para Realidad Aumentada
            </p>
          </div>
        )}
      </div>
    </>
  );
}
