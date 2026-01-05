import { useState } from 'react';
import { Search, Plus, X, Car, TreePine, Sofa, Lightbulb, Palette, Home, Flower, ShoppingCart, Camera, Table, Armchair, Laptop } from 'lucide-react';
import type { SceneObject } from '@/shared/types';

interface ObjectCatalogProps {
  onAddObject: (object: Omit<SceneObject, 'id'>) => void;
  addedObjects: SceneObject[];
  onRemoveObject: (id: string) => void;
  show3DView: boolean;
  hasUploadedModels: boolean;
}

// Catálogo completo de objetos 3D
const objectCatalog = {
  'Vehículos': [
    { name: 'Automóvil Sedán', icon: Car, color: '#DC2626' },
    { name: 'SUV Familiar', icon: Car, color: '#1F2937' },
    { name: 'Convertible', icon: Car, color: '#EF4444' },
    { name: 'Camioneta', icon: Car, color: '#374151' },
    { name: 'Auto Deportivo', icon: Car, color: '#F59E0B' },
    { name: 'Motocicleta', icon: Car, color: '#8B5CF6' },
    { name: 'Bicicleta', icon: Car, color: '#10B981' },
    { name: 'Scooter', icon: Car, color: '#3B82F6' }
  ],
  'Plantas y Árboles': [
    { name: 'Roble Americano', icon: TreePine, color: '#22C55E' },
    { name: 'Pino Noruego', icon: TreePine, color: '#16A34A' },
    { name: 'Palmera', icon: TreePine, color: '#65A30D' },
    { name: 'Cerezo en Flor', icon: Flower, color: '#F472B6' },
    { name: 'Arbusto Ornamental', icon: TreePine, color: '#84CC16' },
    { name: 'Bambú', icon: TreePine, color: '#22C55E' },
    { name: 'Cactus Grande', icon: TreePine, color: '#059669' },
    { name: 'Lavanda', icon: Flower, color: '#8B5CF6' },
    { name: 'Rosas', icon: Flower, color: '#EF4444' },
    { name: 'Hiedra Trepadora', icon: TreePine, color: '#16A34A' }
  ],
  'Muebles Exteriores': [
    { name: 'Sofá de Jardín', icon: Sofa, color: '#8B5CF6' },
    { name: 'Mesa de Patio', icon: Table, color: '#92400E' },
    { name: 'Sillas de Exterior', icon: Armchair, color: '#DC2626' },
    { name: 'Hamaca', icon: Sofa, color: '#F59E0B' },
    { name: 'Parasol', icon: Home, color: '#3B82F6' },
    { name: 'Parrilla BBQ', icon: Home, color: '#1F2937' },
    { name: 'Mecedora', icon: Armchair, color: '#92400E' },
    { name: 'Banco de Jardín', icon: Sofa, color: '#6B7280' },
    { name: 'Pérgola', icon: Home, color: '#92400E' },
    { name: 'Gazebo', icon: Home, color: '#374151' }
  ],
  'Iluminación': [
    { name: 'Farola de Jardín', icon: Lightbulb, color: '#F59E0B' },
    { name: 'Reflectores LED', icon: Lightbulb, color: '#FFFFFF' },
    { name: 'Luces Solares', icon: Lightbulb, color: '#FCD34D' },
    { name: 'Antorcha Tiki', icon: Lightbulb, color: '#DC2626' },
    { name: 'Lámparas Colgantes', icon: Lightbulb, color: '#8B5CF6' },
    { name: 'Proyector de Paisaje', icon: Lightbulb, color: '#059669' },
    { name: 'Luces de Cadena', icon: Lightbulb, color: '#FCD34D' },
    { name: 'Apliques de Pared', icon: Lightbulb, color: '#6B7280' }
  ],
  'Decoración': [
    { name: 'Fuente de Agua', icon: Home, color: '#3B82F6' },
    { name: 'Estatua Griega', icon: Palette, color: '#D1D5DB' },
    { name: 'Gnomo de Jardín', icon: Palette, color: '#EF4444' },
    { name: 'Macetas Grandes', icon: Flower, color: '#92400E' },
    { name: 'Piedras Ornamentales', icon: Home, color: '#6B7280' },
    { name: 'Esculturas Modernas', icon: Palette, color: '#8B5CF6' },
    { name: 'Jardineras Elevadas', icon: Flower, color: '#059669' },
    { name: 'Camino de Piedras', icon: Home, color: '#9CA3AF' },
    { name: 'Espejo de Agua', icon: Home, color: '#0EA5E9' },
    { name: 'Fogata Exterior', icon: Lightbulb, color: '#DC2626' }
  ],
  'Estructuras': [
    { name: 'Caseta de Herramientas', icon: Home, color: '#92400E' },
    { name: 'Invernadero', icon: Home, color: '#22C55E' },
    { name: 'Cabaña de Juegos', icon: Home, color: '#F59E0B' },
    { name: 'Cochera Abierta', icon: Home, color: '#374151' },
    { name: 'Piscina', icon: Home, color: '#0EA5E9' },
    { name: 'Jacuzzi', icon: Home, color: '#3B82F6' },
    { name: 'Deck de Madera', icon: Home, color: '#92400E' },
    { name: 'Muelle de Pesca', icon: Home, color: '#6B7280' }
  ],
  'Tecnología': [
    { name: 'Paneles Solares', icon: Laptop, color: '#1F2937' },
    { name: 'Cámaras de Seguridad', icon: Camera, color: '#374151' },
    { name: 'Sistema de Riego', icon: Home, color: '#22C55E' },
    { name: 'Antena Parabólica', icon: Laptop, color: '#9CA3AF' },
    { name: 'Estación Meteorológica', icon: Laptop, color: '#6B7280' },
    { name: 'Cargador de Autos Eléctricos', icon: Car, color: '#10B981' }
  ]
};

