import { useState, useRef, useEffect } from 'react';
import { Upload, Box, Eye, Camera, Download, Info } from 'lucide-react';
import ModelUploader from './ModelUploader';
import ARViewer from './ARViewer';
import { convertModelToGLB } from '../utils/ModelConverter';
import { Loader2 } from 'lucide-react';

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
  const [activeSection, setActiveSection] = useState<'upload' | 'ar'>('upload');
  const [showARViewer, setShowARViewer] = useState(false);
  const [selectedModelForAR, setSelectedModelForAR] = useState<ARStudioUploadedModel | null>(null);
  const [isConverting, setIsConverting] = useState(false);

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

  const openARViewer = async (model?: ARStudioUploadedModel) => {
    const modelToShow = model || uploadedModels.find(m =>
      m.status === 'ready'
    );

    if (modelToShow) {
      if (modelToShow.type === 'obj' || modelToShow.type === 'fbx') {
        // Convert to GLB first
        console.log('ARStudio - Converting model to GLB:', modelToShow.name);
        setIsConverting(true);
        try {
          const glbUrl = await convertModelToGLB(modelToShow.url, modelToShow.type);
          console.log('ARStudio - Conversion successful:', glbUrl);
          // Create a temporary model object with the GLB URL
          const arModel = {
            ...modelToShow,
            url: glbUrl,
            type: 'glb' as const // Force type to glb
          };
          setSelectedModelForAR(arModel);
          setShowARViewer(true);
        } catch (error) {
          console.error('ARStudio - Conversion failed:', error);
          // Show error toast or alert (implement later or log for now)
          alert('Error al convertir el modelo para AR. Intenta de nuevo.');
        } finally {
          setIsConverting(false);
        }
      } else {
        // Already GLB/GLTF
        setSelectedModelForAR(modelToShow);
        setShowARViewer(true);
      }
    }
  };

  const arCompatibleModels = uploadedModels.filter(m =>
    m.status === 'ready'
  );

  const renderUploadSection = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Cargar Modelo para AR Studio</h3>
        <ModelUploader
          onModelUpload={handleModelUpload}
          uploadedModels={uploadedModels}
          onRemoveModel={handleRemoveModel}
        />
      </div>
    </div>
  );

  const renderARSection = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
        {arCompatibleModels.length === 0 ? (
          <>
            <p className="text-gray-600 text-sm mb-2">
              No hay modelos cargados.
            </p>
            <button
              onClick={() => setActiveSection('upload')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Subir Modelo
            </button>
          </>
        ) : (
          <p className="text-gray-600 text-sm">
            Selecciona un modelo para ver en AR
          </p>
        )}
      </div>

      <div className="space-y-3">
        {arCompatibleModels.map((model) => (
          <div key={model.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-indigo-50 rounded-lg p-2">
                <Box className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {model.name}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExportToArkio(model)}
                    className="p-1 px-2 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 flex items-center"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Arkio
                  </button>
                  <button
                    onClick={() => openARViewer(model)}
                    disabled={isConverting}
                    className={`p-1 px-2 text-xs text-white rounded flex items-center ${isConverting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {isConverting ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Eye className="w-3 h-3 mr-1" />
                    )}
                    AR
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-4">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800 space-y-1">
            <p><span className="font-semibold">Formatos:</span> .glb, .gltf (Nativo) • .obj, .fbx (Conversión Auto)</p>
            <p><span className="font-semibold">Requisitos:</span> Móvil (iOS/Android) para ver en AR.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ARViewer
        isOpen={showARViewer}
        onClose={() => {
          setShowARViewer(false);
          setSelectedModelForAR(null);
        }}
        modelUrl={(() => {
          if (!selectedModelForAR) return null;
          const refData = modelFilesRef.current.get(selectedModelForAR.id);
          return refData?.url || selectedModelForAR.url;
        })()}
        modelType={selectedModelForAR?.type}
        modelName={selectedModelForAR?.name}
      />

      <div className="space-y-3 p-3">
        <div className="text-center">
          <h2 className="font-bold text-lg text-gray-900 flex items-center justify-center gap-2">
            <Camera className="w-6 h-6 text-purple-600" />
            AR Studio
          </h2>
        </div>

        <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: 'ar', label: 'AR', icon: Camera },
              { id: 'upload', label: 'Subir', icon: Upload }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as any)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${activeSection === id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="transition-all duration-300">
          {activeSection === 'upload' && renderUploadSection()}
          {activeSection === 'ar' && renderARSection()}
        </div>
      </div>
    </>
  );
}
