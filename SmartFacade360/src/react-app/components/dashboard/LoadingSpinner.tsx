import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    text?: string;
}

export default function LoadingSpinner({ text = 'Sincronizando Gemelo Digital...' }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] w-full bg-[#0F111A]/80 backdrop-blur-sm rounded-2xl p-8">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
            <p className="text-gray-300 font-mono text-sm tracking-widest uppercase animate-pulse">
                {text}
            </p>
            <div className="mt-6 w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 w-1/2 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
            </div>
        </div>
    );
}
