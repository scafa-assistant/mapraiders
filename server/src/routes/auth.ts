// ============================================================
// Auth Routes
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/refresh
// ============================================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/database';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema, refreshTokenSchema } from '../middleware/validation';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      // Check if username or email already exists
      const existingUser = await queryOne(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
        [username]
      );

      if (existingUser) {
        return res.status(409).json({ success: false, error: 'Username already taken' });
      }

      const existingEmail = await queryOne(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      if (existingEmail) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }

      // Hash password with bcrypt (cost factor 12)
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const user = await queryOne<{
        id: string;
        username: string;
        email: string;
        level: number;
        xp: number;
        streak_days: number;
        created_at: Date;
      }>(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, level, xp, streak_days, created_at`,
        [username, email, passwordHash]
      );

      if (!user) {
        return res.status(500).json({ success: false, error: 'Failed to create user' });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token hash in database
      const refreshHash = await bcrypt.hash(refreshToken, 10);
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
        [user.id, refreshHash]
      );

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            streak_days: user.streak_days,
            created_at: user.created_at,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (err: any) {
      console.error('[Auth] Register error:', err);
      return res.status(500).json({ success: false, error: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await queryOne<{
        id: string;
        username: string;
        email: string;
        password_hash: string;
        level: number;
        xp: number;
        streak_days: number;
        banned: boolean;
        created_at: Date;
      }>(
        `SELECT id, username, email, password_hash, level, xp, streak_days, banned, created_at
         FROM users WHERE LOWER(email) = LOWER($1)`,
        [email]
      );

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      if (user.banned) {
        return res.status(403).json({ success: false, error: 'Account has been banned' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      // Update last active timestamp
      await query('UPDATE users SET last_active = NOW() WHERE id = $1', [user.id]);

      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token hash
      const refreshHash = await bcrypt.hash(refreshToken, 10);
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
        [user.id, refreshHash]
      );

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            level: user.level,
            xp: user.xp,
            streak_days: user.streak_days,
            created_at: user.created_at,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      return res.status(500).json({ success: false, error: 'Login failed' });
    }
  }
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // Verify the refresh token JWT signature and expiry
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      }

      // Check user exists and is not banned
      const user = await queryOne<{ id: string; banned: boolean }>(
        'SELECT id, banned FROM users WHERE id = $1',
        [payload.userId]
      );

      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      if (user.banned) {
        return res.status(403).json({ success: false, error: 'Account has been banned' });
      }

      // Verify refresh token exists in DB (check against stored hashes)
      const storedTokens = await query(
        `SELECT id, token_hash FROM refresh_tokens
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 10`,
        [user.id]
      );

      let matchedTokenId: string | null = null;
      for (const row of storedTokens.rows) {
        if (await bcrypt.compare(refreshToken, row.token_hash)) {
          matchedTokenId = row.id;
          break;
        }
      }

      if (!matchedTokenId) {
        return res.status(401).json({ success: false, error: 'Refresh token not recognized' });
      }

      // Rotate: delete the used refresh token
      await query('DELETE FROM refresh_tokens WHERE id = $1', [matchedTokenId]);

      // Generate new token pair
      const newAccessToken = generateAccessToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      // Store new refresh token hash
      const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
        [user.id, newRefreshHash]
      );

      // Clean up expired tokens for this user
      await query(
        'DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()',
        [user.id]
      );

      return res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (err: any) {
      console.error('[Auth] Refresh error:', err);
      return res.status(500).json({ success: false, error: 'Token refresh failed' });
    }
  }
);

export const authRouter = router;
export default router;
