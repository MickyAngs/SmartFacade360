
import { useRef } from 'react';
import '@google/model-viewer';
import { ValidationService } from '../../services/ValidationService';
import { Scan } from 'lucide-react';
import { useSupabaseModelLoader } from '../hooks/useSupabaseModelLoader';



interface ARButtonProps {
    modelUrl: string | undefined;
    modelId: string | undefined;
}

export default function ARButton({ modelUrl, modelId }: ARButtonProps) {
    const viewerRef = useRef<any>(null);

    // Resolve Signed URL for AR session
    const signedUrl = useSupabaseModelLoader(modelUrl);

    // Placeholder or Validation logic could go here if needed
    // const hasValidModel = prepareModelForAR(signedUrl);

    /**
     * Misión Crítica: Validate model format for AR compatibility.
     */


    const handleARClick = () => {
        if (modelId) {
            ValidationService.logARActivation(modelId);
        }
        if (viewerRef.current) {
            viewerRef.current.activateAR();
        }
    };

    // Allow button to render for placeholder testing if no uploaded model
    // if (!canActivateAR || !signedUrl) return null;

    return (
        <>
            <div className="absolute bottom-8 right-8 z-50">
                <button
                    onClick={handleARClick}
                    className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-full shadow-lg shadow-purple-900/30 transition-all transform hover:scale-105 font-bold"
                    data-testid="ar-button"
                >
                    <Scan size={20} />
                    <span>Ver en tu Espacio (RA)</span>
                </button>
            </div>

            {/* Hidden Model Viewer that acts as the AR engine */}
            <model-viewer
                ref={viewerRef}
                src={signedUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'} // Placeholder for immediate testing
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
