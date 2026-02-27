# Certificación de Cumplimiento ISO 19650 – SmartFacade360
**Objetivo:** Atestiguar la interoperabilidad y soberanía del sistema BCF.
**Estándar de Referencia:** ISO 19650-2 (Información relativa al ciclo de vida).
**Fecha de Emisión:** Febrero 2026 (Demo Day PROTTOM).

## 1. RESUMEN EJECUTIVO (INTEROPERABILIDAD BIM)
El paradigma BIM (Building Information Modeling) requiere que la información fluya sin dependencias privativas. SmartFacade360 ha implementado exportación nativa al **BIM Collaboration Format (BCF 2.1 / 3.0)**, transformando instantáneas de telemetría de drones en "Tickets Geomé́tricos" (`.bcfzip`) legibles asíncronamente por plataformas maestras como Autodesk Revit, Navisworks, o Solibri. Esta arquitectura habilita el flujo openBIM dictado por ISO 19650-2.

## 2. MAPEO DATA ESTRUCTURAL (SF360 -> BCF)
El motor de IA de SmartFacade360 traduce su pipeline RAG al estándar BCF mediante la transcodificación de las tablas `findings` en `Supabase`:

| Dominio Ciberfísico SF360 | Entidad ISO BCF (markup.bcf) | Comentario Integrado |
| :--- | :--- | :--- |
| `pathology_type` + `metric_deviation` | **Topic Title:** Ej. "Fisura CRITICAL - Desviación 7.2mm" | Categorización semántica obligatoria |
| `severity_level` (Enum RAG) | **Topic Status:** "Error" (crítico) o "Warning" | Condiciona asignación en software BIM |
| `coordinates {x,y,z}` (WGS84 transcodificado) | **Viewpoint Camera:** (Vector Dirección XYZ) | Focaliza la cámara del usuario en Revit |
| `nte_reference` (Auditor E.060) | **Comment:** "Referencia: NTE E.060 Cap. 21..." | Dictamen Legal Embebido |

## 3. CUMPLIMIENTO NTE E.060 (DICTAMEN ASÍNCRONO)
La inclusión de métricas como "Falla frágil por tracción (>0.3mm)" no es un mero string de texto; es producto de una consulta vectorial RAG contra el corpus normativo del Reglamento Nacional de Edificaciones (Perú). Al exportar este veredicto vía BCF, SmartFacade360 evita que un arquitecto receptor ignore un riesgo estructural inminente. El ticket BIM nace **pre-auditado**.

## 4. CADENA DE CUSTODIA (ISO 27037)
Al empacar el archivo `.bcfzip` en el servidor seguro (`app/api/v1/export/bcf/[inspectionId]`), el sistema Node.js anexa la fecha de firma y garantiza la trazabilidad exigida por la Ley 29733 y normas de forense digital:
- Toda inyección de BCF porta UUIDs criptográficos.
- La ejecución obedece RLS (Row Level Security) garantizando que solo la empresa dueña del activo extraiga el XML pericial.

> **Uso Operativo:** El usuario descarga en un clic el empaquetado `inspection_[uuid]_bcf.bcfzip` desde el Digital Twin Dashboard e importa el archivo directamente en su gestor de colisiones BIM corporativo, logrando un Gemelo Digital en anillo cerrado.
