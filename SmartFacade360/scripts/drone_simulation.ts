#!/usr/bin/env ts-node
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:54321/functions/v1/ingest-sensor-data'; // Adjust port matching local Supabase
const API_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key';
const BUILDING_ID = process.env.TEST_BUILDING_ID || 'test-uuid';
const ORGANIZATION_ID = process.env.TEST_ORGANIZATION_ID || 'test-org-uuid';
const INSPECTION_ID = process.env.TEST_INSPECTION_ID || 'test-inspection-uuid';

async function simulateDroneData(isCritical = false) {
    console.log(`\n🚀 Iniciando Simulación de Dron para Edificio: ${BUILDING_ID}`);

    // Generar un hallazgo aleatorio o forzar crítico
    const metricDeviation = isCritical ? (5.1 + Math.random() * 10) : (0.5 + Math.random() * 4); // mm
    const severity = isCritical ? 'critical' : (Math.random() > 0.5 ? 'low' : 'medium');
    const pathology = isCritical ? 'structural_crack' : 'thermal_anomaly';

    const payload = {
        building_id: BUILDING_ID,
        organization_id: ORGANIZATION_ID,
        inspection_id: INSPECTION_ID,
        sensor_type: 'drone_360',
        timestamp: new Date().toISOString(),
        data_points: {
            image_url: 'https://smartfacade360.com/mock-pano.jpg',
            coordinates: { lat: -12.0464, lng: -77.0428, alt: 45.5 }
        },
        findings: [
            {
                pathology_type: pathology,
                severity_level: severity,
                metric_deviation: parseFloat(metricDeviation.toFixed(2)),
                element_type: 'facade_panel',
                nte_reference: 'E.060 Art. 12',
                remediation_suggestion: isCritical ? 'Requiere apuntalamiento inmediato.' : 'Monitoreo programado.'
            }
        ]
    };

    console.log(`📦 Payload generado:`, JSON.stringify(payload, null, 2));

    try {
        console.log(`📡 Enviando POST a: ${API_URL}`);
        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                // Si la Edge Function espera X-API-KEY específica en lugar de Bearer:
                // 'X-API-KEY': API_KEY 
            }
        });

        console.log(`✅ Respuesta [${response.status}]:`, response.data);
    } catch (error: any) {
        console.error(`❌ Error en Ingesta:`, error.response?.status);
        console.error(error.response?.data || error.message);
    }
}

async function runSimulation() {
    const isMulti = process.argv.includes('--multi');

    if (isMulti) {
        console.log("🌀 Modo Multi-simulación activado. Enviando 3 ráfagas...");
        await simulateDroneData(false); // Normal
        await new Promise(r => setTimeout(r, 3000));
        await simulateDroneData(false); // Normal
        await new Promise(r => setTimeout(r, 3000));
        await simulateDroneData(true);  // Crítico!
    } else {
        await simulateDroneData(true); // Default a crítico para ver alerta en Dashboard
    }

    console.log("\n🛑 Simulación Completada.");
    console.log("👉 Abre tu Dashboard de Command Center. Deberías ver:");
    console.log("   - El nuevo hallazgo en el Timeline.");
    console.log("   - El Health Score penalizado.");
    console.log("   - Un Toast ROJO CRÍTICO indicando alerta estructural.");
}

runSimulation();
