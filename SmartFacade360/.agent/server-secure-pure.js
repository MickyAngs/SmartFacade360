import http from 'node:http';
import { Buffer } from 'node:buffer';

// --- Configuration ---
const PORT = 5174;
const TARGET_HOST = 'localhost';
const TARGET_PORT = 5173;
const USER = 'smartfacade';
// Default password if env var not set
const PASS = process.env.SECURE_PASS || 'SmartPass2026!';

// --- Secure Proxy ---
const server = http.createServer((req, res) => {
    // 1. Basic Auth Check
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

    if (user !== USER || pass !== PASS) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="SmartFacade360 Secure Access"');
        res.end('Access denied');
        return;
    }

    // 2. Proxy Logic (Pure Node)
    const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    // Pipe request body to proxy request
    req.pipe(proxyReq, { end: true });

    proxyReq.on('error', (e) => {
        console.error('Proxy Error:', e.message);
        res.statusCode = 502;
        res.end('Proxy Error: Target frontend not running?');
    });

});

console.log(`🔒 Secure Proxy running on port ${PORT}`);
console.log(`   User: ${USER}`);
console.log(`   Target: http://${TARGET_HOST}:${TARGET_PORT}`);
server.listen(PORT);