export default function ObjectCatalog({ onAddObject, addedObjects, onRemoveObject, show3DView, hasUploadedModels }: ObjectCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showAddedOnly, setShowAddedOnly] = useState(false);

  const categories = ['Todos', ...Object.keys(objectCatalog)];

  const getFilteredObjects = () => {
    if (showAddedOnly) {
      return addedObjects.map(obj => ({
        name: obj.name,
        category: obj.category,
        icon: Car, // Default icon
        color: '#6B7280',
        added: true,
        id: obj.id
      }));
    }

    let allObjects: any[] = [];
    
    Object.entries(objectCatalog).forEach(([category, objects]) => {
      if (selectedCategory === 'Todos' || selectedCategory === category) {
        objects.forEach(obj => {
          allObjects.push({
            ...obj,
            category,
            added: addedObjects.some(added => added.name === obj.name)
          });
        });
      }
    });

    if (searchTerm) {
      allObjects = allObjects.filter(obj =>
        obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allObjects;
  };

  const handleAddObject = (objData: any) => {
    console.log('ObjectCatalog - handleAddObject llamado con:', objData);
    console.log('ObjectCatalog - show3DView:', show3DView);
    console.log('ObjectCatalog - hasUploadedModels:', hasUploadedModels);
    
    if (!show3DView && !hasUploadedModels) {
      alert('Primero genera la vista 3D o sube un modelo personalizado para agregar objetos');
      return;
    }
    
    // Posición estratégica según el tipo de objeto
    let x, z, y = 0;
    
    if (objData.category === 'Vehículos') {
      // Colocar vehículos en el camino de entrada
      const angle = Math.random() * Math.PI * 0.3 - Math.PI * 0.15; // ±15 grados
      const distance = 12 + Math.random() * 8;
      x = Math.cos(angle) * distance;
      z = 8 + Math.sin(angle) * distance;
      y = -1.8;
    } else if (objData.category === 'Plantas y Árboles') {
      // Colocar plantas en el jardín
      const angle = Math.random() * Math.PI * 2;
      const distance = 6 + Math.random() * 12;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
      y = -2;
    } else if (objData.category === 'Muebles Exteriores') {
      // Colocar muebles cerca de la casa
      const angle = Math.random() * Math.PI * 2;
      const distance = 4 + Math.random() * 6;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
      y = -1.8;
    } else if (objData.category === 'Iluminación') {
      // Colocar luces en el perímetro
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 6;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
      y = -2;
    } else {
      // Posición general para otros objetos
      const angle = Math.random() * Math.PI * 2;
      const distance = 6 + Math.random() * 10;
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;
      y = -1.8;
    }
    
    const position: [number, number, number] = [x, y, z];
    const rotation: [number, number, number] = [0, Math.random() * Math.PI * 2, 0];
    
    // Escala según el tipo de objeto
    let scale: [number, number, number] = [1, 1, 1];
    if (objData.category === 'Vehículos') {
      scale = [0.8, 0.8, 0.8];
    } else if (objData.category === 'Plantas y Árboles') {
      scale = [0.6 + Math.random() * 0.8, 0.6 + Math.random() * 0.8, 0.6 + Math.random() * 0.8];
    } else if (objData.category === 'Muebles Exteriores') {
      scale = [0.7, 0.7, 0.7];
    }
    
    const newObject: Omit<SceneObject, 'id'> = {
      name: objData.name,
      category: objData.category,
      position,
      rotation,
      scale
    };
    
    console.log('ObjectCatalog - Objeto creado para enviar:', newObject);
    console.log('ObjectCatalog - Llamando onAddObject...');
    
    // Llamar la función callback
    onAddObject(newObject);
    
    console.log('ObjectCatalog - onAddObject llamado exitosamente');
  };

  const filteredObjects = getFilteredObjects();

  return (
    <div className="space-y-2 p-3">
      {/* Header */}
      <div className="text-center">
        <ShoppingCart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900 text-lg">Catálogo de Objetos</h3>
        <p className="text-sm text-gray-600">
          {(show3DView || hasUploadedModels) ? 'Busca y agrega objetos a tu propiedad' : 'Genera el modelo 3D o sube un archivo primero'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar objetos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          disabled={!show3DView && !hasUploadedModels}
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setShowAddedOnly(false);
            }}
            disabled={!show3DView && !hasUploadedModels}
            className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              selectedCategory === category
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } ${(!show3DView && !hasUploadedModels) ? 'opacity-50' : ''}`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Added Objects Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">
          Agregados ({addedObjects.length})
        </span>
        <button
          onClick={() => setShowAddedOnly(!showAddedOnly)}
          disabled={(!show3DView && !hasUploadedModels) || addedObjects.length === 0}
          className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
            showAddedOnly
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          } ${((!show3DView && !hasUploadedModels) || addedObjects.length === 0) ? 'opacity-50' : ''}`}
        >
          {showAddedOnly ? 'Todo' : 'Agregados'}
        </button>
      </div>

      {/* Objects Grid */}
      <div className="space-y-4">
        {filteredObjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {searchTerm ? 'No se encontraron objetos' : 'No hay objetos disponibles'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {filteredObjects.map((obj, index) => {
              const IconComponent = obj.icon;
              return (
                <div
                  key={`${obj.category}-${obj.name}-${index}`}
                  className={`flex items-center justify-between p-2 border rounded transition-all ${
                    obj.added 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${obj.color}20` }}
                    >
                      <IconComponent 
                        className="w-3 h-3" 
                        style={{ color: obj.color }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">{obj.name}</p>
                      <p className="text-xs text-gray-500">{obj.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {obj.added && showAddedOnly && obj.id ? (
                      <button
                        onClick={() => onRemoveObject(obj.id!)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar objeto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : !obj.added ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('ObjectCatalog - Botón + clickeado para objeto:', obj);
                          console.log('ObjectCatalog - Estado show3DView:', show3DView);
                          handleAddObject(obj);
                        }}
                        disabled={!show3DView && !hasUploadedModels}
                        className={`p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors ${
                          (!show3DView && !hasUploadedModels) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                        title={(show3DView || hasUploadedModels) ? "Agregar a la escena" : "Primero genera la vista 3D o sube un modelo"}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="p-1.5 text-green-600 relative" title="Ya agregado">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-30"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {(show3DView || hasUploadedModels) && addedObjects.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded p-2">
          <h4 className="font-semibold text-gray-900 mb-1 text-xs flex items-center">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            Objetos en Escena
          </h4>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <div>
              <p className="text-gray-600">Total</p>
              <p className="font-semibold text-green-600 text-sm">{addedObjects.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Categorías</p>
              <p className="font-semibold text-blue-600 text-sm">
                {new Set(addedObjects.map(obj => obj.category)).size}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Estado</p>
              <p className="font-semibold text-purple-600 text-xs">Activos</p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <button
              onClick={() => setShowAddedOnly(!showAddedOnly)}
              className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium transition-colors"
            >
              {showAddedOnly ? 'Catálogo' : 'Gestionar'}
            </button>
          </div>
        </div>
      )}

      {!show3DView && !hasUploadedModels && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
          <Lightbulb className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
          <p className="text-xs text-yellow-800 font-medium">
            Genera la vista 3D o sube un modelo para agregar objetos
          </p>
        </div>
      )}
    </div>
  );
}
