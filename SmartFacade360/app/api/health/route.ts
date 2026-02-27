import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- Global Uptime and Rate Limiting ---
const serverStartTime = Date.now();
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getUptimeString(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

export async function GET(request: Request) {
    // 1. Rate Limiting por IP (usando headers as a proxy in App Router)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || '127.0.0.1';
    const now = Date.now();
    const limiter = rateLimitMap.get(ip) || { count: 0, timestamp: now };

    if (now - limiter.timestamp > RATE_LIMIT_WINDOW) {
        limiter.count = 0;
        limiter.timestamp = now;
    }

    if (limiter.count >= RATE_LIMIT_MAX) {
        return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    limiter.count += 1;
    rateLimitMap.set(ip, limiter);

    // 2. Initialize Component Status
    const components = {
        supabase: { status: 'down', latency: 0 },
        n8n: { status: 'down', latency: 0 },
        storage: { status: 'down' }
    };
    let globalStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // 3. Supabase DB Check
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const dbStart = performance.now();
        try {
            // Count query on inspections as a health check
            const { error } = await supabase.from('inspections').select('id', { count: 'exact', head: true });
            if (!error) {
                components.supabase.status = 'up';
                components.supabase.latency = Math.round(performance.now() - dbStart);
            } else {
                globalStatus = 'degraded';
            }
        } catch (e) {
            globalStatus = 'critical';
        }
    } else {
        globalStatus = 'critical'; // No Supabase config means critical failure for SmartFacade360
    }

    // 4. n8n Orchestrator Check
    const n8nWebhookUrl = process.env.N8N_HEALTH_WEBHOOK_URL;
    if (n8nWebhookUrl) {
        const n8nStart = performance.now();
        try {
            // Un ping rapido al webhook
            const res = await fetch(n8nWebhookUrl, { method: 'GET', signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                components.n8n.status = 'up';
                components.n8n.latency = Math.round(performance.now() - n8nStart);
            } else {
                globalStatus = 'degraded';
            }
        } catch (e) {
            globalStatus = 'degraded'; // n8n down is degraded, not critical for core data access
        }
    } else {
        // Ignorado si no está configurado, o reportalo down
        components.n8n.status = 'ignored_unconfigured' as any;
    }

    // 5. Supabase Storage Check
    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        try {
            const { data, error } = await supabase.storage.listBuckets();
            if (data && !error) {
                components.storage.status = 'up';
            } else {
                if (globalStatus !== 'critical') globalStatus = 'degraded';
            }
        } catch (e) {
            if (globalStatus !== 'critical') globalStatus = 'degraded';
        }
    }

    // 6. Response Construction (ISO 27031 compliance formatting)
    const responsePayload = {
        status: globalStatus,
        components,
        timestamp: new Date().toISOString(),
        uptime: getUptimeString(Date.now() - serverStartTime)
    };

    return NextResponse.json(responsePayload, {
        status: globalStatus === 'critical' ? 503 : 200,
        headers: {
            'Cache-Control': 'no-store, max-age=0'
        }
    });
}
