import fs from 'fs';
import path from 'path';

interface CheckStatus {
    exists: boolean;
    valid: boolean;
    size_bytes: number;
}

const requiredFiles = [
    'FINAL_SUBMISSION_PROTTOM/01_DOCUMENTACION_TECNICA/MANUAL_TECNOLOGICO_SF360.md',
    'FINAL_SUBMISSION_PROTTOM/01_DOCUMENTACION_TECNICA/INTEROPERABILITY_CERTIFICATE.md',
    'FINAL_SUBMISSION_PROTTOM/01_DOCUMENTACION_TECNICA/BIM_COMPLIANCE.md',
    'FINAL_SUBMISSION_PROTTOM/02_EVIDENCIA_VALIDACION/KPI_REPORT.json',
    'FINAL_SUBMISSION_PROTTOM/02_EVIDENCIA_VALIDACION/TRL5_EVIDENCE_LOG.md',
    'FINAL_SUBMISSION_PROTTOM/03_PITCH_Y_TRANSFERENCIA/PITCH_DECK_ESTRATEGICO.md',
    'FINAL_SUBMISSION_PROTTOM/03_PITCH_Y_TRANSFERENCIA/DEPLOYMENT_GUIDE.md',
    'DOCS/VIDEO_DEMO_SCRIPT.md',
    'README_PROTTOM.md',
    'LICENSE'
];

async function verifyDossier() {
    const root = process.cwd();
    let allPassed = true;
    const details: Record<string, CheckStatus> = {};

    for (const file of requiredFiles) {
        const filePath = path.join(root, file);
        const result: CheckStatus = { exists: false, valid: false, size_bytes: 0 };

        if (fs.existsSync(filePath)) {
            result.exists = true;
            const stat = fs.statSync(filePath);
            result.size_bytes = stat.size;

            // Basic validation: Not totally empty
            if (stat.size > 20) {
                result.valid = true;
            } else {
                result.valid = false;
                allPassed = false;
            }
        } else {
            allPassed = false;
        }

        details[file] = result;
    }

    const output = {
        status: allPassed ? 'pass' : 'fail',
        timestamp: new Date().toISOString(),
        details
    };

    console.log(JSON.stringify(output, null, 2));

    if (!allPassed) {
        process.exit(1);
    }
}

verifyDossier().catch(err => {
    console.error(err);
    process.exit(1);
});
