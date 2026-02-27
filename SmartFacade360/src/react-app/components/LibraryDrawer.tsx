import { useRef, useEffect } from "react";
import { BookOpen, X } from "lucide-react";

interface LibraryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function LibraryDrawer({ isOpen, onClose, children }: LibraryDrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close on click outside if desired, or Escape key
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                ref={drawerRef}
                className={`fixed top-0 left-0 h-full w-[85%] md:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2 text-gray-800">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        <h2 className="font-bold text-lg">Biblioteca</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="h-[calc(100%-64px)] overflow-y-auto custom-scrollbar p-4 bg-slate-50">
                    {children}
                </div>
            </div>
        </>
    );
}
