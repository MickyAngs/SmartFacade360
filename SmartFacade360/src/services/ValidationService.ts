
import { supabase } from './supabaseClient';
import { Database } from '../shared/types/supabase';

type ValidationLogInsert = Database['public']['Tables']['user_validation_logs']['Insert'];

export const ValidationService = {
    /**
     * Logs a user interaction for market validation metrics.
     * @param action The type of action (e.g., 'view_material', 'activate_ar')
     * @param targetId The ID of the material or model being interacted with (optional)
     * @param metadata Additional context (e.g., duration, device type)
     */
    logUserInteraction: async (action: string, targetId?: string, metadata: any = {}) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const logEntry: ValidationLogInsert = {
                action,
                target_id: targetId,
                user_id: user?.id || null, // Capture user ID or log as anonymous
                metadata: metadata
            };

            const { error } = await supabase
                .from('user_validation_logs')
                // @ts-ignore - Supabase type inference limitation
                .insert(logEntry);

            if (error) {
                console.error('ValidationService Error:', error.message);
            }
        } catch (err) {
            console.error('ValidationService Unexpected Error:', err);
        }
    },

    /**
     * Helper to log when AR is activated.
     */
    logARActivation: async (modelId: string) => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        return ValidationService.logUserInteraction('activate_ar', modelId, { device: isMobile ? 'mobile' : 'desktop' });
    }
};
