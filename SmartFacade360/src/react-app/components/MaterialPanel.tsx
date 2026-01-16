
import { useEffect, useState } from 'react';
import { MaterialService, Material } from '../../services/MaterialService';
import { ValidationService } from '../../services/ValidationService';
import TechSheet from './TechSheet';
import { ChevronRight, Loader2 } from 'lucide-react';

interface MaterialPanelProps {
    onMaterialSelect: (material: Material) => void;
}

export default function MaterialPanel({ onMaterialSelect }: MaterialPanelProps) {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

    useEffect(() => {
        loadMaterials();
    }, []);

    const loadMaterials = async () => {
        const { data } = await MaterialService.getMaterials();
        if (data) {
            setMaterials(data);
            // Auto-select the first one (most sustainable)
            if (data.length > 0) {
                handleSelect(data[0]);
            }
        }
        setLoading(false);
    };

    const handleSelect = (material: Material) => {
        setSelectedMaterial(material);
        onMaterialSelect(material);
        ValidationService.logUserInteraction('view_material', material.id, {
            sustainability_score: material.sustainability_score
        });
    };

    if (loading) return <div className="absolute left-4 top-20 text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <>
            {/* Sidebar Panel */}
            <div className="absolute left-4 top-24 bottom-24 w-64 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-40 flex flex-col">
                <div className="p-4 border-b border-slate-700 bg-slate-900">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Biblioteca de Materiales</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {materials.map((mat) => (
                        <button
                            key={mat.id}
                            onClick={() => handleSelect(mat)}
                            className={`w-full text-left p-3 rounded-lg transition-all border border-transparent group relative
                            ${selectedMaterial?.id === mat.id
                                    ? 'bg-slate-800 border-blue-500/50 shadow-lg shadow-blue-900/20'
                                    : 'hover:bg-slate-800/50 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full shadow-inner border border-white/10"
                                    style={{ backgroundColor: mat.hex_color || '#ccc' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-200 truncate text-sm">{mat.name}</div>
                                    {mat.is_sustainable && (
                                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Eco-Smart Certified</div>
                                    )}
                                </div>
                                {selectedMaterial?.id === mat.id && <ChevronRight size={16} className="text-blue-400" />}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-3 bg-slate-950/50 text-[10px] text-center text-slate-500 border-t border-slate-800">
                    TRL 5 Prototype v1.2
                </div>
            </div>

            {/* Floating Tech Sheet */}
            {selectedMaterial && (
                <TechSheet
                    material={selectedMaterial}
                    onClose={() => setSelectedMaterial(null)}
                />
            )}
        </>
    );
}
