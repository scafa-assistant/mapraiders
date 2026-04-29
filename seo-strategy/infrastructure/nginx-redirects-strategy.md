# nginx-Redirect-Strategie für Phase-0c-Migrations

**Erstellt:** 2026-04-29
**Branch:** `phase0c-migrations`
**Server:** zoro (159.69.157.42), nginx 1.24.0 (Ubuntu)

---

## Strategie: Hybrid Stubs + nginx-Fallback

Für jeden Slug-Migration (PT → PT-BR, ES → ES-MX, ZH → ZH-CN) verwenden wir ein
**zweistufiges System** aus Phase J:

### Stufe 1 — HTML-Stub (in Repo, primär SEO-relevant)

Jede alte Page wird zu einem **noindex,follow Redirect-Stub**:

```html
<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="https://mapraiders.com/pt-br/{NEUER-SLUG}">
  <meta http-equiv="refresh" content="0; url=/pt-br/{NEUER-SLUG}">
  <title>Redirect</title>
</head>
<body>
  <p>This page has moved to <a href="/pt-br/{NEUER-SLUG}">/pt-br/{NEUER-SLUG}</a></p>
</body>
</html>
```

**Vorteile:**
- ✅ Funktioniert ohne nginx-Änderung
- ✅ SEO-sicher (Google folgt 0-Sekunden-Refresh = soft 301)
- ✅ Reproduzierbar via Skript
- ✅ Konsistent mit Phase-J Pattern (`_apply_killer_slugs.py`)

### Stufe 2 — nginx-Fallback (in `/etc/nginx/sites-enabled/mapraiders`)

Für **unbekannte** alte Slugs (nicht als Stub im Repo) ergänzen wir nginx:

```nginx
# Phase-0c Slug-Migration-Catchall (alte Pfade ohne Stub)
location ~ ^/pt/(?!.*\.html$|/$) {
    return 301 /pt-br/;
}
location ~ ^/es/(?!.*\.html$|/$) {
    return 301 /es-mx/;
}
location ~ ^/zh/(?!.*\.html$|/$) {
    return 301 /zh-cn/;
}
```

**Wichtig:** Diese Regeln nur aktivieren NACH der Migration, nicht vorher.

---

## Aktuelle nginx-Config (Baseline)

```nginx
server {
    listen 443 ssl;
    server_name mapraiders.com www.mapraiders.com;

    ssl_certificate /etc/letsencrypt/live/mapraiders.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mapraiders.com/privkey.pem;

    root /opt/mapraiders/docs;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 404 /404.html;
}
```

**Beobachtung:** `try_files $uri $uri/ /index.html;` ist React-Fallback. Für statische
HTML-Pages mit eigenen Slugs sollten 404er wirklich 404er werden. Aber: aktuelle
Konfig funktioniert für unsere Stubs (jeder Slug-File existiert).

---

## Migrations-Reihenfolge (Pilot-First)

| # | Migration | Pages | Test-Schwierigkeit |
|---|---|---|---|
| 1 | **PT-Split** (Pilot) | 28 | mittel — Vokabular-Subset |
| 2 | **ES-Split** | ~28 | mittel |
| 3 | **ZH-Split** | ~38 | hoch — Simplified vs Traditional |
| 4 | **EN-IN-Create** | ~25 (von /en/ kopieren) | hoch |
| 5 | **ID-Create** | ~30 (komplett neu) | sehr hoch |

---

## Pilot: PT-Split

### Slug-Mapping (nach `02_PT-BR_FINAL_MASTER_PLAN.md`)

