import { useState, useEffect } from 'react';
import { Sparkles, Eye, Loader2, Box, Palette, Home, Settings, Save, ShoppingCart, Upload, BrainCircuit } from 'lucide-react';
import { hunyuanService } from '@/services/HunyuanService';
import Toast from '@/react-app/components/Toast';
import FacadeViewer3D from '@/react-app/components/FacadeViewer3D';
import ObjectCatalog from '@/react-app/components/ObjectCatalog';
import NavigationMenu from '@/react-app/components/NavigationMenu';
import MaterialPanel from '@/react-app/components/MaterialPanel';
import ARButton from '@/react-app/components/ARButton';
import { Material as DbMaterial } from '@/services/MaterialService'; // Rename to avoid conflict with shared/types Material
import type { ArchitecturalStyle, Material, AccentColor, PropertyModel, RoofType, WindowStyle, ExteriorFeature, SceneObject } from '@/shared/types';

const accentColors: AccentColor[] = [
  { name: 'Blanco Nieve', hex: '#FFFFFF' },
  { name: 'Gris Antracita', hex: '#374151' },
  { name: 'Verde Esmeralda', hex: '#10B981' },
  { name: 'Terracota', hex: '#DC2626' },
  { name: 'Azul Océano', hex: '#2563EB' },
  { name: 'Dorado', hex: '#F59E0B' }
];

