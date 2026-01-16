
import { useState, useEffect } from 'react';
import { ModelService } from '@/services/ModelService';

/**
 * Hook to resolve Supabase Storage paths to signed URLs.
 * Handles memory cleanup and error logging.
 */
export function useSupabaseModelLoader(url: string | undefined) {
    const [signedUrl, setSignedUrl] = useState<string | undefined>(url);

    useEffect(() => {
        let isMounted = true;

        if (!url) {
            setSignedUrl(undefined);
            return;
        }

        // Logic to handle Supabase Storage paths vs Direct URLs
        if (!url.startsWith('http') && !url.startsWith('blob')) {
            ModelService.getModelUrl(url).then((signed: string | null) => {
                // Strict Null Check & Unmount Guard
                if (isMounted && signed) {
                    setSignedUrl(signed);
                }
            }).catch(err => {
                console.error("Error signing URL:", err);
            });
        } else {
            setSignedUrl(url);
        }

        // Cleanup function to prevent memory leaks (Oxentia Requirement)
        return () => {
            isMounted = false;
        };
    }, [url]);

    return signedUrl;
}
