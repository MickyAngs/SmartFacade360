const { chromium } = require('playwright');

(async () => {
    try {
        console.log('Iniciando navegador...');
        const browser = await chromium.launch();
        const page = await browser.newPage();

        page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
        page.on('pageerror', err => console.error('BROWSER_FATAL_ERROR:', err));

        console.log('Navegando a localhost...');
        await page.goto('http://localhost:5173/');
        await page.waitForTimeout(4000);

        console.log('Haciendo click en botón de Vista Celular...');
        await page.click('button[title="Previsualizar todo en Móvil"]');
        await page.waitForTimeout(3000);

        console.log('Guardando captura...');
        await page.screenshot({ path: 'screenshot_mobile_global.png' });

        await browser.close();
        console.log('Fin.');
    } catch (e) {
        console.error('SERVER_ERROR:', e);
    }
})();
