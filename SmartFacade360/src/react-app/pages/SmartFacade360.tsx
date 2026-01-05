import { useState } from 'react';
import { Sparkles, Eye, Loader2, Box, Palette, Home, Settings, Save, ShoppingCart, Maximize2, Minimize2, Camera } from 'lucide-react';
import { Link } from 'react-router';
import Toast from '@/react-app/components/Toast';
import FacadeViewer3D from '@/react-app/components/FacadeViewer3D';
import ObjectCatalog from '@/react-app/components/ObjectCatalog';
import NavigationMenu from '@/react-app/components/NavigationMenu';
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
  const [material, setMaterial] = useState<Material>('Ladrillo Visto');
  const [accentColor, setAccentColor] = useState<AccentColor>(accentColors[0]);
  const [roofType, setRoofType] = useState<RoofType>('A Dos Aguas');
  const [windowStyle, setWindowStyle] = useState<WindowStyle>('Estándar');
  const [exteriorFeature, setExteriorFeature] = useState<ExteriorFeature>('Ninguna');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'materials' | 'features' | 'tools' | 'objects'>('design');
  const [show3DView, setShow3DView] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  
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

  const handleGenerate3D = async () => {
    setIsGenerating(true);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsGenerating(false);
    setIsLoading(false);
    setShow3DView(true);
    setActiveTab('tools');
  };

  // Removed handleARView - now using Link navigation

  const handleSaveChanges = () => {
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

  

  const renderDesignTab = () => (
    <div className="space-y-4 p-4">
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
              className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                architecturalStyle === style
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
  );

  const renderMaterialsTab = () => (
    <div className="space-y-4 p-4">
      {/* Material */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Material Principal</label>
        <div className="grid grid-cols-2 gap-2">
          {['Ladrillo Visto', 'Hormigón Texturizado', 'Madera Compuesta', 'Vidrio', 'Piedra Natural', 'Metal Corten', 'Fibrocemento', 'Concreto Aparente'].map((mat) => (
            <button
              key={mat}
              onClick={() => setMaterial(mat as Material)}
              className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                material === mat
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {mat.split(' ')[0]}
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
        <div className="grid grid-cols-3 gap-2">
          {accentColors.map((color) => (
            <button
              key={color.hex}
              onClick={() => setAccentColor(color)}
              className={`relative h-12 rounded-lg border-2 transition-all flex items-center justify-center ${
                accentColor.hex === color.hex 
                  ? 'border-blue-500' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {color.hex === '#FFFFFF' && (
                <div className="absolute inset-1 rounded border border-gray-200"></div>
              )}
              <span className={`text-sm font-medium ${
                color.hex === '#FFFFFF' ? 'text-gray-800' : 'text-white'
              }`}>
                {color.name.split(' ')[0].slice(0, 3)}
              </span>
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">Seleccionado: {accentColor.name}</p>
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="space-y-4 p-4">
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
              className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                exteriorFeature === feature
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Property Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Configuración Actual</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Techo:</strong> {roofType}</p>
          <p><strong>Ventanas:</strong> {windowStyle}</p>
          <p><strong>Características:</strong> {exteriorFeature}</p>
        </div>
      </div>
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
            className={`w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm ${
              !show3DView ? 'opacity-50 cursor-not-allowed' : ''
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
            className={`w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm ${
              !show3DView ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Vista 2D</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderObjectsTab = () => (
    <ObjectCatalog 
      onAddObject={handleAddObject}
      addedObjects={sceneObjects}
      onRemoveObject={handleRemoveObject}
      show3DView={show3DView}
      hasUploadedModels={false}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
      <NavigationMenu />
      
      <Toast 
        message={showToast && activeTab === 'tools' 
          ? "¡Cambios guardados exitosamente!" 
          : showToast && sceneObjects.length > 0
            ? `¡Objeto agregado! Tienes ${sceneObjects.length} objetos en la escena`
            : "¡Cambios aplicados exitosamente!"
        }
        isVisible={showToast}
        onClose={() => setShowToast(false)}
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
        <div className="bg-white rounded-2xl w-full h-full overflow-hidden relative">
          

          {/* App Content */}
          <div className="flex-1 bg-gradient-to-br from-slate-100 to-blue-50 h-full overflow-y-auto">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-4 py-3">
                <div className="flex items-center justify-center space-x-3">
                  <div className="relative">
                    <Box className="w-7 h-7 text-blue-600" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    SmartFacade360
                  </h1>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Diseño de fachadas con IA
                </p>
              </div>
            </header>

            {/* Platform Info Banner */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 text-center">
                <p className="text-xs font-medium">
                  💻 <strong>Funciona en PC y Móvil</strong> • Vista 3D completa disponible en ambas plataformas
                </p>
              </div>

              {/* Main Content Container */}
            <div className="px-3 pb-20">
              {/* 3D Visualizer */}
              <div className="relative bg-white m-3 rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {show3DView ? (
                  <div 
                    className="w-full bg-gradient-to-b from-sky-200 to-green-100 transition-all duration-300" 
                    style={{ height: isExpanded ? '400px' : '220px' }}
                  >
                    <FacadeViewer3D 
                      architecturalStyle={architecturalStyle}
                      material={material}
                      accentColor={accentColor.hex}
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
                      uploadedModels={[]}
                    />
                  </div>
                ) : (
                  <img 
                    src={generateFacadeImage()}
                    alt="Vista previa de fachada 3D"
                    className="w-full object-cover transition-all duration-300"
                    style={{ height: isExpanded ? '400px' : '220px' }}
                  />
                )}
        
                {/* Overlay Labels */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium">
                  <Home className="w-4 h-4 inline mr-2" />
                  {propertyModel.split(' ')[0]}
                </div>
        
                {!show3DView && (
                  <>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                      {architecturalStyle.split(' ')[0]}
                    </div>

                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                      {material.split(' ')[0]}
                    </div>
                  </>
                )}

                {show3DView && (
                  <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>3D</span>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="absolute bottom-14 right-3 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center space-x-2"
                  title={isExpanded ? 'Vista normal' : 'Vista expandida'}
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Normal</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Expandir</span>
                    </>
                  )}
                </button>
        
                {/* AR Studio Access Button */}
                <Link
                  to="/ar-studio"
                  className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>AR Studio</span>
                </Link>

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Generando 3D...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="mx-3 mb-3">
                <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { id: 'design', label: 'Diseño', icon: Sparkles },
                      { id: 'materials', label: 'Material', icon: Palette },
                      { id: 'features', label: 'Detalles', icon: Home },
                      { id: 'objects', label: 'Objetos', icon: ShoppingCart },
                      { id: 'tools', label: 'Tools', icon: Settings }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm font-medium transition-all ${
                          activeTab === id
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
              <div className={`bg-white mx-3 mb-3 rounded-xl shadow-lg border border-gray-200 overflow-hidden overflow-y-auto transition-all duration-300 ${
                isExpanded ? 'max-h-60' : 'max-h-80'
              }`}>
                {activeTab === 'design' && renderDesignTab()}
                {activeTab === 'materials' && renderMaterialsTab()}
                {activeTab === 'features' && renderFeaturesTab()}
                {activeTab === 'objects' && renderObjectsTab()}
                {activeTab === 'tools' && renderToolsTab()}
              </div>

              {/* Fixed Generate Button */}
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 rounded-xl">
                <button
                  onClick={handleGenerate3D}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-3 transition-all text-base"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Box className="w-6 h-6" />
                      <span>Generar 3D</span>
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