| Alt (`/pt/`) | Neu (`/pt-br/`) | Begründung |
|---|---|---|
| `index.html` | `index.html` | gleich |
| `sobre.html` | `sobre.html` | gleich |
| `app-social-outdoor.html` | `app-social-outdoor.html` | gleich |
| `alternativa-redes-sociais.html` | `alternativa-redes-sociais.html` | gleich |
| `jogo-geolocalizacao.html` | `jogo-de-gps.html` | BR-Vokabular |
| `jogo-territorio.html` | `jogo-de-territorio.html` | + Artikel |
| `passeio-cao/` | `passear-cachorro/` | BR sagt "passear cachorro" |
| `jogo-corrida/` | `app-corrida/` | BR sagt "app corrida" |
| `cacada-tesouro/` | `caca-ao-tesouro/` | BR-Schreibweise |
| `explorador-urbano/` | `explorar-cidade/` | BR-Phrase |
| `fitness-mmo/` | `fitness-mmo/` | gleich |
| `jogo-ciclismo/` | `pedalar-jogo/` | BR sagt "pedalar" |
| `bairro/` | `bairro/` | gleich |
| `audio-graffiti/` | `audio-graffiti/` | gleich |
| `vs/pokemon-go.html` | `vs/pokemon-go.html` | gleich |
| `vs/ingress.html` | `vs/ingress.html` | gleich |
| `vs/geocaching.html` | `vs/geocaching.html` | gleich |
| `features/*` | `features/*` | gleich |
| `howto/*` | `howto/*` | gleich |

### Skript-Schritte (`_apply_pt_split.py`)

1. **Lese** alle `/pt/**/*.html`-Files
2. **Kopiere** unter `/pt-br/` mit neuen Slugs (Mapping aus Tabelle)
3. **Ersetze** in den kopierten Files: alle `/pt/` Links → `/pt-br/`, alle PT-PT-Vokabel → BR-Vokabel
4. **Update** `<html lang="pt-BR">` (statt `pt`)
5. **Update** Schema.org `inLanguage: "pt-BR"`
6. **Update** hreflang-Tags weltweit (in allen 13 Sprachen) — `pt` → `pt-BR`
7. **Wandle** Original-`/pt/`-Files in noindex,follow Redirect-Stubs
8. **Erstelle** `sitemap-pt-br.xml`, lasse `sitemap-pt.xml` mit nur Stub-URLs
9. **Update** `sitemap.xml` Index → enthält jetzt `sitemap-pt-br.xml`

### Pre-Deploy-Checkliste

- [ ] `_apply_pt_split.py` lokal ausführen
- [ ] `git diff` per Sprache prüfen — Änderungen plausibel?
- [ ] `python -m http.server 8000` lokal — alle PT-BR-URLs erreichbar?
- [ ] PT-Stubs reduzieren auf `<meta http-equiv="refresh">` — Redirect funktioniert?
- [ ] Internal Links: keine `/pt/` mehr in HTML-Files?
- [ ] hreflang: `pt-BR` in allen 13 Sprachen statt `pt`?

### Wenn Pre-Test OK

```bash
git checkout master
git merge phase0c-migrations
git push origin master
# Auto-Deploy triggert → /opt/mapraiders aktualisiert → Live
```

### Wenn Pre-Test failed

```bash
git checkout master  # zurück zu funktionierendem Stand
git branch -D phase0c-migrations  # Test-Branch löschen
# Neue Branch + nochmal probieren
```

---

## SEO-Risiken + Mitigation

| Risiko | Mitigation |
|---|---|
| **Google indexiert noch alte URLs** | Stubs liefern `noindex,follow` + `canonical` → Google folgt zu neuer URL |
| **301-Chain (multiple Redirects)** | Stubs verlinken DIREKT auf finale URL, keine Zwischenstationen |
| **Backlinks zeigen auf alte URLs** | Stubs leben mind. 12 Monate weiter (bis Google fully transitioned) |
| **hreflang-Inkonsistenz** | Skript updated alle 13 Sprachen synchron |
| **Doppelter Content (alt + neu)** | Stubs sind `noindex` → kein Duplicate-Penalty |
| **Sitemap-Drift** | Skript erzeugt neue sitemap, alte wird ignoriert |
