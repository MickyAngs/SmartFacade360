
import { supabase } from './supabaseClient';
import { Database } from '../shared/types/supabase';

export type Material = Database['public']['Tables']['materials_library']['Row'];

export const MaterialService = {
    /**
     * Fetches all materials sorted by sustainability impact (high score first).
     * This aligns with the "Tech Transfer" goal of promoting eco-friendly choices.
     */
    getMaterials: async (): Promise<{ data: Material[] | null; error: any }> => {
        try {
            const { data, error } = await supabase
                .from('materials_library')
                .select('*')
                .order('sustainability_score', { ascending: false });

            if (error) throw error;

            return { data, error: null };
        } catch (error: any) {
            console.error('MaterialService Error:', error.message);
            return { data: null, error };
        }
    },

    /**
     * Fetches a single material by ID for detailed thermal analysis.
     */
    getMaterialById: async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('materials_library')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error(`MaterialService Error (ID: ${id}):`, error.message);
            return { data: null, error };
        }
    }
};
