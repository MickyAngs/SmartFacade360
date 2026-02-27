import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';

interface ExportButtonProps {
    buildingId: string;
    organizationId?: string;
}

export default function ExportButton({ buildingId, organizationId }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading('Generando Certificado PROTTOM (ISO 27037)...');

        try {
            // Llama al endpoint de Next.js que consolida la data y genera el PDF firmado (SHA-256)
            const response = await fetch('/api/v1/report/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ buildingId, organizationId })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Fallo en la generación del reporte.');
            }

            // Descarga el buffer generado en el servidor
            const blob = await response.blob();
            saveAs(blob, `informe_prottom_${buildingId}.pdf`);

            toast.success('Informe Ejecutivo PROTTOM descargado.', { id: toastId });
        } catch (error: any) {
            console.error('Export Error:', error);
            toast.error(error.message || 'Error en validación ISO 27037', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            aria-label="Descargar informe ejecutivo PROTTOM"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-all text-sm font-medium text-white shadow-[0_0_20px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)]"
        >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Generando PDF...' : 'Exportar Informe PROTTOM'}
        </button>
    );
}
