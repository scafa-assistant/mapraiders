#!/usr/bin/env bash
# =====================================================================
# MapRaiders Server-App Deploy mit Verifikations-Gate
# Ersetzt die alte Landmine (npm install --production + npx tsc), die bei
# fehlendem devDep-typescript leise mit Exit 0 das ALTE dist/ neu startete.
#
# Ablauf (lokal ausfuehren, Git Bash):
#   bash deploy-server.sh
#
# Gates, in dieser Reihenfolge:
#   1. lokal:  server-tsc --noEmit = 0
#   2. lokal:  master ist gepusht (origin/master == HEAD)
#   3. remote: git reset --hard origin/master (.env ist gitignored, bleibt)
#   4. remote: npm ci (VOLL, devDeps inkl. typescript)
#   5. remote: ./node_modules/.bin/tsc (kein npx-Fallback moeglich)
#   6. remote: Artefakt-Check dist/index.js neuer als Build-Start
#   7. remote: restart + localhost-Health, bei Fehler Auto-Rollback auf dist-Backup
#   8. lokal:  https-Health durch nginx als letztes Gate
# =====================================================================
set -euo pipefail

KEY="$HOME/.ssh/mapraiders-deploy/deploy_key"
HOST="root@159.69.157.42"
HEALTH_URL="https://api.mapraiders.com/api/health"

echo "== 1) Lokales tsc-Gate =="
(cd "$(dirname "$0")/server" && npx tsc --noEmit)
echo "OK: 0 Fehler."

echo "== 2) Push-Gate =="
git -C "$(dirname "$0")" fetch origin master --quiet
LOCAL=$(git -C "$(dirname "$0")" rev-parse master)
REMOTE=$(git -C "$(dirname "$0")" rev-parse origin/master)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "ABBRUCH: lokaler master ($LOCAL) != origin/master ($REMOTE). Erst pushen."
  exit 1
fi
echo "OK: origin/master = $LOCAL"

echo "== 3-7) Remote-Deploy =="
ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
STAMP=$(date +%Y%m%d_%H%M%S)
cd /opt/mapraiders
OLD_HEAD=$(git rev-parse --short HEAD)
git fetch origin master --quiet
git reset --hard origin/master --quiet
NEW_HEAD=$(git rev-parse --short HEAD)
echo "Code: $OLD_HEAD -> $NEW_HEAD"

cd server
echo "npm ci (voll, mit devDeps)..."
npm ci --no-audit --no-fund --loglevel=error

# dist-Backup fuer Rollback, alte Backups auf 3 begrenzen
if [ -d dist ]; then cp -a dist "dist.bak_${STAMP}"; fi
ls -dt dist.bak_* 2>/dev/null | tail -n +4 | xargs -r rm -rf

MARKER=$(mktemp)
# Deterministischer Full-Rebuild: tsconfig hat incremental:true, ein
# unveraenderter Tree wuerde sonst nichts emittieren und das Artefakt-Gate
# als False Positive reissen. Backup fuer Rollback liegt schon in dist.bak_*.
rm -rf dist tsconfig.tsbuildinfo
echo "tsc-Build (voll)..."
./node_modules/.bin/tsc -p tsconfig.json

if [ ! -f dist/index.js ] || [ ! dist/index.js -nt "$MARKER" ]; then
  echo "ABBRUCH: dist/index.js nicht neu gebaut (Artefakt-Gate)."
  rm -f "$MARKER"; exit 1
fi
rm -f "$MARKER"
echo "OK: Artefakt frisch."

systemctl restart mapraiders
sleep 5
if curl -fsS http://127.0.0.1:3000/api/health >/dev/null; then
  echo "OK: localhost-Health nach Restart."
else
  echo "FEHLER: Health nach Restart -> Rollback auf dist.bak_${STAMP}."
  if [ -d "dist.bak_${STAMP}" ]; then
    rm -rf dist && cp -a "dist.bak_${STAMP}" dist
    systemctl restart mapraiders
    sleep 5
    curl -fsS http://127.0.0.1:3000/api/health >/dev/null \
      && echo "Rollback OK, alter Stand laeuft wieder." \
      || echo "KRITISCH: auch Rollback-Health fehlgeschlagen, manuell eingreifen!"
  fi
  exit 1
fi
REMOTE

echo "== 8) HTTPS-Health-Gate =="
curl -fsS "$HEALTH_URL"
echo
echo "== DEPLOY OK =="
