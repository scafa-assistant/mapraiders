// ============================================================
// Gridwalker Server - Main Entry Point
// GPS-based city MMO backend
// ============================================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

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

// Import cron jobs (created by another agent)
import { setupCronJobs } from './jobs/decayCron';

// ---- Create Express app ----
const app = express();

// ---- Security middleware ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ---- CORS ----
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
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
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'gridwalker-api',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
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

// ---- 404 handler for unknown API routes ----
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
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
      error: 'File too large',
    });
  }

  // Handle multer unexpected field errors
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field',
    });
  }

  // Handle JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
    });
  }

  // Default internal server error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
});

// ---- Start server ----
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer(): Promise<void> {
  try {
    // Initialize database connection and verify PostGIS
    await initDatabase();
    console.log('[Server] Database initialized');
  } catch (err) {
    console.error('[Server] Database initialization failed:', err);
    console.warn('[Server] Starting anyway - database may become available later');
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Server] Gridwalker API running on http://${HOST}:${PORT}`);
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
