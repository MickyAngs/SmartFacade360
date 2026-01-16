/// <reference types="vite/client" />

import * as React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                alt?: string;
                ar?: boolean;
                'ar-modes'?: string;
                'camera-controls'?: boolean;
                'shadow-intensity'?: string;
                'auto-rotate'?: boolean;
                poster?: string;
                loading?: string;
                reveal?: string;
                'data-model-id'?: string;
            };
        }
    }
}

// Augmentation for newer React types (module augmentation)
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                alt?: string;
                ar?: boolean;
                'ar-modes'?: string;
                'camera-controls'?: boolean;
                'shadow-intensity'?: string;
                'auto-rotate'?: boolean;
                poster?: string;
                loading?: string;
                reveal?: string;
                'data-model-id'?: string;
            };
        }
    }
}

export { };
