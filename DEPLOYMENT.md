# MapRaiders — Server Deployment Guide

## Ziel
MapRaiders API + WebSocket auf dem Hetzner Server deployen, NEBEN dem bestehenden EGON Backend. Nichts an EGON anfassen.

## Server Info
- **IP:** 159.69.157.42
- **SSH:** root@159.69.157.42:22 (Fallback Port 443)
- **Passwort:** 3jTTdX4JqHEN
- **OS:** Linux (Hetzner)

## Was bereits auf dem Server läuft (NICHT ANFASSEN!)
| Was | Pfad | Port | Service |
|-----|------|------|---------|
| EGON Backend | /opt/egons-backend/ | 8001 | egon.service |
| EGON venv | /opt/egons-backend/venv/ | - | - |
| EGON API | http://159.69.157.42:8001/api/ | 8001 | - |

**REGEL: NICHTS unter /opt/egons-backend/ ändern. Port 8001 ist belegt. egon.service nicht anfassen.**

## MapRaiders Deployment Plan

### Ports & Pfade
| Was | Wert |
|-----|------|
| MapRaiders Backend | /opt/mapraiders/ |
| MapRaiders API Port | 3000 |
| MapRaiders WebSocket | Port 3000 (gleicher Server) |
| PostgreSQL+PostGIS | Port 5432 (Docker oder lokal) |
| Redis | Port 6379 (Docker oder lokal) |
| Domain | mapraiders.com |
| API Domain | api.mapraiders.com |
| systemd Service | mapraiders.service |

### Schritt 1: DNS konfigurieren
Bei United Domains (oder wo die Domain liegt):
```
A-Record:  mapraiders.com        → 159.69.157.42
A-Record:  api.mapraiders.com    → 159.69.157.42
A-Record:  *.mapraiders.com      → 159.69.157.42
```

### Schritt 2: Server vorbereiten
```bash
ssh root@159.69.157.42

# Node.js 20 installieren (falls nicht vorhanden)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PostgreSQL + PostGIS installieren
apt-get install -y postgresql postgresql-contrib postgis

# Redis installieren
apt-get install -y redis-server

# Nginx installieren (Reverse Proxy)
apt-get install -y nginx certbot python3-certbot-nginx

# Projektverzeichnis erstellen
mkdir -p /opt/mapraiders
```

### Schritt 3: Code deployen
```bash
cd /opt/mapraiders
git clone https://github.com/scafa-assistant/mapraiders.git .
cd server
npm install --production
npx tsc  # TypeScript kompilieren → dist/
```

### Schritt 4: PostgreSQL einrichten
```bash
sudo -u postgres psql << 'SQL'
CREATE USER mapraiders WITH PASSWORD 'MapRaiders_Pr0d_2026!';
CREATE DATABASE mapraiders OWNER mapraiders;
\c mapraiders
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
SQL

# Schema + Seed laden
sudo -u postgres psql -d mapraiders -f /opt/mapraiders/server/src/db/schema.sql
sudo -u postgres psql -d mapraiders -f /opt/mapraiders/server/src/db/seed.sql
```

### Schritt 5: Environment File
```bash
cat > /opt/mapraiders/server/.env << 'EOF'
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://mapraiders:MapRaiders_Pr0d_2026!@localhost:5432/mapraiders
REDIS_URL=redis://localhost:6379
JWT_SECRET=MapRaiders-JWT-Secret-Change-This-In-Production-2026
JWT_REFRESH_SECRET=MapRaiders-Refresh-Secret-Change-This-2026
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://mapraiders.com,https://api.mapraiders.com
NODE_ENV=production
EOF
```

### Schritt 6: systemd Service erstellen
```bash
cat > /etc/systemd/system/mapraiders.service << 'EOF'
[Unit]
Description=MapRaiders API Server
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/mapraiders/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mapraiders
systemctl start mapraiders
systemctl status mapraiders
```

### Schritt 7: Nginx Reverse Proxy
```bash
cat > /etc/nginx/sites-available/mapraiders << 'NGINX'
# API + WebSocket: api.mapraiders.com
server {
    listen 80;
    server_name api.mapraiders.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;  # WebSocket keep-alive
    }
}

# Landing Page: mapraiders.com
server {
    listen 80;
    server_name mapraiders.com www.mapraiders.com;

    root /opt/mapraiders/docs;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 404 /404.html;
}
NGINX

ln -sf /etc/nginx/sites-available/mapraiders /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Schritt 8: SSL Zertifikate (Let's Encrypt)
```bash
certbot --nginx -d mapraiders.com -d www.mapraiders.com -d api.mapraiders.com --non-interactive --agree-tos -m workspace.scafa@gmail.com
```

### Schritt 9: Firewall Ports öffnen
```bash
ufw allow 80/tcp
ufw allow 443/tcp
# Port 3000 NICHT öffnen — Nginx leitet weiter
```

### Schritt 10: Testen
```bash
# API Health Check
curl https://api.mapraiders.com/api/health

# Login testen
curl -X POST https://api.mapraiders.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"walker@test.com","password":"test1234"}'

# Landing Page
curl -I https://mapraiders.com
```

### Schritt 11: Mobile App Production URLs aktivieren
In der Mobile App (`mobile/src/services/api.ts`):
```typescript
const API_BASE = 'https://api.mapraiders.com/api';
```
In `mobile/src/services/websocket.ts`:
```typescript
const WS_URL = 'wss://api.mapraiders.com';
```

## Updates deployen
```bash
cd /opt/mapraiders
git pull origin master
cd server
npm install --production
npx tsc
systemctl restart mapraiders
```

## Monitoring
```bash
# Logs
journalctl -u mapraiders -f

# Status
systemctl status mapraiders

# EGON checken (sollte unberührt sein)
systemctl status egon
curl http://localhost:8001/api/health
```

## Port-Übersicht nach Deployment
| Port | Service | Domain |
|------|---------|--------|
| 8001 | EGON Backend | (intern) |
| 3000 | MapRaiders API + WS | api.mapraiders.com (via Nginx) |
| 5432 | PostgreSQL | (intern) |
| 6379 | Redis | (intern) |
| 80 | Nginx HTTP | mapraiders.com |
| 443 | Nginx HTTPS | mapraiders.com |
