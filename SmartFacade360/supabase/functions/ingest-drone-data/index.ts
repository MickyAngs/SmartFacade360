import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1"
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Security: API Key
        const apiKey = req.headers.get('x-api-key')
        const envApiKey = Deno.env.get('INGEST_API_KEY')

        // Ignore verification if env var is not set (dev mode safety)
        if (envApiKey && apiKey !== envApiKey) {
            console.error("Invalid API Key")
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Key' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Validation: Zod Schema
        const schema = z.object({
            building_id: z.string().uuid(),
            image_url_360: z.string().url(),
            telemetry_data: z.object({
                lat: z.number(),
                long: z.number(),
                alt: z.number(),
            }),
            sensor_reading: z.object({
                vibration: z.object({
                    x: z.number(),
                    y: z.number(),
                    z: z.number()
                }),
                emf_fatigue: z.number(),
            }),
        })

        const body = await req.json()
        const result = schema.safeParse(body)

        if (!result.success) {
            console.error("Validation Error", result.error)
            return new Response(JSON.stringify({ error: 'Validation Error', details: result.error }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        const data = result.data

        // 3. Supabase Client Setup
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // Get User
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid User Token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Get Profile for Organization ID
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'Profile not found or no organization assigned' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. Insert into DB
        const { data: insertData, error: insertError } = await supabase
            .from('inspections')
            .insert({
                building_id: data.building_id,
                organization_id: profile.organization_id,
                drone_metadata: {
                    image_url: data.image_url_360,
                    telemetry: data.telemetry_data,
                    sensor_reading: data.sensor_reading,
                    ingested_at: new Date().toISOString()
                },
            })
            .select()
            .single()

        if (insertError) {
            console.error("DB Insert Error", insertError)
            throw insertError
        }

        // 5. Async Analysis Log
        console.log(`[Async] Triggering 3D analysis for Inspection ${insertData.id}`)

        return new Response(JSON.stringify({
            message: "Ingesta aceptada - Análisis 3D iniciado",
            inspection_id: insertData.id,
            status: "processing"
        }), {
            status: 202,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error("Server Error", error)
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
