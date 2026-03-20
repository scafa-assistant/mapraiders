#!/bin/bash
set -e

echo ""
echo "======================================"
echo "     MAPRAIDERS - First Time Setup    "
echo "======================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found. Please install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo "[OK] Docker found"

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 20+: https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js $(node -v) found"

if ! command -v npx &> /dev/null; then
    echo "ERROR: npx not found."
    exit 1
fi
echo "[OK] npx found"

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install server dependencies
echo ""
echo "Installing server dependencies..."
cd "$SCRIPT_DIR/server"
npm install
cd "$SCRIPT_DIR"

# Install mobile dependencies
echo ""
echo "Installing mobile dependencies..."
cd "$SCRIPT_DIR/mobile"
npm install
cd "$SCRIPT_DIR"

# Create .env if not exists
if [ ! -f "$SCRIPT_DIR/server/.env" ]; then
    echo ""
    echo "Creating server .env file..."
    cat > "$SCRIPT_DIR/server/.env" << 'ENVEOF'
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgresql://mapraiders:mapraiders_dev@localhost:5432/mapraiders
REDIS_URL=redis://localhost:6379
JWT_SECRET=mapraiders-dev-secret-change-in-production
JWT_REFRESH_SECRET=mapraiders-dev-refresh-secret-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=*
WEATHER_CACHE_MINUTES=15
CDN_BASE_URL=http://localhost:3000/uploads
ENVEOF
    echo "[OK] .env created"
else
    echo ""
    echo "[OK] server/.env already exists, skipping"
fi

echo ""
echo "======================================"
echo "        Setup complete!               "
echo "                                      "
echo "  Next: Run ./start.sh                "
echo "======================================"
