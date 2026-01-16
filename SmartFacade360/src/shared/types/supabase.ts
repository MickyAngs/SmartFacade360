export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    email: string | null
                    role: 'user' | 'admin' | 'agent'
                    created_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    email?: string | null
                    role?: 'user' | 'admin' | 'agent'
                    created_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    email?: string | null
                    role?: 'user' | 'admin' | 'agent'
                    created_at?: string
                }
            }
            materials_library: {
                Row: {
                    id: string
                    name: string
                    thumbnail_url: string | null
                    hex_color: string | null
                    texture_config: Json | null
                    thermal_conductivity: number | null
                    price_per_m2: number | null
                    sustainability_score: number | null
                    co2_footprint: number | null
                    is_sustainable: boolean | null
                    durability_years: number | null
                    tech_transfer_summary: string | null
                    tech_specs: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    thumbnail_url?: string | null
                    hex_color?: string | null
                    texture_config?: Json | null
                    thermal_conductivity?: number | null
                    price_per_m2?: number | null
                    sustainability_score?: number | null
                    co2_footprint?: number | null
                    is_sustainable?: boolean | null
                    durability_years?: number | null
                    tech_transfer_summary?: string | null
                    tech_specs?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    thumbnail_url?: string | null
                    hex_color?: string | null
                    texture_config?: Json | null
                    thermal_conductivity?: number | null
                    price_per_m2?: number | null
                    sustainability_score?: number | null
                    co2_footprint?: number | null
                    is_sustainable?: boolean | null
                    durability_years?: number | null
                    tech_transfer_summary?: string | null
                    tech_specs?: Json | null
                    created_at?: string
                }
            }
            building_models: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    storage_url: string
                    preview_url: string | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    storage_url: string
                    preview_url?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    storage_url?: string
                    preview_url?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
            },
            user_validation_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    action: string
                    target_id: string | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    action: string
                    target_id?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    action?: string
                    target_id?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
            }
        }
    }
}
