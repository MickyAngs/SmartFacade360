import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { Builder } from 'xml2js';

// Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request, context: { params: { findingId: string } }) {
    const { findingId } = await context.params;

    try {
        // En entorno real, validar sesión de usuario por Auth
        // Fetch el Finding
        const { data: finding, error: findError } = await supabase
            .from('findings')
            .select(`
                *,
                inspections ( building_id )
            `)
            .eq('id', findingId)
            .single();

        if (findError || !finding) {
            return NextResponse.json({ error: 'Finding no encontrado o sin acceso.' }, { status: 404 });
        }

        const guid = crypto.randomUUID();
        const now = new Date().toISOString();

        // 1. Iniciar Zip Container
        const zip = new JSZip();

        // Archivo de Versionamiento BCF
        zip.file('bcf.version', '2.1');

        // Directorio del Issue
        const issueFolder = zip.folder(guid);
        if (!issueFolder) throw new Error("Fallo creando directorio BCF");

        // 2. Generar Markup XML
        const builder = new Builder({ headless: true });

        const markupObj = {
            Markup: {
                Topic: {
                    '@Guid': guid,
                    '@TopicType': 'Issue',
                    '@TopicStatus': 'Open',
                    Title: `Hallazgo SF360: ${finding.pathology_type.toUpperCase()}`,
                    CreationDate: now,
                    CreationAuthor: 'SmartFacade360 AI',
                    Description: `Desviación: ${finding.metric_deviation.toFixed(2)} mm. Referencia: ${finding.nte_reference || 'NTE E.060'}. Nivel de Severidad: ${finding.severity_level.toUpperCase()}.`
                },
                Comment: {
                    '@Guid': crypto.randomUUID(),
                    Date: now,
                    Author: 'SF360 Auditoria Automatizada',
                    Comment: `Evidencia Ciberfísica exportada desde Command Center PROTTOM. Cumplimiento ISO 19650 en curso.`
                }
            }
        };
        const markupXml = builder.buildObject(markupObj);
        issueFolder.file('markup.bcf', markupXml);

        // 3. Generar Viewpoint XML (Datos Espaciales Mapeados)
        // Parsear JSON de coordinates (ej: { x: 5, y: 10, z: -2 })
        const coords = finding.coordinates && typeof finding.coordinates === 'string'
            ? JSON.parse(finding.coordinates)
            : { x: 0, y: 0, z: 0 };

        const viewpointObj = {
            VisualizationInfo: {
                '@Guid': crypto.randomUUID(),
                Components: {
                    // Si existiera un GUID BIM real mapeado de spatial_assets, se incluiría aquí
                    Component: {
                        '@IfcGuid': finding.bim_element_uuid || crypto.randomUUID()
                    }
                },
                OrthogonalCamera: {
                    CameraViewPoint: { X: coords.x, Y: coords.y, Z: coords.z + 5 },
                    CameraDirection: { X: 0, Y: 0, Z: -1 },
                    CameraUpVector: { X: 0, Y: 1, Z: 0 },
                    ViewToWorldScale: 1
                }
            }
        };
        const viewpointXml = builder.buildObject(viewpointObj);
        issueFolder.file('viewpoint.bcfv', viewpointXml);

        // Opcional Placeholder Snapshot
        // Revit agradece tener un preview, aunque sea un 1x1 base64 png
        const blankSnapshotBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        issueFolder.file('snapshot.png', blankSnapshotBase64, { base64: true });

        // 4. Generar Buffer y Enviar Respuesta
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        return new Response(zipBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="sf360_issue_${findingId}.bcfzip"`,
            }
        });

    } catch (error: any) {
        console.error('BCF Export Error:', error);
        return NextResponse.json({ error: 'Error interno generando BCF (ISO 19650): ' + error.message }, { status: 500 });
    }
}
