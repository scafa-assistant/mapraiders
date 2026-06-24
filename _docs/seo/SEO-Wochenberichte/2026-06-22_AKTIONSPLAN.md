# Aktionsplan SEO-Portfolio · 22.06.2026

**Kontext:** Abschluss des Wochenmonitorings. Ein P0-Fire (mapraiders.com Cert), zwei echte Wins zum Mitnehmen, Rest parken. Ruthless priorisiert: erst das, was sonst alles andere wertlos macht.

---

## Was zuerst bricht (die ehrliche Reihenfolge)

mapraiders.com liefert in echten Browsern einen TLS-Zertifikatsfehler. Solange das steht, ist jede andere SEO-Arbeit Makulatur: Googlebot wird die Seite innerhalb von Tagen nicht mehr fehlerfrei crawlen, die aktuell 544 indexierten Seiten fallen dann nach und nach raus, Rankings brechen. Die GSC zeigt heute noch grün (Crawl-Fenster ist ~90 Tage, läuft also nach). Der Schaden ist real, nur noch nicht in den Zahlen. **Erst Cert fixen, dann der Rest.**

Diagnose-Stand (belastbar, ~95 %): mapraiders.com läuft NICHT auf GitHub Pages (die `docs/CNAME` ist eine Altlast). Live serviert ein **nginx auf dem Hetzner-VPS** den `docs/`-Build, TLS via **certbot/Let's Encrypt** (`deploy.yml` = "Deploy to Hetzner"; DEPLOYMENT.md bestätigt nginx+certbot). egons.io liegt auf derselben Box und lädt sauber, der certbot-Timer ist also nicht serverweit tot. Das Problem ist das **mapraiders.com-Zertifikat speziell**: klassischer Fall einer fehlgeschlagenen/abgelaufenen Let's-Encrypt-Erneuerung (90-Tage-Cert). Nachsichtige HTTP-Clients verbinden noch, Chrome/Safari verweigern.

---

## P0 — HEUTE, René, ~5 Minuten (kann ich nicht selbst, Prod-Server)

SSH auf den Hetzner-VPS (Zugang steht in DEPLOYMENT.md), dann:

```bash
# 1. Diagnose: welcher Cert, welches Ablaufdatum?
certbot certificates

# 2. Erneuern (erst normal, bei "not due for renewal" forcen)
certbot renew
#   falls nötig:
certbot renew --force-renewal --cert-name mapraiders.com
#   falls Cert für die Domain ganz fehlt (nginx-vhost prüfen):
certbot --nginx -d mapraiders.com -d www.mapraiders.com

# 3. nginx neu laden
nginx -t && systemctl reload nginx

# 4. Warum ist die Auto-Erneuerung gescheitert?
systemctl status certbot.timer
systemctl list-timers | grep certbot
```

**Verifikation nach dem Fix:** `https://mapraiders.com/` und `https://mapraiders.com/es/` (muss auf `/es-mx/` → 200) in Chrome ohne Warnung laden. Sag Bescheid, dann prüfe ich beide Stichproben sofort gegen.

---

## P1 — diese Woche (Wins, die kompoundieren)

**1. Wiederholung unmöglich machen (der eigentliche Bug).** Das Ablaufen ist nur das Symptom, der Bug ist die still gescheiterte Erneuerung. Zwei Maßnahmen:
- certbot-Timer reparieren/aktivieren (`systemctl enable --now certbot.timer`) und Renew-Hook setzen, der nginx automatisch reloadet (`--deploy-hook "systemctl reload nginx"`).
- Unabhängiges Cert-Monitoring: Der `deploy.yml`-Verify-Step prüft nur bei docs/-Deploys (deshalb hat ihn niemand bemerkt). Einen wöchentlichen Cert-Ablauf-Check einrichten, der unabhängig vom Deploy läuft. Kann ich als kleinen Check ins SEO-Wochenmonitoring aufnehmen (Browser-Live-Check auf Cert-Warnung pro Property), sodass ein Cert-Problem ab sofort sofort auffällt, nicht erst beim Ausfall.

**2. GSC-Validierungen nachhalten.** mapraiders (404, Duplikat-Canonical) und dopaspeak (404) stehen seit dieser Woche wieder auf "Gestartet". In 1 bis 2 Wochen kontrollieren, ob sie auf "Bestanden" drehen. Nichts zu tun außer beobachten, ist im Monitoring abgedeckt.

**3. egons.io-Auftrieb mitnehmen (bester Mover im Portfolio).** Impressionen 6 → 58, erstmals Klicks, getragen von `/ki-bei-adhs` und `/ki-fuer-senioren`. Hebel mit höchstem Effort-to-Return: diese zwei Seiten vertiefen und 2 bis 3 thematisch benachbarte Seiten ergänzen (z. B. `KI für Pflege`, `KI-Assistent Datenschutz/local-first`), solange das Thema Sichtbarkeit zieht. **Zuerst testen:** die ADHS-Seite ausbauen, weil sie schon klickt, der Markt also bestätigt ist. Wenn du willst, entwerfe ich die Seiten direkt (egons ist technisch sauber, reines Content-Spiel).

---

## P2 — parken / delegieren (bewusst NICHT jetzt)

- **dopaspeak.com** (1.170 nicht indexiert, 895 Canonical-Ausschlüsse): betreut ein anderer Agent. Nur gemeldet, kein Eingriff von hier. Größter Indexierungshebel, aber nicht mein Tisch.
- **mapraiders 219 "indexierbar_ohne_hreflang"**: Content-/Cluster-Aufgabe, kein Gate-Fehler. Nach dem Cert-Fix angehen, nicht davor.
- **mapraiders 0 externe Backlinks**: Outreach-Versand läuft nur über dich. Kit liegt im Repo (OUTREACH_KIT). Erst sinnvoll, wenn die Seite wieder lädt.

---

## Was ich autonom erledigt habe / wo die Grenze liegt

- Erledigt: 4 Properties in GSC gelesen, Live-Checks, lokaler Gate-Check (`_validate_seo.py`, 763 Seiten, alle Gates grün), Root-Cause des Cert-Fehlers bis auf Server/nginx/certbot eingegrenzt, egons.io als nicht betroffen gegengeprüft, 5 Wochenberichte + dieser Plan geschrieben.
- Grenze: SSH auf den Prod-Server und certbot ausführen mache ich nicht (Produktions-Infrastruktur, Zugangsdaten, Standing Rule "mapraiders = nur Skripte fixen"). Der P0-Schritt ist deiner. Alles danach (Content, Monitoring-Erweiterung) kann ich übernehmen, sobald du grünes Licht gibst.
