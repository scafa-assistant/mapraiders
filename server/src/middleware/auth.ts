// ============================================================
// JWT Authentication Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../config/database';
import { User } from '../utils/types';

const JWT_SECRET = process.env.JWT_SECRET || 'gridwalker-dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'gridwalker-refresh-secret';

// ---- Extend Express Request ----

export interface AuthPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: User;
    }
  }
}

// ---- Middleware ----

/**
 * Middleware that requires a valid JWT token.
 * Extracts userId from the token and attaches it to req.userId.
 * Responds with 401 if token is missing, expired, or invalid.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.userId = payload.userId;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Token expired' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid token' });
    }
  }
}

/** Alias for backwards compatibility */
export const requireAuth = authenticate;

/**
 * Optional auth - sets userId if a valid token is present, but does not reject.
 * Useful for endpoints that behave differently for authenticated vs anonymous users.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
      req.userId = payload.userId;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
}

/**
 * Middleware that loads the full user object from the database.
 * Must be used after authenticate/requireAuth.
 * Sets req.user with the full User record.
 * Responds with 403 if the user account is not found or is banned.
 */
export async function loadUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE id = $1 AND banned = FALSE',
      [req.userId]
    );

    if (!user) {
      res.status(403).json({ success: false, error: 'Account not found or banned' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// ---- Token Generation ----

/**
 * Generate a short-lived access token (default 1h).
 */
export function generateAccessToken(userId: string): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(
    { userId } as AuthPayload,
    JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}

/**
 * Generate a long-lived refresh token (default 30d).
 */
export function generateRefreshToken(userId: string): string {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  return jwt.sign(
    { userId } as AuthPayload,
    JWT_REFRESH_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}

/**
 * Verify and decode a refresh token.
 * Throws if the token is invalid or expired.
 */
export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as AuthPayload;
}
