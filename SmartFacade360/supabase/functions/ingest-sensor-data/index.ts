
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1"
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Security: API Key
        const apiKey = req.headers.get('x-api-key')
        const envApiKey = Deno.env.get('INGEST_API_KEY')

        if (envApiKey && apiKey !== envApiKey) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Key' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Validation: Zod Schema (Polymorphic)
        const baseSchema = z.object({
            building_id: z.string().uuid(),
            organization_id: z.string().uuid(),
            capture_type: z.enum(['360_img', 'LiDAR', 'Vibration']),
            timestamp: z.string().datetime().optional().default(() => new Date().toISOString()),
            payload: z.record(z.any()), // Refined below
        })

        const body = await req.json()
        const result = baseSchema.safeParse(body)

        if (!result.success) {
            return new Response(JSON.stringify({ error: 'Validation Error', details: result.error }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        const data = result.data

        // Specific Payload Validation
        if (data.capture_type === '360_img') {
            const imgSchema = z.object({ image_url: z.string().url() })
            const payloadCheck = imgSchema.safeParse(data.payload)
            if (!payloadCheck.success) throw new Error("Invalid 360_img payload: " + payloadCheck.error)
        } else if (data.capture_type === 'Vibration') {
            const vibSchema = z.object({
                readings: z.object({ x: z.number(), y: z.number(), z: z.number() })
            })
            const payloadCheck = vibSchema.safeParse(data.payload)
            if (!payloadCheck.success) throw new Error("Invalid Vibration payload: " + payloadCheck.error)
        }

        // 3. Supabase Client
        const authHeader = req.headers.get('Authorization')
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader ?? '' } } }
        )

        // 4. Routing Logic
        let table = ''
        let insertRow = {}

        if (data.capture_type === 'Vibration') {
            table = 'sensor_streams'
            insertRow = {
                building_id: data.building_id,
                organization_id: data.organization_id,
                sensor_type: 'vibration',
                data_points: data.payload.readings,
                timestamp: data.timestamp
            }
        } else {
            // 360_img or LiDAR -> Inspections
            table = 'inspections'
            insertRow = {
                building_id: data.building_id,
                organization_id: data.organization_id,
                drone_metadata: {
                    type: data.capture_type,
                    payload: data.payload,
                    ingested_at: new Date().toISOString()
                },
                inspection_date: data.timestamp
            }
        }

        // 5. DB Insertion
        const { data: inserted, error: dbError } = await supabase
            .from(table)
            .insert(insertRow)
            .select()
            .single()

        if (dbError) {
            console.error("DB Insert Error", dbError)
            return new Response(JSON.stringify({ error: 'Database Error', details: dbError.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 6. NTE E.060 Check (Vibration)
        if (data.capture_type === 'Vibration') {
            // Mock Threshold Check
            const { x, y, z } = data.payload.readings as any
            const magnitude = Math.sqrt(x * x + y * y + z * z)
            if (magnitude > 0.5) {
                console.log(`[ALERT] NTE E.060 Violation Potential: Vibration Magnitude ${magnitude} exceeds 0.5g`)
                // Async: Log finding or trigger alert
            }
        }

        return new Response(JSON.stringify({
            message: "Ingesta aceptada",
            record_id: inserted.id,
            target_table: table
        }), {
            status: 202,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: 'Server Error', details: error.message || error }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
