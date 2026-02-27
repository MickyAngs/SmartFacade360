# SmartFacade360 – Guía de Despliegue Express (PROTTOM Hito 1)

**Demo lista en 3 comandos – Probado en entorno local Trujillo**

Este documento proporciona las instrucciones críticas para levantar el entorno de evaluación TRL 5 de SmartFacade360 en menos de 10 minutos.

## 🚀 Requisitos Previos
- Node.js versión 20 o superior.
- Una cuenta gratuita en Supabase (para orquestar la BD y Auth).
- 500 MB libres en disco.

## 🛠️ Despliegue en 3 Comandos

1. **Instalación de Dependencias:**
   ```bash
   npm install
   ```
2. **Configuración de Bóveda de Datos (Soberanía):**
   ```bash
   cp .env.example .env.local
   ```
   *Nota:* Abre el archivo `.env.local` recién creado e inyecta tus credenciales de Supabase (URL y Anon Key). Esto garantiza el aislamiento del tenant (Ley 29733).
   
3. **Arranque del Motor Ciberfísico:**
   ```bash
   npm run dev
   ```

## 👁️‍🗨️ Verificación de Integridad
Una vez ejecutado, el Gemelo Digital y el Dashboard de control estarán operativos en:
👉 `http://localhost:5173/`

*(Para una simulación completa, navegue al dashboard inyectando el UUID test configuration en la UI).*

---
**Firmado y validado:** Equipo de Ingeniería SmartFacade360.
