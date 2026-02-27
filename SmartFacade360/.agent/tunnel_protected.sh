#!/bin/bash
# SmartFacade360 Secure Tunnel Config
# Protocol: TRL 6 Industrial Access (Protected)
# Tool: localtunnel (public) + Local Node.js Basic Auth Proxy (private)

# Usage: bash .agent/tunnel_protected.sh

# 1. Start Local Secure Proxy (Background)
# Forward 5174 -> 5173 with Basic Auth
export SECURE_PASS="SmartPass2026!" 
# Note: In a real shell execution, you might need to run: node .agent/server-secure-pure.js &
# But for this script acting as documentation/alias:

echo "Starting Secure Proxy on 5174..."
# We assume node server is running or started here. 
# For reproduction:
# node .agent/server-secure-pure.js > .agent/proxy.log 2>&1 &

# 2. Start Tunnel pointing to Secure Proxy (5174)
echo "Starting secure tunnel for port 5174..."
echo "Target: http://localhost:5174 (Protected)"
echo "Credentials: smartfacade / $SECURE_PASS"
echo "Tunnel Password (IP): $(curl -s https://loca.lt/mytunnelpassword)"

# Execute tunnel
npx -y localtunnel --port 5174 --subdomain sf360-protected-trl6
