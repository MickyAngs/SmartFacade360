import { useState, useEffect } from 'react';
import { Sparkles, Eye, Loader2, Box, Palette, Home, Settings, Save, ShoppingCart, Upload, BrainCircuit, Smartphone, Maximize2, Minimize } from 'lucide-react';
import { hunyuanService } from '@/services/HunyuanService';
import Toast from '@/react-app/components/Toast';
import FacadeViewer3D from '@/react-app/components/FacadeViewer3D';
import ObjectCatalog from '@/react-app/components/ObjectCatalog';
import NavigationMenu from '@/react-app/components/NavigationMenu';
import MaterialPanel from '@/react-app/components/MaterialPanel';
import ARButton from '@/react-app/components/ARButton';
import ToggleRAView from '@/react-app/components/ToggleRAView';
import LibraryDrawer from '@/react-app/components/LibraryDrawer'; // New Import
import FullscreenToggle from '@/react-app/components/FullscreenToggle'; // New Import
import { BookOpen } from 'lucide-react'; // New Icon
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

  // AR Panel State
  const [isRaPanelOpen, setIsRaPanelOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false); // Library State
  const [isExpanded, setIsExpanded] = useState(true); // View Expansion State (Start in Mobile)

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
    <div className={`min-h-screen transition-all duration-500 flex justify-center items-center ${isExpanded ? 'bg-slate-200 py-4 sm:py-8' : 'bg-slate-50'}`}>
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

      {/* Main Container - Switches between Full-Width and Mobile Device Frame */}
      <div className={`flex flex-col text-gray-900 bg-slate-50 relative overflow-x-hidden transition-all duration-500 ease-in-out ${isExpanded
        ? 'w-[375px] h-[812px] max-h-[95vh] rounded-[2rem] sm:rounded-[2.5rem] border-[6px] sm:border-[8px] border-gray-900 shadow-2xl relative custom-scrollbar overflow-y-auto'
        : 'w-full min-h-screen'
        }`}>
        {/* Notch for mobile view */}
        {isExpanded && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-2.5 bg-gray-900 rounded-b-lg z-50"></div>}

        <div className={isExpanded ? 'pt-3' : ''}>
          {/* Top Navigation */}
          <NavigationMenu />

          {/* Header Compacto - Edge to Edge */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
            <div className="px-4 py-3 xl:px-8 w-full">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Box className="w-7 h-7 text-teal-600" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-800">
                    SmartFacade<span className="text-teal-600 font-black">360</span>
                  </h1>
                  <div className="hidden sm:block h-6 w-px bg-gray-200 mx-2"></div>

                  <button
                    onClick={() => setIsLibraryOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                  >
                    <BookOpen size={16} />
                    <span className="hidden sm:inline">Biblioteca de Materiales</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <FullscreenToggle />
                  <button
                    onClick={() => {
                      localStorage.removeItem('smartFacadeSession');
                      setToastMessage('Sesión cerrada');
                      setToastType('success');
                      setShowToast(true);
                    }}
                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                    data-testid="logout-button"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Workspace - Edge to Edge Grid */}
          <main className={`flex-1 w-full flex flex-col p-4 gap-6 overflow-x-hidden ${!isExpanded ? 'xl:flex-row xl:p-6 bg-slate-50' : 'overflow-y-visible bg-white'}`}>

            {/* Left/Top Area: 3D Visualization */}
            <div className={`w-full flex flex-col gap-4 ${!isExpanded ? 'xl:w-[65%] 2xl:w-[70%]' : ''}`}>

              {/* Visualizer Container */}
              <div className={`relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-none ${!isExpanded ? 'flex-1 min-h-[50vh] xl:min-h-[75vh]' : 'min-h-[300px]'}`}>
                {show3DView || activeTab === 'upload' ? (
                  <div className="w-full h-full bg-gradient-to-b from-slate-100 to-gray-50 relative">
                    <FacadeViewer3D
                      architecturalStyle={architecturalStyle}
                      material={dbMaterial ? dbMaterial.name : material}
                      accentColor={dbMaterial?.hex_color || accentColor.hex}
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
                  </div>
                ) : (
                  <img
                    src={generateFacadeImage()}
                    alt="Vista previa de fachada 3D"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Mobile Preview Toggle Button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="absolute bottom-4 right-4 bg-blue-50/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-blue-100 text-blue-600 hover:text-blue-700 hover:scale-105 transition-all z-10"
                  title={!isExpanded ? "Previsualizar todo en Móvil" : "Volver a Vista Completa"}
                >
                  {isExpanded ? <Maximize2 size={24} strokeWidth={2.5} /> : <Smartphone size={24} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Right/Bottom Area: Controls, Settings, Tabs */}
            <div className={`w-full flex flex-col gap-4 ${!isExpanded ? 'xl:w-[35%] 2xl:w-[30%]' : ''}`}>

              {/* Navigation Tabs */}
              <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'editor', label: 'Configurar', icon: Sparkles },
                    { id: 'upload', label: 'Modelos', icon: Upload },
                    { id: 'tools', label: 'Suite', icon: Settings }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`flex flex-col items-center justify-center p-3 sm:py-4 rounded-xl text-sm font-semibold transition-all ${activeTab === id
                        ? 'bg-teal-50 text-teal-700 shadow-inner'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                        }`}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === id ? 'text-teal-600' : 'text-slate-500'}`} />
                      <span className="text-xs sm:text-sm mt-2">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Controls Panel */}
              <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col ${!isExpanded ? 'min-h-[500px]' : ''}`}>
                {activeTab === 'editor' && renderUnifiedEditor()}
                {activeTab === 'upload' && renderUploadTab()}
                {activeTab === 'tools' && renderToolsTab()}
              </div>
            </div>
          </main>

          {/* Helper text when in mobile frame to exit */}
          {isExpanded && (
            <div className="absolute top-2 right-2 text-[10px] text-gray-400 opacity-50 z-50">
              Vista Móvil
            </div>
          )}
        </div> {/* End of inner frame styling (added pt-6 conditionally) */}
      </div>

      {/* Library Drawer */}
      <LibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)}>
        <MaterialPanel onMaterialSelect={(mat) => {
          setDbMaterial(mat);
        }} />
      </LibraryDrawer>
    </div>
  );
}