export default function SmartFacade360() {
  const [propertyModel, setPropertyModel] = useState<PropertyModel>('Casa Unifamiliar');
  const [architecturalStyle, setArchitecturalStyle] = useState<ArchitecturalStyle>('Minimalista');
  const [material, setMaterial] = useState<Material>('Madera Acetilada (Accoya Facades)');
  const [accentColor, setAccentColor] = useState<AccentColor>(accentColors[0]);
  const [roofType, setRoofType] = useState<RoofType>('A Dos Aguas');
  const [windowStyle, setWindowStyle] = useState<WindowStyle>('Estándar');
  const [exteriorFeature, setExteriorFeature] = useState<ExteriorFeature>('Ninguna');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerationStatus, setAiGenerationStatus] = useState<'idle' | 'generating' | 'polling' | 'complete' | 'error'>('idle');
  const [aiError, setAiError] = useState('');
  const [uploadedModels, setUploadedModels] = useState<Array<{
    id: string;
    name: string;
    url: string;
    type: 'obj' | 'glb' | 'gltf' | 'fbx' | 'ifc' | 'revit';
    status: 'uploading' | 'ready' | 'error';
    position: [number, number, number];
  }>>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'editor' | 'tools' | 'upload'>('editor');
  const [show3DView, setShow3DView] = useState(true);

  // New State for AR and Impact Dashboard
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [dbMaterial, setDbMaterial] = useState<DbMaterial | null>(null);

  const selectedUploadedModel = uploadedModels.find(m => m.id === selectedModelId);
  const selectedModelUrl = selectedUploadedModel?.url; // For ARButton


  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);

  const generateFacadeImage = () => {
    const colorMap: Record<string, string> = {
      'Minimalista': '#F8FAFC',
      'Industrial': '#64748B',
      'Clásico Mediterráneo': '#FEF3C7',
      'Biofílico': '#ECFDF5',
      'Contemporáneo': '#F1F5F9',
      'Colonial': '#FEF7CD',
      'Victoriano': '#FAF5FF',
      'Moderno Escandinavo': '#F0F9FF'
    };

    const materialMap: Record<string, string> = {
      'Ladrillo Visto': '#DC2626',
      'Hormigón Texturizado': '#9CA3AF',
      'Madera Compuesta': '#92400E',
      'Vidrio': '#3B82F6',
      'Piedra Natural': '#78716C',
      'Metal Corten': '#B45309',
      'Fibrocemento': '#E5E7EB',
      'Concreto Aparente': '#9CA3AF'
    };

    const bgColor = colorMap[architecturalStyle] || '#F8FAFC';
    const matColor = materialMap[material] || '#6B7280';

    return `https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&crop=building&bg=${bgColor.replace('#', '')}&overlay=${matColor.replace('#', '')}&overlay-mode=multiply&overlay-alpha=30`;
  };

  // Removed handleARView - now using Link navigation

  const handleSaveChanges = () => {
    setToastMessage("¡Cambios guardados exitosamente!");
    setToastType('success');
    setShowToast(true);
  };

  const handleAddObject = (object: Omit<SceneObject, 'id'>) => {
    console.log('handleAddObject llamado con:', object);

    if (!show3DView) {
      alert('Primero genera la vista 3D para agregar objetos');
      return;
    }

    const newObject: SceneObject = {
      id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: object.name,
      category: object.category,
      position: [...object.position] as [number, number, number],
      rotation: object.rotation ? [...object.rotation] as [number, number, number] : [0, Math.random() * Math.PI * 2, 0],
      scale: object.scale ? [...object.scale] as [number, number, number] : [1, 1, 1]
    };

    console.log('Objeto agregado:', newObject);
    console.log('Objetos antes:', sceneObjects);

    setSceneObjects(prev => {
      const updated = [...prev, newObject];
      console.log('Objetos después:', updated);
      return updated;
    });

    setShowToast(true);
  };

  const handleRemoveObject = (id: string) => {
    console.log('Removiendo objeto con ID:', id);
    setSceneObjects(prev => {
      const filtered = prev.filter(obj => obj.id !== id);
      console.log('Objetos después de remover:', filtered);
      return filtered;
    });
  };

  // Auto-generate prompt when settings change
  useEffect(() => {
    const prompt = `Una ${propertyModel} de estilo ${architecturalStyle}, construida con ${material}. ` +
      `Tiene un techo tipo ${roofType} y ventanas estilo ${windowStyle}. ` +
      `Detalles adicionales: ${exteriorFeature}. ` +
      `Color predominante o de acento: ${accentColor.name}.`;
    setAiPrompt(prompt);

    // Save state to localStorage for TC008 (Session Persistence)
    const sessionState = {
      propertyModel,
      architecturalStyle,
      material,
      roofType,
      windowStyle,
      exteriorFeature
    };
    localStorage.setItem('smartFacadeSession', JSON.stringify(sessionState));

  }, [propertyModel, architecturalStyle, material, roofType, windowStyle, exteriorFeature, accentColor]);

  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem('smartFacadeSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.propertyModel) setPropertyModel(parsed.propertyModel);
        if (parsed.architecturalStyle) setArchitecturalStyle(parsed.architecturalStyle);
        if (parsed.material) setMaterial(parsed.material);
        if (parsed.roofType) setRoofType(parsed.roofType);
        if (parsed.windowStyle) setWindowStyle(parsed.windowStyle);
        if (parsed.exteriorFeature) setExteriorFeature(parsed.exteriorFeature);
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, []);

  const handleHunyuanGeneration = async () => {
    if (!aiPrompt.trim()) return;

    setAiGenerationStatus('generating');
    setAiError('');
    // setShowToast(true); // Removed: Do not show success toast on start

    try {
      // 1. Submit Job
      const jobId = await hunyuanService.generate3DFromText(aiPrompt);
      if (!jobId) throw new Error("No se recibió JobId");

      setAiGenerationStatus('polling');

      // 2. Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const { status, url } = await hunyuanService.queryJobStatus(jobId);

          if (status === 'SUCCESS' && url) {
            clearInterval(pollInterval);

            // Add to uploaded models list so it renders in the viewer
            const fileExtension = url.split('.').pop()?.toLowerCase();
            const modelType = (fileExtension === 'glb' || fileExtension === 'gltf') ? 'glb' : 'obj';

            const newModel = {
              id: `ai-${Date.now()}`,
              name: `IA: ${aiPrompt.slice(0, 15)}...`,
              url: url,
              type: modelType as 'obj' | 'glb',
              status: 'ready' as const,
              position: [0, 0, 0] as [number, number, number]
            };

            setUploadedModels(prev => [...prev, newModel]);
            setAiGenerationStatus('complete');
            setActiveTab('upload'); // Switch to view it

          } else if (status === 'FAILED') {
            clearInterval(pollInterval);
            throw new Error("La generación falló en el servidor.");
          }
          // If RUNNING/WAITING, continue polling
        } catch (err) {
          clearInterval(pollInterval);
          setAiGenerationStatus('error');
          setAiError('Error consultando estado');
        }
      }, 3000); // Check every 3 seconds

    } catch (err: any) {
      console.error(err);
      setAiGenerationStatus('error');
      setAiError(err.message || 'Error desconocido');
    }
  };


  const renderUnifiedEditor = () => (
    <div className="h-full overflow-y-auto pb-20 custom-scrollbar">

      {/* Design & Structure */}
      <section>
        <div className="flex items-center space-x-2 px-4 mb-3">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-gray-900">Diseño y Estructura</h3>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm mx-2">
          {/* Property Model */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Home className="w-4 h-4" />
              <span>Modelo de Propiedad</span>
            </label>
            <select
              value={propertyModel}
              onChange={(e) => setPropertyModel(e.target.value as PropertyModel)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
            >
              <option value="Casa Unifamiliar">Casa Unifamiliar</option>
              <option value="Apartamento Moderno">Apartamento Moderno</option>
              <option value="Villa Mediterránea">Villa Mediterránea</option>
              <option value="Loft Industrial">Loft Industrial</option>
              <option value="Estudio Compacto">Estudio Compacto</option>
              <option value="Mansión">Mansión</option>
              <option value="Casa de Campo">Casa de Campo</option>
              <option value="Duplex Moderno">Duplex Moderno</option>
            </select>
          </div>

          {/* Architectural Style */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Estilo</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm font-semibold">IA</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Minimalista', 'Industrial', 'Clásico Mediterráneo', 'Biofílico', 'Contemporáneo', 'Colonial', 'Victoriano', 'Moderno Escandinavo'].map((style) => (
                <button
                  key={style}
                  onClick={() => setArchitecturalStyle(style as ArchitecturalStyle)}
                  className={`p-3 text-sm font-medium rounded-lg border transition-all ${architecturalStyle === style
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {style.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Roof Type */}
            <div className="mt-3">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Techo</label>
              <select
                value={roofType}
                onChange={(e) => setRoofType(e.target.value as RoofType)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
              >
                <option value="A Dos Aguas">A Dos Aguas</option>
                <option value="Plano">Plano</option>
                <option value="Mansarda">Mansarda</option>
                <option value="A Cuatro Aguas">A Cuatro Aguas</option>
                <option value="Shed">Shed</option>
                <option value="Butterfly">Butterfly</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Section */}
      <section>
        <div className="flex items-center space-x-2 px-4 mb-3">
          <Palette className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-gray-900">Materiales y Acabados</h3>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm mx-2">
          {/* Material */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Material Principal</label>
            <div className="grid grid-cols-1 gap-2">
              {['Madera Acetilada (Accoya Facades)', 'Vidrio Fotovoltaico Transparente (BIPV - Onyx Solar)', 'Paneles de Fachada de Ultra Alto Rendimiento (UHPC - Ductal)'].map((mat) => (
                <button
                  key={mat}
                  onClick={() => setMaterial(mat as Material)}
                  className={`p-3 text-sm font-medium rounded-lg border transition-all ${material === mat
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4" />
              <span>Color de Acento</span>
            </label>

            <div className="mb-3">
              <label className="relative flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Seleccionar Color Personalizado</span>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                    style={{ backgroundColor: accentColor.hex }}
                  />
                  <input
                    type="color"
                    value={accentColor.hex}
                    onChange={(e) => setAccentColor({ name: 'Personalizado', hex: e.target.value })}
                    className="w-8 h-8 opacity-0 absolute cursor-pointer"
                  />
                  <Palette className="w-5 h-5 text-gray-400" />
                </div>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="flex items-center space-x-2 px-4 mb-3">
          <Settings className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-gray-900">Detalles Arquitectónicos</h3>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm mx-2">
          {/* Window Style */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Estilo de Ventanas</label>
            <select
              value={windowStyle}
              onChange={(e) => setWindowStyle(e.target.value as WindowStyle)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
            >
              <option value="Estándar">Estándar</option>
              <option value="Ventanal Completo">Ventanal Completo</option>
              <option value="Arco">Arco</option>
              <option value="Bay Window">Bay Window</option>
              <option value="Francesas">Francesas</option>
              <option value="Modernas Minimalistas">Modernas Minimalistas</option>
            </select>
          </div>

          {/* Exterior Features */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Características Exteriores</label>
            <div className="grid grid-cols-2 gap-2">
              {['Ninguna', 'Balcón', 'Terraza', 'Porche', 'Jardín Frontal', 'Piscina', 'Garaje Integrado'].map((feature) => (
                <button
                  key={feature}
                  onClick={() => setExteriorFeature(feature as ExteriorFeature)}
                  className={`p-3 text-sm font-medium rounded-lg border transition-all ${exteriorFeature === feature
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Objects Section */}
      <section>
        <div className="flex items-center space-x-2 px-4 mb-3">
          <ShoppingCart className="w-5 h-5 text-green-500" />
          <h3 className="font-bold text-gray-900">Catálogo de Objetos</h3>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-1 shadow-sm mx-2">
          <ObjectCatalog
            onAddObject={handleAddObject}
            addedObjects={sceneObjects}
            onRemoveObject={handleRemoveObject}
            show3DView={show3DView}
            hasUploadedModels={false}
          />
        </div>
      </section>

      {/* AI Generation Section - Moved to bottom */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 mx-4 mb-4 rounded-xl">
        <div className="flex items-center space-x-2 mb-3">
          <BrainCircuit className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-800">Generar Modelo Final (Hunyuan IA)</h3>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Se generará un modelo 3D único basado en la configuración seleccionada arriba.
        </p>
        <div className="space-y-3">
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full p-3 rounded-lg border border-purple-200 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20 bg-white/50"
            readOnly={false}
          />
          {aiError && <p className="text-xs text-red-500">{aiError}</p>}
          <button
            onClick={handleHunyuanGeneration}
            disabled={!aiPrompt || aiGenerationStatus === 'generating' || aiGenerationStatus === 'polling'}
            className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md ${!aiPrompt || aiGenerationStatus === 'generating' || aiGenerationStatus === 'polling'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transform hover:-translate-y-0.5'
              }`}
          >
            {aiGenerationStatus === 'generating' || aiGenerationStatus === 'polling' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{aiGenerationStatus === 'generating' ? 'Enviando a la nube...' : 'Renderizando IA...'}</span>
              </>
            ) : (
              <>
                <Box className="w-5 h-5" />
                <span>Generar 3D</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension !== 'obj') {
      setToastMessage('Error: Por ahora solo soportamos archivos .obj');
      setToastType('error');
      setShowToast(true);
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    const newModel = {
      id: `model-${Date.now()}`,
      name: file.name,
      url: objectUrl,
      type: 'obj' as const,
      status: 'ready' as const,
      position: [0, 0, 0] as [number, number, number]
    };

    setUploadedModels(prev => [...prev, newModel]);
    setShowToast(true);
  };

  const renderUploadTab = () => (
    <div className="space-y-4 p-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
        <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">Subir Archivos 3D</h3>
        <p className="text-sm text-gray-500 mb-4">Soporta archivos .obj</p>

        <label className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors shadow-sm">
          <span>Seleccionar Archivo</span>
          <input
            type="file"
            className="hidden"
            accept=".obj"
            onChange={handleFileUpload}
            data-testid="file-upload-input"
          />
        </label>
      </div>

      {uploadedModels.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 px-1">Archivos Subidos</h4>
          {uploadedModels.map(model => (
            <div key={model.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Box className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{model.name}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                    Listo para usar
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadedModels(prev => prev.filter(m => m.id !== model.id));
                  URL.revokeObjectURL(model.url);
                }}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderToolsTab = () => (
    <div className="space-y-4 p-4">
      <div className="text-center space-y-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4">
          <Box className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Vista 3D Interactiva</h3>
          <p className="text-sm text-gray-600 mb-3">
            {!show3DView
              ? 'Genera primero el modelo 3D'
              : 'Usa el mouse para explorar'
            }
          </p>

          {show3DView && (
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 text-sm text-gray-600">
              <p className="font-medium mb-2">Controles:</p>
              <div className="text-left space-y-1">
                <p>• <strong>Arrastrar:</strong> Rotar</p>
                <p>• <strong>Scroll:</strong> Zoom</p>
                <p>• <strong>Click der.:</strong> Mover</p>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-center text-green-600 font-medium text-sm">
                  ✓ Vista 360° activa
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSaveChanges}
            disabled={!show3DView}
            className={`w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm ${!show3DView ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <Save className="w-4 h-4" />
            <span>Guardar</span>
          </button>

          <button
            onClick={() => {
              setShow3DView(false);
            }}
            disabled={!show3DView}
            className={`w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm ${!show3DView ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <Eye className="w-4 h-4" />
            <span>Vista 2D</span>
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">


      <Toast
        message={toastMessage || (showToast && activeTab === 'tools'
          ? "¡Cambios guardados exitosamente!"
          : showToast && sceneObjects.length > 0
            ? `¡Objeto agregado! Tienes ${sceneObjects.length} objetos en la escena`
            : "¡Cambios aplicados exitosamente!")
        }
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />



      {/* High Resolution Phone Container - 1440 x 3200 pixels */}
      <div
        className="bg-black rounded-3xl p-2 shadow-2xl border-4 border-gray-900 relative overflow-hidden"
        style={{
          width: '360px',  // 1440px / 4 for scaling
          height: '800px', // 3200px / 4 for scaling
          maxWidth: '360px',
          maxHeight: '800px',
          minWidth: '360px',
          minHeight: '800px'
        }}
      >
        {/* Screen Container */}
        <div className="bg-white rounded-2xl w-full h-full overflow-hidden relative flex flex-col">
          <NavigationMenu />


          {/* App Content */}
          <div className="flex-1 bg-gradient-to-br from-slate-100 to-blue-50 h-full overflow-y-auto">
            {/* Compact Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Box className="w-6 h-6 text-blue-600" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      SmartFacade360
                    </h1>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('smartFacadeSession');
                      setToastMessage('Sesión cerrada');
                      setToastType('success');
                      setShowToast(true);
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                    data-testid="logout-button"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </header>

            {/* Platform Info Banner */}
            {/* Removed banner text as per instruction */}

            {/* Main Content Container */}
            <div className="px-3 pb-20">
              {/* 3D Visualizer */}
              <div className="relative bg-white m-3 rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {show3DView || activeTab === 'upload' ? (
                  <div
                    className="w-full bg-gradient-to-b from-sky-200 to-green-100 transition-all duration-300 relative"
                    style={{ height: '45vh' }}
                  >
                    <FacadeViewer3D
                      architecturalStyle={architecturalStyle}
                      material={dbMaterial ? dbMaterial.name : material} // Use DB material if selected
                      accentColor={dbMaterial?.hex_color || accentColor.hex} // Use DB color if selected
                      propertyModel={propertyModel}
                      roofType={roofType}
                      windowStyle={windowStyle}
                      exteriorFeature={exteriorFeature}
                      sceneObjects={sceneObjects.map(obj => ({
                        id: obj.id,
                        name: obj.name,
                        category: obj.category,
                        position: obj.position as [number, number, number],
                        rotation: obj.rotation as [number, number, number] | undefined,
                        scale: obj.scale as [number, number, number] | undefined
                      }))}
                      uploadedModels={uploadedModels}
                      viewMode={activeTab === 'upload' ? 'preview' : 'facade'}
                      selectedModelId={selectedModelId}
                      onSelectModel={setSelectedModelId}
                    />

                    {/* AR Button for Uploaded Models */}
                    <ARButton modelUrl={selectedModelUrl} modelId={selectedModelId || undefined} />

                    {/* Material Sidebar - Always visible in 3D view */}
                    <MaterialPanel onMaterialSelect={(mat) => {
                      setDbMaterial(mat);
                    }} />
                  </div>
                ) : (
                  <img
                    src={generateFacadeImage()}
                    alt="Vista previa de fachada 3D"
                    className="w-full object-cover transition-all duration-300"
                    style={{ height: '45vh' }}
                  />
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="mx-3 mb-3">
                <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'editor', label: 'Configuración', icon: Sparkles },
                      { id: 'upload', label: 'Archivos', icon: Upload },
                      { id: 'tools', label: 'Herramientas', icon: Settings }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm font-medium transition-all ${activeTab === id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs mt-1">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controls Panel */}
              <div className="bg-white mx-3 mb-3 rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                {activeTab === 'editor' && renderUnifiedEditor()}
                {activeTab === 'upload' && renderUploadTab()}
                {activeTab === 'tools' && renderToolsTab()}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
