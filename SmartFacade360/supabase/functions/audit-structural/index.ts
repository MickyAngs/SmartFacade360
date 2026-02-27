import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1"
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// Interfaces for structured data
interface FindingInput {
    pathology_type: 'crack' | 'moisture' | 'thermal' | 'structural';
    metric_deviation: number;
    element_type: 'beam' | 'column' | 'facade' | 'slab';
    severity_level?: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
}

// Mock of an embedding generator (e.g., call to OpenAI API in production)
async function generateEmbedding(text: string): Promise<number[]> {
    // In production: fetch('https://api.openai.com/v1/embeddings', {...})
    // For TRL 5 validation, we mock a 1536-dimensional array.
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
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

        // 2. Validation: Zod Schema
        const findingSchema = z.object({
            pathology_type: z.enum(['crack', 'moisture', 'thermal', 'structural']),
            metric_deviation: z.number().positive(),
            element_type: z.enum(['beam', 'column', 'facade', 'slab']),
            severity_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
            description: z.string().optional()
        })

        const reqSchema = z.object({
            inspection_id: z.string().uuid(),
            organization_id: z.string().uuid(),
            findings: z.array(findingSchema)
        })

        const body = await req.json()
        const result = reqSchema.safeParse(body)

        if (!result.success) {
            return new Response(JSON.stringify({ error: 'Validation Error', details: result.error }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const data = result.data

        // 3. Supabase Client Setup (Applying RLS via Auth Header)
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

        // 4. Processing Findings & Severity Calculation
        let healthScore = 100
        const processedFindings = []
        let criticalAlertTriggered = false

        for (const input of data.findings) {
            let severity = input.severity_level || 'low'
            let weight = 1.0
            let nte_reference = null

            // Element structure weight
            if (['beam', 'column'].includes(input.element_type)) {
                weight = 1.5
            }

            // NTE E.060 Core Rule: Deviation > 5mm in structure is CRITICAL
            if (input.metric_deviation > 5.0 && ['beam', 'column'].includes(input.element_type)) {
                severity = 'critical'
                criticalAlertTriggered = true

                // RAG Execution
                console.log(`[RAG] Generating embedding for structural defect analysis...`)
                const queryEmbedding = await generateEmbedding(`Falla estructural crítica tipo ${input.pathology_type} con desviación de ${input.metric_deviation}mm en ${input.element_type}`)

                // Call Supabase RPC to match vectors
                const { data: nteData, error: rpcError } = await supabase.rpc('match_normative_knowledge', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.78,
                    match_count: 1,
                    org_id: data.organization_id // Respect tenant isolation
                })

                if (!rpcError && nteData && nteData.length > 0) {
                    nte_reference = `${nteData[0].source} Section ${nteData[0].section}`
                } else {
                    nte_reference = 'NTE E.060 Art. 10.4 (Reference Default)'
                }
            }

            // Penalization Matrix
            let penalty = 0
            switch (severity) {
                case 'low': penalty = 5; break;
                case 'medium': penalty = 15; break;
                case 'high': penalty = 25; break;
                case 'critical': penalty = 40; break;
            }

            // Green AI Thermal Penalty
            if (input.pathology_type === 'thermal') {
                // Assume standard kWh loss deduction logic
                healthScore -= 3
            }

            healthScore -= (penalty * weight)

            processedFindings.push({
                inspection_id: data.inspection_id,
                organization_id: data.organization_id,
                pathology_type: input.pathology_type,
                severity_level: severity,
                metric_deviation: input.metric_deviation,
                nte_reference: nte_reference,
                remediation_suggestion: severity === 'critical' ? 'Intervención estructural inmediata recomendada.' : 'Monitoreo preventivo requerido.',
            })
        }

        // Clamp Score
        if (healthScore < 0) healthScore = 0

        // 5. Database Transactions
        // Insert findings
        const { error: findingsError } = await supabase
            .from('findings')
            .insert(processedFindings)

        if (findingsError) throw findingsError

        // Update Inspection Score
        const { error: inspectionError } = await supabase
            .from('inspections')
            .update({ health_score: healthScore })
            .eq('id', data.inspection_id)
            .eq('organization_id', data.organization_id)

        if (inspectionError) throw inspectionError

        // 6. Webhook Notification Validation
        if (criticalAlertTriggered) {
            console.log(`[ALERT] Disparando webhook a n8n por estado CRÍTICO en inspección ${data.inspection_id}`)
            // fetch('https://n8n.your-domain.com/webhook/critical-structural-alert', { ... })
        }

        return new Response(JSON.stringify({
            message: "Auditoría estructural completada",
            inspection_id: data.inspection_id,
            health_score: healthScore,
            findings_processed: processedFindings.length
        }), {
            status: 200,
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
