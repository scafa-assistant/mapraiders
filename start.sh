#!/bin/bash
set -e

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "======================================"
echo "       GRIDWALKER - Starting...       "
echo "======================================"
echo ""

# Detect local IP for mobile app
detect_ip() {
    # Windows (Git Bash / MSYS)
    if command -v ipconfig &> /dev/null; then
        # Try Wi-Fi / Wireless first, then Ethernet, then any IPv4
        local ip
        ip=$(ipconfig | grep -A 5 "Wireless\|Wi-Fi" | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
        if [ -z "$ip" ]; then
            ip=$(ipconfig | grep -A 5 "Ethernet" | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
        fi
        if [ -z "$ip" ]; then
            ip=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
        fi
        echo "$ip"
    # macOS
    elif command -v ifconfig &> /dev/null; then
        ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'
    # Linux
    else
        hostname -I | awk '{print $1}'
    fi
}

LOCAL_IP=$(detect_ip)
if [ -z "$LOCAL_IP" ]; then
    echo "WARNING: Could not detect local IP. Falling back to localhost."
    LOCAL_IP="localhost"
fi
echo "Local IP: $LOCAL_IP"
echo ""

# Update mobile API base URL to use local IP
echo "Configuring mobile app to connect to $LOCAL_IP:3000..."

# Create env file for expo
cat > "$SCRIPT_DIR/mobile/.env.local" << EOF
EXPO_PUBLIC_API_URL=http://$LOCAL_IP:3000/api
EXPO_PUBLIC_WS_URL=ws://$LOCAL_IP:3000
EOF

# Patch api.ts - replace the dev URL with the detected IP
API_TS="$SCRIPT_DIR/mobile/src/services/api.ts"
if grep -q "http://localhost:3000/api" "$API_TS" 2>/dev/null; then
    sed -i "s|http://localhost:3000/api|http://$LOCAL_IP:3000/api|g" "$API_TS"
    echo "[OK] API URL updated to http://$LOCAL_IP:3000/api"
elif grep -q "http://.*:3000/api" "$API_TS" 2>/dev/null; then
    # Already patched with a previous IP, update it
    sed -i "s|http://[0-9.]*:3000/api|http://$LOCAL_IP:3000/api|g" "$API_TS"
    echo "[OK] API URL updated to http://$LOCAL_IP:3000/api"
fi

# Patch websocket.ts - replace the dev URL with the detected IP
WS_TS="$SCRIPT_DIR/mobile/src/services/websocket.ts"
if grep -q "ws://localhost:3000" "$WS_TS" 2>/dev/null; then
    sed -i "s|ws://localhost:3000|ws://$LOCAL_IP:3000|g" "$WS_TS"
    echo "[OK] WebSocket URL updated to ws://$LOCAL_IP:3000"
elif grep -q "ws://.*:3000" "$WS_TS" 2>/dev/null; then
    # Already patched with a previous IP, update it
    sed -i "s|ws://[0-9.]*:3000|ws://$LOCAL_IP:3000|g" "$WS_TS"
    echo "[OK] WebSocket URL updated to ws://$LOCAL_IP:3000"
fi

# Start Docker services
echo ""
echo "Starting Docker services (PostgreSQL + Redis)..."
cd "$SCRIPT_DIR"
docker compose up -d postgres redis

# Wait for DB to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U gridwalker > /dev/null 2>&1; do
    sleep 1
done
echo "[OK] PostgreSQL ready"

echo "Waiting for Redis to be ready..."
until docker compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo "[OK] Redis ready"

# Cleanup function
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $SERVER_PID 2>/dev/null || true
    cd "$SCRIPT_DIR"
    docker compose stop
    echo "Done."
}
trap cleanup EXIT INT TERM

# Start server in background
echo ""
echo "Starting Gridwalker server..."
cd "$SCRIPT_DIR/server"
npx ts-node-dev --respawn --transpile-only src/index.ts &
SERVER_PID=$!
cd "$SCRIPT_DIR"

# Wait for server to be ready
echo "Waiting for server..."
for i in {1..30}; do
    if curl -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
        break
    fi
    sleep 1
done
echo "[OK] Server running on http://$LOCAL_IP:3000"

# Print status
echo ""
echo "=========================================================="
echo "  GRIDWALKER IS RUNNING!                                  "
echo "                                                          "
echo "  API:        http://$LOCAL_IP:3000/api                   "
echo "  WebSocket:  ws://$LOCAL_IP:3000                         "
echo "  Database:   localhost:5432                               "
echo "  Redis:      localhost:6379                               "
echo "                                                          "
echo "  Scan the QR code below with Expo Go                     "
echo "                                                          "
echo "  Test Login:                                             "
echo "    Email: walker@test.com                                "
echo "    Password: test1234                                    "
echo "                                                          "
echo "  Press Ctrl+C to stop everything                         "
echo "=========================================================="
echo ""

# Start Expo (foreground - this blocks until user exits)
cd "$SCRIPT_DIR/mobile"
# Clear Metro cache to avoid node:sea path issue on Windows with Node 24+
rm -rf .expo 2>/dev/null
export NODE_OPTIONS="--no-experimental-sea-config"
npx expo start --host lan --clear
