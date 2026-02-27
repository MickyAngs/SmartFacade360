const { chromium } = require('playwright');

(async () => {
    try {
        console.log('Iniciando navegador...');
        const browser = await chromium.launch();
        const page = await browser.newPage();

        console.log('Navegando a localhost...');
        await page.goto('http://localhost:5173/');
        await page.waitForTimeout(4000);

        console.log('Guardando captura Inicial (Mobile)...');
        await page.screenshot({ path: 'screenshot_mobile_start.png' });

        console.log('Haciendo click en botón Expandir...');
        await page.click('button[title="Volver a Vista Completa"]');
        await page.waitForTimeout(3000);

        console.log('Guardando captura Expandida (Desktop)...');
        await page.screenshot({ path: 'screenshot_desktop_expanded.png' });

        await browser.close();
        console.log('Fin.');
    } catch (e) {
        console.error('SERVER_ERROR:', e);
    }
})();
