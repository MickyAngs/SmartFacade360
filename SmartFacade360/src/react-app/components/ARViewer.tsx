import { useEffect, useState } from 'react';
import { X, Smartphone, Eye, AlertTriangle, ExternalLink, Zap, Download } from 'lucide-react';

interface ARViewerProps {
  isOpen: boolean;
  onClose: () => void;
  modelUrl: string | null;
  modelType?: 'obj' | 'glb' | 'gltf' | 'fbx' | 'ifc' | 'revit';
  modelName?: string;
}

// Model viewer will be rendered via dangerouslySetInnerHTML

export default function ARViewer({ isOpen, onClose, modelUrl, modelType, modelName }: ARViewerProps) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportToArkio = () => {
    if (!modelUrl || !modelName) return;

    // Create a download link for the model file
    const link = document.createElement('a');
    link.href = modelUrl;
    link.download = modelName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Open Arkio.is in new tab with instructions
    setTimeout(() => {
      window.open('https://arkio.is/download/', '_blank');
    }, 100);
  };

  useEffect(() => {
    if (!isOpen) return;

    // Load model-viewer script immediately when opening
    const loadModelViewer = async () => {
      if (!document.querySelector('script[src*="model-viewer"]')) {
        console.log('ARViewer - Loading model-viewer script...');

        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://unpkg.com/@google/model-viewer@3.3.0/dist/model-viewer.min.js';

        script.onload = () => {
          console.log('ARViewer - Model-viewer loaded successfully');
          setModelViewerLoaded(true);
        };

        script.onerror = (error) => {
          console.error('ARViewer - Error loading model-viewer:', error);
          setError('Error cargando visor 3D');
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } else {
        console.log('ARViewer - Model-viewer already loaded');
        setModelViewerLoaded(true);
      }
    };

    loadModelViewer();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !modelViewerLoaded) return;

    const checkARSupport = async () => {
      console.log('ARViewer - Checking AR support...');
      setIsLoading(true);

      try {
        // Simplified AR detection for mobile devices
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isIOSSafari = /Safari/i.test(navigator.userAgent) && /iPhone|iPad|iPod/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
        const isAndroidChrome = /Chrome/i.test(navigator.userAgent) && /Android/i.test(navigator.userAgent);

        console.log('ARViewer - Device check:', {
          isMobile,
          isIOSSafari,
          isAndroidChrome,
          userAgent: navigator.userAgent
        });

        // Check for WebXR support
        let hasWebXR = false;
        try {
          if ('xr' in navigator && 'isSessionSupported' in (navigator as any).xr) {
            hasWebXR = await (navigator as any).xr.isSessionSupported('immersive-ar');
            console.log('ARViewer - WebXR AR support:', hasWebXR);
          }
        } catch (webxrError) {
          console.log('ARViewer - WebXR not available:', webxrError);
        }

        const arSupported = hasWebXR || (isMobile && (isIOSSafari || isAndroidChrome));

        console.log('ARViewer - AR support result:', arSupported);
        setIsARSupported(arSupported);

        if (!arSupported) {
          console.log('ARViewer - AR not supported, showing fallback');
        }

      } catch (error) {
        console.error('ARViewer - Error checking AR support:', error);
        setIsARSupported(false);
        setError('Error verificando soporte AR');
      }

      setIsLoading(false);
    };

    // Small delay to ensure model-viewer is fully loaded
    setTimeout(checkARSupport, 500);
  }, [isOpen, modelViewerLoaded]);

  if (!isOpen) return null;

  const isARCompatible = modelType === 'glb' || modelType === 'gltf';
  const canUseAR = isARSupported && isARCompatible && modelUrl;

  console.log('ARViewer - Render state:', {
    modelUrl: modelUrl ? modelUrl.substring(0, 50) + '...' : null,
    modelType,
    isARSupported,
    isARCompatible,
    canUseAR,
    isLoading,
    error
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6" />
              <div>
                <h2 className="font-bold text-lg">Vista AR</h2>
                <p className="text-purple-100 text-sm">{modelName || 'Modelo 3D'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                }}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : isLoading || !modelViewerLoaded ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {!modelViewerLoaded ? 'Cargando visor 3D...' : 'Verificando compatibilidad AR...'}
              </p>
            </div>
          ) : !modelUrl ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No hay modelo disponible</h3>
              <p className="text-gray-600 text-sm">
                Sube un archivo 3D (.glb o .gltf) para usar AR
              </p>
            </div>
          ) : !isARCompatible ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Formato no compatible con AR</h3>
              <p className="text-gray-600 text-sm mb-4">
                Archivo actual: <span className="font-semibold uppercase">{modelType}</span>
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <h4 className="font-semibold text-yellow-900 text-sm mb-2">
                  {modelType === 'revit' && '🏗️ Archivos Revit'}
                  {modelType === 'obj' && '📦 Archivos OBJ'}
                  {modelType === 'fbx' && '🎬 Archivos FBX'}
                  {modelType === 'ifc' && '🏢 Archivos IFC'}
                </h4>
                <p className="text-xs text-yellow-800 mb-2">
                  Los archivos <strong>.{
                    modelType === 'revit' ? 'rvt, .rfa, .rte, .rtc' :
                      modelType === 'fbx' ? 'fbx (Autodesk/Maya)' :
                        modelType
                  }</strong> se pueden visualizar perfectamente en 3D en el diseñador principal, pero <strong>no son compatibles con Realidad Aumentada</strong> en navegadores móviles.
                </p>
                <p className="text-xs text-yellow-700">
                  Esta es una limitación técnica de iOS Safari y Android Chrome, que solo soportan formatos WebXR nativos.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-semibold text-green-900 text-sm mb-2">✅ Para usar AR necesitas:</h4>
                <ul className="text-xs text-green-800 space-y-1 text-left">
                  <li>• Archivos <strong>.glb</strong> o <strong>.gltf</strong> (formatos WebXR)</li>
                  <li>• Dispositivo móvil (iPhone con Safari o Android con Chrome)</li>
                  <li>• Permisos de cámara habilitados</li>
                </ul>
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-xs text-green-700 font-semibold mb-1">💡 Conversión de formatos:</p>
                  <ul className="text-xs text-green-700 space-y-0.5">
                    <li>• <strong>FBX/OBJ → GLB:</strong> Blender (gratuito), Maya, 3ds Max</li>
                    <li>• <strong>Revit → GLB:</strong> Exportar como FBX, luego convertir</li>
                    <li>• <strong>Online:</strong> gltf.report, fbx2gltf.com</li>
                  </ul>
                </div>
              </div>

              {/* Optional Arkio Export - Collapsed by default */}
              <details className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <summary className="cursor-pointer text-xs text-purple-900 font-medium flex items-center space-x-2">
                  <Zap className="w-3 h-3" />
                  <span>Alternativa profesional: Arkio VR (opcional)</span>
                </summary>
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-purple-800">
                    Plataforma profesional con soporte para todos los formatos
                  </p>
                  <button
                    onClick={handleExportToArkio}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Exportar a Arkio</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </details>
            </div>
          ) : !canUseAR ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">AR no disponible</h3>
                <p className="text-sm text-gray-600">
                  Tu dispositivo no es compatible con AR
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">Dispositivos compatibles:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• iPhone (iOS 12+) con Safari</li>
                  <li>• Android (8+) con Chrome</li>
                  <li>• Dispositivos con WebXR</li>
                </ul>
              </div>

              {/* Fallback 3D Viewer */}
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Vista 3D disponible en el diseñador</p>
                  </div>
                </div>
              </div>

              {/* PC/Desktop Info - Clear messaging */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-semibold text-red-900 text-sm mb-2">⚠️ AR NO funciona en PC</h4>
                <p className="text-xs text-red-800 mb-2">
                  <strong>Realidad Aumentada requiere móvil con cámara</strong> (iPhone/Android)
                </p>
                <p className="text-xs text-red-700">
                  En PC solo puedes usar visualización 3D normal en el diseñador principal.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">💻 ¿Qué funciona en PC?</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>✅ <strong>Visualización 3D completa</strong> en el diseñador</li>
                  <li>✅ Rotación y zoom con mouse</li>
                  <li>✅ Todos los formatos de archivo</li>
                  <li>❌ AR requiere móvil con cámara</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Enhanced AR Model Viewer */}
              <div className="bg-gray-100 rounded-lg overflow-hidden relative">
                <div
                  dangerouslySetInnerHTML={{
                    __html: `
                      <model-viewer
                        src="${modelUrl}"
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        touch-action="pan-y"
                        auto-rotate
                        shadow-intensity="1"
                        environment-image="neutral"
                        tone-mapping="commerce"
                        exposure="1.2"
                        shadow-softness="1"
                        min-camera-orbit="auto auto auto"
                        max-camera-orbit="auto auto auto"
                        interpolation-decay="200"
                        style="width: 100%; height: 280px; background-color: #f3f4f6; border-radius: 0.5rem;"
                        loading="eager"
                      >
                        <div slot="progress-bar" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; border-radius: 0.5rem;">
                          <div style="animation: spin 1s linear infinite; border-radius: 50%; height: 32px; width: 32px; border: 3px solid #e5e7eb; border-top-color: #9333ea;"></div>
                        </div>
                        <div slot="ar-button" style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); background-color: rgba(147, 51, 234, 0.9); color: white; padding: 12px 24px; border-radius: 24px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                          <span>👆</span>
                          <span>Ver en AR</span>
                        </div>
                      </model-viewer>
                    `
                  }}
                />

                {/* AR Status Indicator */}
                <div className="absolute top-3 right-3">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-green-700">AR Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Instructions */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Instrucciones AR
                </h4>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <p className="text-purple-800">Toca el botón "Ver en AR" en el modelo</p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <p className="text-purple-800">Permite el acceso a la cámara cuando se solicite</p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <p className="text-purple-800">Apunta a una superficie plana y bien iluminada</p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    <p className="text-purple-800">Espera a que aparezca el modelo en tu espacio</p>
                  </div>
                </div>
              </div>

              {/* Device Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-semibold text-green-900 text-sm mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Dispositivo
                  </h4>
                  <p className="text-xs text-green-800">Compatible con AR</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-semibold text-green-900 text-sm mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Formato
                  </h4>
                  <p className="text-xs text-green-800 uppercase font-medium">{modelType}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {modelType && (
                <span className="bg-gray-200 px-2 py-1 rounded uppercase font-medium">
                  {modelType}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {!canUseAR && modelUrl && (
                <button
                  onClick={handleExportToArkio}
                  className="px-3 py-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Usar Arkio</span>
                </button>
              )}
              {canUseAR && (
                <a
                  href="https://developers.google.com/ar/develop/web/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ayuda AR</span>
                </a>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
