
import { useRef } from 'react';
import '@google/model-viewer';
import { ValidationService } from '../../services/ValidationService';
import { Scan } from 'lucide-react';
import { useSupabaseModelLoader } from '../hooks/useSupabaseModelLoader';



interface ARButtonProps {
    modelUrl: string | undefined;
    modelId: string | undefined;
    embeddedMode?: boolean;
}

export default function ARButton({ modelUrl, modelId, embeddedMode = false }: ARButtonProps) {
    const viewerRef = useRef<any>(null);

    // Resolve Signed URL for AR session
    const signedUrl = useSupabaseModelLoader(modelUrl);

    const handleARClick = () => {
        if (modelId) {
            ValidationService.logARActivation(modelId);
        }
        if (viewerRef.current) {
            viewerRef.current.activateAR();
        }
    };

    // --- EMBEDDED MODE (Inside Side Panel) ---
    if (embeddedMode) {
        return (
            <div className="w-full h-full relative">
                <model-viewer
                    ref={viewerRef}
                    src={signedUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'}
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    shadow-intensity="1"
                    style={{ width: '100%', height: '100%', backgroundColor: '#111827' }}
                >
                    <button
                        slot="ar-button"
                        onClick={handleARClick}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <Scan size={16} />
                        <span>Lanzar en Móvil (RA)</span>
                    </button>

                    <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                        Vista Previa Interactiva
                    </div>
                </model-viewer>
            </div>
        );
    }

    // --- LEGACY / FLOATING BUTTON MODE ---
    // This is now mostly handled by ToggleRAView's trigger button, but kept if needed elsewhere
    return (
        <>
            <div className="hidden"> {/* Force hidden because ToggleRAView handles the trigger now */}
                {/* 
                <button ... > ... </button> 
                Kept in logic but hidden from UI to avoid duplication 
             */}
            </div>

            {/* Hidden Engine for pure logic cases */}
            <model-viewer
                ref={viewerRef}
                src={signedUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                shadow-intensity="1"
                style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, visibility: 'hidden' }}
            >
            </model-viewer>
        </>
    );
}
