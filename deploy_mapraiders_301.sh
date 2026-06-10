#!/usr/bin/env bash
# =====================================================================
# Deploy: MapRaiders 301-Migration (AP1) auf Server zoro (159.69.157.42)
# Muster: DopaSpeak sprint2 deploy (Snippet -> Include -> Backup -> nginx -t -> reload -> curl)
# Ausfuehren als root AUF DEM SERVER. Vorher mapraiders_301_migration.conf hochladen:
#   scp mapraiders_301_migration.conf root@159.69.157.42:/root/
# =====================================================================
set -euo pipefail

SNIPPET_SRC="/root/mapraiders_301_migration.conf"
SNIPPET_DST="/etc/nginx/snippets/mapraiders_301_migration.conf"
SITE="/etc/nginx/sites-available/mapraiders"
STAMP=$(date +%Y%m%d_%H%M%S)

echo "== 1) Duplikat-Check gegen aktive Conf (sites-enabled sind SYMLINKS -> grep -R) =="
DUPES=0
while read -r loc; do
  if grep -RF "location = ${loc} " /etc/nginx/sites-available/ /etc/nginx/snippets/ 2>/dev/null | grep -v mapraiders_301_migration; then
    DUPES=$((DUPES+1))
  fi
done < <(grep -oP '(?<=location = )\S+' "$SNIPPET_SRC")
if [ "$DUPES" -gt 0 ]; then
  echo "ABBRUCH: ${DUPES} doppelte exact-locations gefunden (nginx -t wuerde scheitern). Erst bereinigen."
  exit 1
fi
echo "OK: keine Duplikate."

echo "== 2) Backup =="
cp -a "$SITE" "${SITE}.bak_${STAMP}"
[ -f "$SNIPPET_DST" ] && cp -a "$SNIPPET_DST" "${SNIPPET_DST}.bak_${STAMP}"
echo "Backup: ${SITE}.bak_${STAMP}"

echo "== 3) Snippet installieren =="
install -m 0644 "$SNIPPET_SRC" "$SNIPPET_DST"

echo "== 4) Include sicherstellen =="
if ! grep -qF "snippets/mapraiders_301_migration.conf" "$SITE"; then
  # Include direkt nach der ersten server_name-Zeile des mapraiders-Serverblocks einfuegen
  sed -i '0,/server_name .*mapraiders/s//&\n    include \/etc\/nginx\/snippets\/mapraiders_301_migration.conf;/' "$SITE"
  echo "Include eingefuegt."
else
  echo "Include bereits vorhanden."
fi

echo "== 5) nginx -t =="
nginx -t

echo "== 6) Reload =="
systemctl reload nginx

echo "== 7) Curl-Stichproben (Soll: 301 + korrektes Location, Ziel 200) =="
check() {
  local src="$1" want="$2"
  local code loc
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://mapraiders.com${src}")
  loc=$(curl -s -o /dev/null -w '%{redirect_url}' "https://mapraiders.com${src}")
  tgt=$(curl -s -o /dev/null -w '%{http_code}' "$loc")
  printf '%-40s %s -> %s [Ziel: %s]' "$src" "$code" "$loc" "$tgt"
  [ "$code" = "301" ] && [ "$loc" = "https://mapraiders.com${want}" ] && [ "$tgt" = "200" ] && echo "  OK" || echo "  FEHLER"
}
check "/es/"                          "/es-mx/"
check "/es"                           "/es-mx/"
check "/pt/howto/ecos.html"           "/pt-br/howto/ecos.html"
check "/zh/features/clans.html"       "/zh-cn/features/clans.html"
check "/ja/cycling-game/"             "/ja/サイクリングゲーム/"
check "/ko/dog-walking"               "/ko/강아지산책게임/"
check "/zh/尋寶遊戲/"                  "/zh-tw/尋寶遊戲/"
check "/en-in/privacy-policy/"        "/en-in/privacy.html"
check "/features/"                    "/"
# Encoded-Variante derselben Quelle (nginx dekodiert vor dem Match -> muss identisch greifen):
check "/zh/%E5%B0%8B%E5%AF%B6%E9%81%8A%E6%88%B2/"  "/zh-tw/尋寶遊戲/"

echo "== FERTIG. Danach: Stubs im Repo nach docs/_retired/ verschieben, =="
echo "== GSC-noindex-Validierung startet René manuell. =="
