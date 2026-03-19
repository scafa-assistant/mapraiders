#!/bin/bash

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping Gridwalker..."

# Stop Docker services
cd "$SCRIPT_DIR"
docker compose stop 2>/dev/null || true

# Kill any running ts-node-dev processes
pkill -f "ts-node-dev" 2>/dev/null || true

# Kill any running expo processes
pkill -f "expo start" 2>/dev/null || true

echo "[OK] All services stopped"
