import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Loader2, Box, Zap } from 'lucide-react';

interface ModelUploaderUploadedModel {
  id: string;
  name: string;
  file: File;
  url: string;
  type: 'obj' | 'glb' | 'gltf' | 'fbx' | 'ifc' | 'revit';
  size: string;
  status: 'uploading' | 'ready' | 'error';
}

interface ModelUploaderProps {
  onModelUpload: (model: ModelUploaderUploadedModel) => void;
  uploadedModels: ModelUploaderUploadedModel[];
  onRemoveModel: (id: string) => void;
}

export default function ModelUploader({
  onModelUpload,
  uploadedModels,
  onRemoveModel
}: ModelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileType = (filename: string): 'obj' | 'glb' | 'gltf' | 'ifc' | 'revit' | 'fbx' | null => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'obj' || ext === 'glb' || ext === 'gltf' || ext === 'ifc' || ext === 'fbx') {
      return ext;
    }
    // Revit files can have multiple extensions
    if (ext === 'rvt' || ext === 'rfa' || ext === 'rte' || ext === 'rtc') {
      return 'revit';
    }
    return null;
  };

  const handleExportToArkio = (model?: ModelUploaderUploadedModel) => {
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

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = getFileType(file.name);

      if (!fileType) {
        alert(`Formato no soportado: ${file.name}. Use .obj, .glb, .gltf, .fbx, .ifc o archivos Revit (.rvt, .rfa, .rte, .rtc)`);
        continue;
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert(`Archivo demasiado grande: ${file.name}. Máximo 50MB`);
        continue;
      }

      const modelId = `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);

      const newModel: ModelUploaderUploadedModel = {
        id: modelId,
        name: file.name,
        file: file,
        url: url,
        type: fileType,
        size: formatFileSize(file.size),
        status: 'uploading'
      };

      console.log('ModelUploader - Creando modelo:', {
        id: modelId,
        name: file.name,
        type: fileType,
        size: file.size,
        url: url.substring(0, 50) + '...'
      });

      // Proceso real de carga del archivo
      setUploadProgress(prev => ({ ...prev, [modelId]: 0 }));

      try {
        // Simular progreso de carga mientras se procesa el archivo real
        for (let progress = 0; progress <= 90; progress += 15) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => ({ ...prev, [modelId]: progress }));
        }

        // Verificar que el archivo y la URL son válidos
        if (file.size > 0 && url && url.startsWith('blob:')) {
          console.log('ModelUploader - Archivo válido, marcando como ready');
          setUploadProgress(prev => ({ ...prev, [modelId]: 100 }));
          newModel.status = 'ready';

          // Mantener referencia al archivo para evitar que se libere
          console.log('ModelUploader - Llamando onModelUpload');
          onModelUpload(newModel);
        } else {
          console.error('ModelUploader - Archivo inválido:', { size: file.size, url });
          newModel.status = 'error';
          onModelUpload(newModel);
        }
      } catch (error) {
        console.error('ModelUploader - Error al procesar archivo:', error);
        newModel.status = 'error';
        onModelUpload(newModel);
      }

      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelId];
        return newProgress;
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="space-y-2 p-3">
      {/* Header */}
      <div className="text-center">
        <Upload className="w-8 h-8 text-purple-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900 text-lg">Subir Modelos 3D</h3>
        <p className="text-sm text-gray-600">
          Sube tus propios modelos 3D que reemplazarán la casa
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50/30'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".obj,.glb,.gltf,.fbx,.ifc,.rvt,.rfa,.rte,.rtc"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-2">
          <Upload className={`w-12 h-12 mx-auto ${isDragging ? 'text-purple-600' : 'text-gray-400'
            }`} />

          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz click'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos: .glb, .gltf (AR) • .fbx, .obj • .rvt, .rfa (Revit) • .ifc
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tamaño máximo: 50MB por archivo
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-purple-600 hover:bg-purple-700 text-white"
          >
            Seleccionar archivos
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([id, progress]) => (
        <div key={id} className="bg-white border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
              <span className="text-sm font-medium text-gray-900">Subiendo...</span>
            </div>
            <span className="text-sm text-purple-600 font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      ))}

      {/* Uploaded Models List */}
      {uploadedModels.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 text-sm flex items-center">
            <Box className="w-4 h-4 mr-2 text-purple-600" />
            Modelos Subidos ({uploadedModels.length})
          </h4>

          <div className="space-y-1.5">
            {uploadedModels.map((model) => (
              <div
                key={model.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-all ${model.status === 'ready'
                  ? 'border-green-200 bg-green-50'
                  : model.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-purple-200 bg-purple-50'
                  }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${model.status === 'ready'
                    ? 'bg-green-100'
                    : model.status === 'error'
                      ? 'bg-red-100'
                      : 'bg-purple-100'
                    }`}>
                    {model.status === 'ready' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : model.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {model.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="uppercase font-semibold">{model.type}</span>
                      <span>•</span>
                      <span>{model.size}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {(model.type !== 'glb' && model.type !== 'gltf') && (
                    <button
                      onClick={() => handleExportToArkio(model)}
                      className="flex-shrink-0 p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                      title="Usar en Arkio (soporta todos los formatos)"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveModel(model.id)}
                    className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Eliminar modelo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {uploadedModels.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
          <h4 className="font-semibold text-gray-900 mb-2 text-xs flex items-center">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1 animate-pulse"></div>
            Estadísticas
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-gray-600">Total</p>
              <p className="font-semibold text-purple-600 text-sm">{uploadedModels.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Listos</p>
              <p className="font-semibold text-green-600 text-sm">
                {uploadedModels.filter(m => m.status === 'ready').length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Tamaño</p>
              <p className="font-semibold text-blue-600 text-xs">
                {formatFileSize(uploadedModels.reduce((acc, m) => acc + m.file.size, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
