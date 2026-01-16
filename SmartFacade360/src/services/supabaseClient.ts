
import { createClient } from '@supabase/supabase-js';
import { Database } from '../shared/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase Credentials Missing: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

/**
 * Singleton Supabase Client
 * Typed with the Database schema for auto-completion and type safety.
 */
export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

/**
 * Helper to check connection status.
 * Useful for debugging during the TRL 5 migration phase.
 */
export const checkConnection = async () => {
    try {
        const { count, error } = await supabase
            .from('materials_library')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;
        console.log(`Supabase Connected. Materials found: ${count}`);
        return true;
    } catch (error) {
        console.error('Supabase Connection Failed:', error);
        return false;
    }
};
