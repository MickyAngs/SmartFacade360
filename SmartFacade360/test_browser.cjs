const { chromium } = require('playwright');

(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();

        // Capturamos TODOS los errores y logs
        page.on('console', msg => {
            console.log(`[BROWSER_CONSOLE_${msg.type().toUpperCase()}]`, msg.text());
        });
        page.on('pageerror', error => {
            console.error('[BROWSER_FATAL_ERROR]', error.message, error.stack);
        });

        console.log('Navegando a Vite localhost...');
        const response = await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 15000 });

        console.log('Status de respuesta:', response?.status());

        // Retrasar para asegurar que el JS de Vite se ejecute
        await page.waitForTimeout(3000);

        const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'ROOT_EMPTY');
        const bodyHtml = await page.evaluate(() => document.body.innerHTML);

        console.log('[ROOT HTML LENGTH]:', rootHtml.length);
        if (rootHtml === 'ROOT_EMPTY' || rootHtml.length === 0) {
            console.log('[BODY HTML PREVIEW]:', bodyHtml.substring(0, 500));
        }

        await browser.close();
    } catch (err) {
        console.error('[NODE_ERROR]', err);
    }
})();
