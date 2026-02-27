const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    let logOutput = "";
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();

        page.on('console', msg => {
            logOutput += `[CONSOLE_${msg.type().toUpperCase()}] ${msg.text()}\n`;
        });
        page.on('pageerror', error => {
            logOutput += `\n========== FATAL ERROR ==========\nMESSAGE: ${error.message}\nSTACK: ${error.stack}\n=================================\n`;
        });

        logOutput += "Navegando a http://localhost:5173/...\n";
        await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 15000 });

        // Give it 10 seconds to fully render React 3D Fiber and catch the ErrorBoundary output
        await page.waitForTimeout(10000);

        const bodyHtml = await page.evaluate(() => document.body.innerHTML);
        logOutput += `\n[BODY_HTML]\n${bodyHtml}\n`;

        fs.writeFileSync('browser_log.txt', logOutput);
        await browser.close();
        console.log("Log saved to browser_log.txt");
    } catch (err) {
        fs.writeFileSync('browser_log.txt', logOutput + '\n[NODE_ERROR] ' + err.message);
        console.log("Error saved to browser_log.txt");
    }
})();
