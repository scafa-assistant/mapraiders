#!/bin/bash
set -e

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "======================================"
echo "     GRIDWALKER - Build APK           "
echo "======================================"
echo ""

# Detect local IP (same as start.sh)
detect_ip() {
    if command -v ipconfig &> /dev/null; then
        local ip
        ip=$(ipconfig | grep -A 5 "Wireless\|Wi-Fi" | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
        if [ -z "$ip" ]; then
            ip=$(ipconfig | grep -A 5 "Ethernet" | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
        fi
        if [ -z "$ip" ]; then
            ip=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}' | tr -d '\r')
        fi
        echo "$ip"
    elif command -v ifconfig &> /dev/null; then
        ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'
    else
        hostname -I | awk '{print $1}'
    fi
}

LOCAL_IP=$(detect_ip)
echo "Local IP: $LOCAL_IP"
echo ""

echo "Choose build method:"
echo "  1) EAS Cloud Build (recommended, no local setup needed)"
echo "  2) Local build (requires Android SDK + Java)"
echo ""
read -p "Enter choice (1 or 2): " BUILD_CHOICE

if [ "$BUILD_CHOICE" = "1" ]; then
    echo ""
    echo "Building with EAS..."

    # Check if eas-cli is installed
    if ! command -v eas &> /dev/null; then
        echo "Installing EAS CLI..."
        npm install -g eas-cli
    fi

    cd "$SCRIPT_DIR/mobile"

    # Create eas.json if not exists
    if [ ! -f eas.json ]; then
        cat > eas.json << 'EASEOF'
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
EASEOF
        echo "[OK] eas.json created"
    fi

    echo ""
    echo "NOTE: You may need to login first with: eas login"
    echo ""
    eas build --platform android --profile preview

elif [ "$BUILD_CHOICE" = "2" ]; then
    echo ""
    echo "Building locally..."

    cd "$SCRIPT_DIR/mobile"
    npx expo prebuild --platform android

    cd android
    ./gradlew assembleRelease

    echo ""
    echo "[OK] APK built at: mobile/android/app/build/outputs/apk/release/app-release.apk"
else
    echo "Invalid choice. Please enter 1 or 2."
    exit 1
fi
