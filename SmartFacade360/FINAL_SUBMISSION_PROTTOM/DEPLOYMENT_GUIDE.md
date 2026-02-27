# GUÍA DE DESPLIEGUE RÁPIDO Y VERIFICACIÓN SOBERANA
**Sistema:** SmartFacade360 – Command Center (TRL 5)
**Tiempo Estimado de Despliegue:** < 10 minutos
**Dirigido a:** Administradores de Infraestructura TI (Ej. GARES SAC - Trujillo)

---

## 1. REQUISITOS DEL SISTEMA Y PRE-CONDICIONES
El ecosistema ha sido diseñado para un despliegue sin fricciones (*frictionless deployment*) empleando contenedores de Edge Functions y motores serverless.
*   **Entorno de Ejecución:** Node.js v20.x o superior (`node -v`).
*   **Gestor de Paquetes:** `npm` (v10+).
*   **Cerebro Vectorial y BaaS:** Proyecto de Supabase activo (con la extensión `pgvector` habilitada).
*   **Aceleración 3D:** El navegador del cliente (Chrome/Edge) debe soportar WebGL 2.0.

## 2. ARQUITECTURA DEL GEMELO DIGITAL Y CONFIGURACIÓN `.env`
El núcleo de **orquestación agéntica multimodal** demanda la inyección transaccional de llaves criptográficas antes del despliegue.

1.  Clonar el repositorio seguro o extraer el ZIP del paquete de transferencia TRL 5.
2.  Navegar a la raíz del pilar Front-End:
    ```bash
    cd SmartFacade360
    ```
3.  Renombrar el archivo `.env.example` a `.env` e inyectar las llaves de Supabase:
    ```env
    VITE_SUPABASE_URL="https://[TU-PROYECTO].supabase.co"
    VITE_SUPABASE_ANON_KEY="eyJhbG... (Firma JWT Pública)"
    # Server-side exports para ISO 19650 BCF y Reports
    NEXT_PUBLIC_SUPABASE_URL=$VITE_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
    API_URL="http://localhost:5173"
    API_KEY="test_api_key_smartfacade_2024"
    ```

## 3. COMPILACIÓN COMERCIAL E INICIALIZACIÓN DE DEPENDENCIAS
El sistema de visualización tridimensional requiere descargar binarios empaquetados pesados (`three`, `@react-three/drei`).

1.  **Ejecute la instalación de dependencias en modo *Force* o *Legacy* (debido a discrepancias en WebGL engines):**
    ```bash
    npm install --legacy-peer-deps
    ```
2.  **Ignición del Servidor *Next.js / Vite:*:**
    ```bash
    npm run dev
    # (El servidor operará de facto en http://localhost:5173/)
    ```

## 4. VALIDACIÓN DE ESTRUCTURAS SOBERANAS Y SEMILLEROS (SEED)
SmartFacade360 ampara a sus clientes bajo la Ley 29733 (Protección de Datos en Perú). El administrador debe configurar el esquema lógico en Supabase (RLS).

1.  **Ejecución de Arquitectura Relacional (SQL):** En el panel SQL de Supabase, ejecute el script `supabase_schema.sql` (que configura las políticas de Row Level Security `RLS` aislando el `organization_id`).
2.  **Prueba Holística End-to-End (Ingesta de Sensores Simultánea):**
    Para verificar la matriz matemática Euclidiana, el pipeline BCF ISO 19650 y el análisis NTE E.060, abra otra terminal y ejecute el test *Cyberpunk/Forensic*:
    ```bash
    npx tsx scripts/demo_pipeline.ts
    ```
    🚨 Si la pantalla retorna **"[CERTIFICADO] DEMOSTRACIÓN TRL 5 COMPLETADA EXITOSAMENTE"**, el motor Soberano se encuentra operativo y el RLS está funcionando aislando en `test_org_uuid_validation`.

## 5. REINICIO DE RECUPERACIÓN (ISO 27037 CONTINGENCIA)
*   **Blank Screen / 3D Model Crash:** El ecosistema inyectará un *Modal Glassmorphism* (`ErrorBoundary`) a la interfaz cliente solicitando la recarga en caché y generando asíncronamente un log en `audit_logs` hacia Supabase. Monitoree su tabla `audit_logs` para auditar la trazabilidad de los fallos métricos.
*   **Verificación Directa:** Ingrese a la URI `http://localhost:5173/api/health` para solicitar directamente el estado operativo al balanceador de la nube y confirmación JSON del motor Supabase (`{"status": "healthy"}`).

> *Manual certificado por Arquitectura SF360 para transferencia tecnológica y capacitación funcional de clientes Tier 1 como GARES SAC.*
