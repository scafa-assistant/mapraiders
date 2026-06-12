// ============================================================
// MapRaiders Server - Main Entry Point
// GPS-based city MMO backend
// ============================================================

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables before anything else
dotenv.config();

// Import database initialization
import { initDatabase } from './config/database';

// Import global rate limiter
import { apiLimiter } from './middleware/rateLimit';

// Import all route modules
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { routesRouter } from './routes/routes';
import { territoriesRouter } from './routes/territories';
import { questsRouter } from './routes/quests';
import { echosRouter } from './routes/echos';
import { challengesRouter } from './routes/challenges';
import { petsRouter } from './routes/pets';
import { travelRouter } from './routes/travel';
import { leaderboardsRouter } from './routes/leaderboards';
import { clansRouter } from './routes/clans';
import { notificationsRouter } from './routes/notifications';
import { socialRouter } from './routes/social';
import { weatherRouter } from './routes/weather';
import { artifactsRouter } from './routes/artifacts';
import { placesRouter } from './routes/places';
import { silentZonesRouter } from './routes/silentZones';
import { resonanceRouter } from './routes/resonance';
import { invitesRouter } from './routes/invites';
import { bountiesRouter } from './routes/bounties';
import { aliasesRouter } from './routes/aliases';
import { trapsRouter } from './routes/traps';
import { duelsRouter } from './routes/duels';
import { racesRouter } from './routes/races';
import { eventsRouter } from './routes/events';
import { defensesRouter } from './routes/defenses';
import { turnGamesRouter } from './routes/turnGames';
import { meetupsRouter } from './routes/meetups';
import { playersRouter } from './routes/players';
import { friendsRouter } from './routes/friends';
import { healthRouter } from './routes/health';
import { featuresRouter } from './routes/features';
import { inventoryRouter } from './routes/inventory';
import { resourcesRouter } from './routes/resources';

// Import cron jobs (created by another agent)
import { setupCronJobs } from './jobs/decayCron';

// Import WebSocket service
import { wsService } from './services/wsService';
import { queryOne } from './config/database';

// ---- Create Express app ----
const app = express();

// ---- Trust proxy (required for rate limiting behind reverse proxy) ----
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ---- Security middleware ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ---- CORS ----
const corsOrigin = process.env.CORS_ORIGIN || (
  process.env.NODE_ENV === 'production' ? 'https://mapraiders.com' : '*'
);
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24h preflight cache
}));

// ---- Compression ----
app.use(compression());

// ---- Logging ----
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---- Body parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- Static file serving for uploads ----
const uploadsDir = path.join(__dirname, '../uploads');

// Ensure upload directories exist
const uploadSubdirs = ['echos', 'quests', 'challenges'];
for (const subdir of uploadSubdirs) {
  const dir = path.join(uploadsDir, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use('/uploads', express.static(uploadsDir));

// ---- Global rate limiter ----
app.use('/api', apiLimiter);

// ---- Health check (no auth required) ----
app.get('/api/health', (_req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'mapraiders-api',
      ...(isProduction ? {} : {
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
      }),
      timestamp: new Date().toISOString(),
    },
  });
});

// ---- API Routes ----
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/routes', routesRouter);
app.use('/api/territories', territoriesRouter);
app.use('/api/quests', questsRouter);
app.use('/api/echos', echosRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/pets', petsRouter);
app.use('/api/travel', travelRouter);
app.use('/api/leaderboards', leaderboardsRouter);
app.use('/api/clans', clansRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/social', socialRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/artifacts', artifactsRouter);
app.use('/api/places', placesRouter);
app.use('/api/silent-zones', silentZonesRouter);
app.use('/api/resonance', resonanceRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/bounties', bountiesRouter);
app.use('/api/aliases', aliasesRouter);
app.use('/api/traps', trapsRouter);
app.use('/api/duels', duelsRouter);
app.use('/api/races', racesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/defenses', defensesRouter);
app.use('/api/games', turnGamesRouter);
app.use('/api/meetups', meetupsRouter);
app.use('/api/players', playersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/health', healthRouter);
app.use('/api/features', featuresRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/resources', resourcesRouter);

// ---- 404 handler for unknown API routes ----
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// ---- Global error handling middleware ----
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Log the full error
  console.error('[Error]', err.stack || err.message || err);

  // Handle multer file-size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
    });
  }

  // Handle multer unexpected field errors
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
    });
  }

  // Handle JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
  }

  // Default internal server error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message: message,
  });
});

// ---- Create HTTP server and WebSocket server ----
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req) => {
  // Parse token from query string: ws://host?token=xxx
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, 'No token');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mapraiders-dev-secret') as { userId: string };
    wsService.addClient(decoded.userId, ws);

    // Look up the user's clan membership and attach it to the WS client
    queryOne<{ clan_id: string }>(
      'SELECT clan_id FROM clan_members WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1',
      [decoded.userId]
    ).then((row) => {
      if (row) {
        wsService.setClanId(decoded.userId, row.clan_id);
      }
    }).catch(() => {
      // Non-critical: user may not be in a clan
    });

    // WebSocket rate limiting: max 2 messages per second per client
    let wsMessageCount = 0;
    let wsMessageResetTime = Date.now();

    ws.on('message', (raw) => {
      try {
        const now = Date.now();
        if (now - wsMessageResetTime > 1000) {
          wsMessageCount = 0;
          wsMessageResetTime = now;
        }
        wsMessageCount++;
        if (wsMessageCount > 2) return; // Drop excessive messages

        const msg = JSON.parse(raw.toString());
        if (msg.event === 'location_update') {
          const lat = parseFloat(msg.data?.lat);
          const lng = parseFloat(msg.data?.lng);
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
          wsService.updateLocation(decoded.userId, lat, lng);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => wsService.removeClient(decoded.userId));
  } catch {
    ws.close(4003, 'Invalid token');
  }
});

// ---- Start server ----
async function startServer(): Promise<void> {
  try {
    // Initialize database connection and verify PostGIS
    await initDatabase();
    console.log('[Server] Database initialized');
  } catch (err) {
    console.error('[Server] Database initialization failed:', err);
    console.warn('[Server] Starting anyway - database may become available later');
  }

  server.listen(PORT, HOST, () => {
    console.log(`[Server] MapRaiders API running on http://${HOST}:${PORT}`);
    console.log(`[Server] WebSocket server ready`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Setup cron jobs (non-blocking - server starts even if cron setup fails)
  try {
    setupCronJobs();
    console.log('[Server] Cron jobs scheduled');
  } catch (err) {
    console.error('[Server] Cron job setup failed:', err);
  }
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

// ---- Graceful shutdown ----
function gracefulShutdown(signal: string): void {
  console.log(`[Server] ${signal} received. Shutting down gracefully...`);

  // Allow 10 seconds for cleanup
  const shutdownTimeout = setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);

  // Close database pool
  import('./config/database').then(({ pool }) => {
    pool.end().then(() => {
      console.log('[Server] Database pool closed');
      clearTimeout(shutdownTimeout);
      process.exit(0);
    }).catch(() => {
      clearTimeout(shutdownTimeout);
      process.exit(1);
    });
  }).catch(() => {
    clearTimeout(shutdownTimeout);
    process.exit(1);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Server] Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

export default app;
