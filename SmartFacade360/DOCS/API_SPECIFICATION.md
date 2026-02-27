# SmartFacade360 API Specification
## Sovereign Data Engine - Ingestion Layer (TRL 5)

### Overview
This document specifies the serverless API endpoints for consuming drone photometry, LiDAR, and IoT sensor data. 
**Architecture**: Supabase Edge Functions (Deno).

### Authentication
All endpoints require the following headers:
- `Authorization`: Bearer `[JWT_TOKEN]` (Supabase Auth)
- `X-API-KEY`: `[YOUR_INGEST_KEY]` (Environment Variable Check)

---

### 1. Ingest Sensor Data (Polymorphic)
**Endpoint**: `POST /functions/v1/ingest-sensor-data`

Receives multi-modal data streams from n8n or field devices. Routes data to `inspections` or `sensor_streams` tables based on `capture_type`.

#### Request Body
```json
{
  "building_id": "uuid",
  "organization_id": "uuid",
  "capture_type": "360_img" | "LiDAR" | "Vibration",
  "payload": { ... }, 
  "timestamp": "ISO-8601 String"
}
```

#### Payload Schemas

**Type: `360_img`**
```json
{
  "image_url": "https://storage.supabase.co/..."
}
```

**Type: `Vibration`**
```json
{
  "readings": {
    "x": 0.05,
    "y": 0.02,
    "z": 0.98
  }
}
```

#### Responses

- **202 Accepted**: Async processing started.
  ```json
  {
    "message": "Ingesta aceptada",
    "record_id": "uuid",
    "target_table": "inspections"
  }
  ```

- **400 Bad Request**: Validation failure (Zod details).
- **401 Unauthorized**: Missing/Invalid API Key or JWT.
- **500 Internal Server Error**: Database insertion failed.

### 2. cURL Example
```bash
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/ingest-sensor-data \
  -H "Authorization: Bearer [USER_JWT]" \
  -H "X-API-KEY: [INGEST_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "building_id": "e0b5d5d5-8d5a-4b5d-9d5a-5b5d5d5d5d5d",
    "organization_id": "a0b5d5d5-8d5a-4b5d-9d5a-5b5d5d5d5d5d",
    "capture_type": "Vibration",
    "payload": {
        "readings": { "x": 0.1, "y": 0.05, "z": 0.0 }
    },
    "timestamp": "2026-02-18T12:00:00Z"
  }'
```
