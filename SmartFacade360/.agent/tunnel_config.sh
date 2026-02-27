#!/bin/bash
# SmartFacade360 Secure Access Tunnel Config
# Protocol: TRL 6 Industrial Access
# Tool: localtunnel (Node.js fallback strategy as per unavailability of native binaries)

# Usage: bash .agent/tunnel_config.sh

echo "Starting secure tunnel for port 5173..."
echo "Tool: localtunnel (via npx)"
echo "Target: http://localhost:5173"

# Execute tunnel
# Note: Using '-y' ensures non-interactive installation if package missing
npx -y localtunnel --port 5173
