import { useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function FullscreenToggle() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch (err) {
            console.error("Fullscreen toggle failed", err);
        }
    };

    return (
        <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
        >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
    );
}
