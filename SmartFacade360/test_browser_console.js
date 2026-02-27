const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.error('BROWSER ERROR:', error));

    console.log('Navigating to http://localhost:5173/dashboard/test-id ...');
    await page.goto('http://localhost:5173/dashboard/test-id', { waitUntil: 'networkidle' });

    console.log('Page loaded. Checking for root element...');
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML = '');
    console.log('Root HTML length:', rootHtml?.length);

    await browser.close();
})();
