#!/usr/bin/env bash
# =====================================================================
# Deploy: MapRaiders 301-Migration (AP1) auf Server zoro (159.69.157.42)
# v3: Duplikat-Check nur mapraiders-Scope; Include via sed a\ (zerschneidet
#     keine Zeilen mehr); Auto-Rollback bei nginx -t-Fehler.
# Ausfuehren als root AUF DEM SERVER:
#   bash /root/deploy_mapraiders_301.sh
# =====================================================================
set -euo pipefail

SNIPPET_SRC="/root/mapraiders_301_migration.conf"
SNIPPET_DST="/etc/nginx/snippets/mapraiders_301_migration.conf"
SITE="/etc/nginx/sites-available/mapraiders"
STAMP=$(date +%Y%m%d_%H%M%S)

echo "== 1) Duplikat-Check NUR gegen den mapraiders-Serverblock =="
SCOPE_FILES="$SITE"
while read -r inc; do
  [ -f "$inc" ] && [ "$inc" != "$SNIPPET_DST" ] && SCOPE_FILES="$SCOPE_FILES $inc"
done < <(grep -oP '(?<=include )\S+(?=;)' "$SITE" 2>/dev/null || true)
echo "Pruefe gegen: $SCOPE_FILES"
DUPES=0
while read -r loc; do
  if grep -HF "location = ${loc} " $SCOPE_FILES 2>/dev/null; then
    DUPES=$((DUPES+1))
  fi
done < <(grep -oP '(?<=location = )\S+' "$SNIPPET_SRC")
if [ "$DUPES" -gt 0 ]; then
  echo "ABBRUCH: ${DUPES} doppelte exact-locations im mapraiders-Scope."
  exit 1
fi
echo "OK: keine Duplikate."

echo "== 2) Backup =="
cp -a "$SITE" "${SITE}.bak_${STAMP}"
echo "Backup: ${SITE}.bak_${STAMP}"

echo "== 3) Snippet installieren =="
install -m 0644 "$SNIPPET_SRC" "$SNIPPET_DST"

echo "== 4) Include sicherstellen =="
if ! grep -qF "snippets/mapraiders_301_migration.conf" "$SITE"; then
  sed -i '/server_name[[:space:]].*mapraiders/a\    include /etc/nginx/snippets/mapraiders_301_migration.conf;' "$SITE"
  echo "Include eingefuegt:"
  grep -n "mapraiders_301_migration" "$SITE"
else
  echo "Include bereits vorhanden."
fi

echo "== 5) nginx -t =="
if ! nginx -t; then
  echo "FEHLER bei nginx -t -> Rollback auf Backup."
  cp -a "${SITE}.bak_${STAMP}" "$SITE"
  nginx -t
  exit 1
fi

echo "== 6) Reload =="
systemctl reload nginx

echo "== 7) Curl-Stichproben (Soll: 301 -> korrektes Ziel -> 200) =="
FAIL=0
check() {
  src="$1"; want="$2"
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://mapraiders.com${src}")
  loc=$(curl -s -o /dev/null -w '%{redirect_url}' "https://mapraiders.com${src}")
  tgt=$(curl -s -o /dev/null -w '%{http_code}' "$loc")
  if [ "$code" = "301" ] && [ "$loc" = "https://mapraiders.com${want}" ] && [ "$tgt" = "200" ]; then
    echo "OK      ${src} -> ${loc} [${tgt}]"
  else
    echo "FEHLER  ${src} : code=${code} location=${loc} ziel=${tgt} (erwartet ${want})"
    FAIL=$((FAIL+1))
  fi
}
check "/es/"                    "/es-mx/"
check "/es"                     "/es-mx/"
check "/pt/howto/ecos.html"     "/pt-br/howto/ecos.html"
check "/zh/features/clans.html" "/zh-cn/features/clans.html"
check "/en-in/privacy-policy/"  "/en-in/privacy.html"
check "/features/"              "/"
check "/zh/尋寶遊戲/"            "/zh-tw/尋寶遊戲/"
check "/zh/%E5%B0%8B%E5%AF%B6%E9%81%8A%E6%88%B2/" "/zh-tw/尋寶遊戲/"
check "/ja/cycling-game/"       "/ja/サイクリングゲーム/"
check "/ko/dog-walking"         "/ko/강아지산책게임/"

echo "== FERTIG: ${FAIL} Fehler. =="
exit "$FAIL"
