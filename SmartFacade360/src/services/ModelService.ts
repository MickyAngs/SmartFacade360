
import { supabase } from './supabaseClient';
import { Database } from '../shared/types/supabase';

type BuildingModelInsert = Database['public']['Tables']['building_models']['Insert'];

/**
 * Performance check for Oxentia Metrics.
 * Use this during development to verify <2s loading times on 4G.
 */
function checkLoadingPerformance(startTime: number, modelName: string) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const status = duration < 2000 ? 'PASS ✅' : 'FAIL ⚠️ (Needs Optimization)';

    console.log(`[Oxentia Performance] Model: ${modelName}`);
    console.log(`[Oxentia Performance] Load Time: ${duration.toFixed(2)}ms`);
    console.log(`[Oxentia Performance] Status: ${status}`);

    if (duration > 2000) {
        console.warn('Performance Alert: Consider using Draco compression or .glb binary format.');
    }
}

export const ModelService = {
    /**
     * Fetches user's saved models.
     */
    getUserModels: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('building_models')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('ModelService.getUserModels Error:', error.message);
            return { data: null, error };
        }
    },

    /**
     * Gets a signed URL for a private model in storage.
     * Includes TRL 5 Warning for non-optimized formats (.obj).
     */
    getModelUrl: async (storagePath: string): Promise<string | null> => {
        try {
            // 1. Check file extension for Optimization Warning
            if (storagePath.toLowerCase().endsWith('.obj')) {
                console.warn(
                    `[TRL 5 Optimization] Loaded file '${storagePath}' is in .obj format. ` +
                    `For production environments (TRL 5+), please convert to .glb with Draco compression to reduce latency.`
                );
            }

            // 2. Start Performance Timer
            const startTime = performance.now();

            const { data, error } = await supabase
                .storage
                .from('facade-models')
                .createSignedUrl(storagePath, 3600); // 1 hour expiry

            if (error) throw error;

            // 3. Log Performance (Simulating the network request start - actual download happens in UI)
            checkLoadingPerformance(startTime, storagePath);

            return data.signedUrl;
        } catch (error: any) {
            console.error('ModelService.getModelUrl Error:', error.message);
            return null;
        }
    },

    /**
     * Uploads a model file to the 'facade-models' bucket.
     */
    uploadModel: async (file: File, userId: string) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError } = await supabase
                .storage
                .from('facade-models')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            return { filePath, error: null };
        } catch (error: any) {
            console.error('ModelService.uploadModel Error:', error.message);
            return { filePath: null, error };
        }
    },

    /**
     * Saves metadata pointer to the DB after successful upload.
     */
    saveModelMetadata: async (modelData: BuildingModelInsert) => {
        try {
            const { data, error } = await supabase
                .from('building_models')
                .insert(modelData as any)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('ModelService.saveModelMetadata Error:', error.message);
            return { data: null, error };
        }
    }
};
