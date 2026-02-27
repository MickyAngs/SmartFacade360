const http = require('http');
const httpProxy = require('http-proxy');

// --- Configuration ---
const PORT = 5174;
const TARGET = 'http://localhost:5173';
const USER = 'smartfacade';
const PASS = process.env.SECURE_PASS || 'SmartPass2026!'; // Default for testing

// --- Proxy ---
const proxy = httpProxy.createProxyServer({});

// --- Server ---
const server = http.createServer((req, res) => {
    const auth = req.headers['authorization'];

    if (!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="SmartFacade360 Secure Access"');
        res.end('Access denied');
        return;
    }

    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    const user = credentials[0];
    const pass = credentials[1];

    if (user === USER && pass === PASS) {
        proxy.web(req, res, { target: TARGET }, (e) => {
            console.error('Proxy Error:', e);
            res.statusCode = 502;
            res.end('Proxy Error');
        });
    } else {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="SmartFacade360 Secure Access"');
        res.end('Access denied');
    }
});

console.log(`🔒 Secure Proxy running on port ${PORT}`);
console.log(`   User: ${USER}`);
console.log(`   Pass: ${PASS}`);
console.log(`   Target: ${TARGET}`);
server.listen(PORT);
