// ============================================================
// Auth Routes
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/web3
// POST /api/auth/refresh
// ============================================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { query, queryOne } from '../config/database';
import { inviteService } from '../services/inviteService';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema, refreshTokenSchema } from '../middleware/validation';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { username, email, password, invite_code } = req.body;

      // Check if username or email already exists
      const existingUser = await queryOne(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
        [username]
      );

      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Username already taken' });
      }

      const existingEmail = await queryOne(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
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
        return res.status(500).json({ success: false, message: 'Failed to create user' });
      }

      // Process invite code if provided
      if (invite_code && typeof invite_code === 'string') {
        try {
          await inviteService.useInvite(invite_code, user.id);
        } catch (inviteErr) {
          console.error('[Auth] Invite code processing error (non-blocking):', inviteErr);
        }
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
          token: accessToken,
          refreshToken,
        },
      });
    } catch (err: any) {
      console.error('[Auth] Register error:', err);
      return res.status(500).json({ success: false, message: 'Registration failed' });
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
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.banned) {
        return res.status(403).json({ success: false, message: 'Account has been banned' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
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
          token: accessToken,
          refreshToken,
        },
      });
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      return res.status(500).json({ success: false, message: 'Login failed' });
    }
  }
);

// ---- Google idToken verification helper ----
async function verifyGoogleIdToken(idToken: string): Promise<{ email: string; name?: string } | null> {
  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { timeout: 5000 }
    );
    const data = response.data;
    if (!data.email || !data.email_verified || data.email_verified === 'false') {
      return null;
    }
    return { email: data.email, name: data.name };
  } catch {
    return null;
  }
}

// POST /api/auth/web3
// Social login via Web3Auth (Google, Apple, Email passwordless)
router.post(
  '/web3',
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const { provider, idToken, userInfo } = req.body;
      // provider: 'google', 'apple', 'email'

      if (!idToken || typeof idToken !== 'string') {
        return res.status(400).json({ success: false, message: 'idToken is required' });
      }

      // Verify the idToken with the provider — NEVER trust client-supplied userInfo
      let verifiedEmail: string;
      let verifiedName: string | undefined;

      if (provider === 'google') {
        const verified = await verifyGoogleIdToken(idToken);
        if (!verified) {
          return res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
        }
        verifiedEmail = verified.email;
        verifiedName = verified.name;
      } else {
        // Apple and other providers: reject until verification is implemented
        return res.status(400).json({
          success: false,
          message: `Provider '${provider}' is not yet supported for verified login`,
        });
      }

      // Check if user exists with this verified email
      let user = await queryOne<{
        id: string;
        username: string;
        email: string;
        level: number;
        xp: number;
        streak_days: number;
        banned: boolean;
        created_at: Date;
      }>(
        'SELECT id, username, email, level, xp, streak_days, banned, created_at FROM users WHERE LOWER(email) = LOWER($1)',
        [verifiedEmail]
      );

      if (user?.banned) {
        return res.status(403).json({ success: false, message: 'Account has been banned' });
      }

      if (!user) {
        // Auto-register: create account from verified social profile
        const baseName = (verifiedName?.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 30))
          || verifiedEmail.split('@')[0];

        // Check username uniqueness, append random suffix if needed
        let finalUsername = baseName;
        const existing = await queryOne('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [baseName]);
        if (existing) {
          finalUsername = baseName + '_' + Math.random().toString(36).substring(2, 6);
        }

        user = await queryOne(
          `INSERT INTO users (username, email, password_hash, web3_provider)
           VALUES ($1, $2, $3, $4)
           RETURNING id, username, email, level, xp, streak_days, created_at`,
          [finalUsername, verifiedEmail, 'web3auth_' + provider, provider]
        );

        if (!user) {
          return res.status(500).json({ success: false, message: 'Failed to create user' });
        }
      }

      // Update last active timestamp
      await query('UPDATE users SET last_active = NOW() WHERE id = $1', [user.id]);

      // Generate JWT tokens (same as regular login)
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token hash in database
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
          token: accessToken,
          refreshToken,
        },
      });
    } catch (err: any) {
      console.error('[Auth] Web3 login error:', err);
      return res.status(500).json({ success: false, message: 'Web3 login failed' });
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
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      }

      // Check user exists and is not banned
      const user = await queryOne<{ id: string; banned: boolean }>(
        'SELECT id, banned FROM users WHERE id = $1',
        [payload.userId]
      );

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (user.banned) {
        return res.status(403).json({ success: false, message: 'Account has been banned' });
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
        return res.status(401).json({ success: false, message: 'Refresh token not recognized' });
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
          token: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (err: any) {
      console.error('[Auth] Refresh error:', err);
      return res.status(500).json({ success: false, message: 'Token refresh failed' });
    }
  }
);

// POST /api/auth/logout
// Invalidates all refresh tokens for the authenticated user
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.userId]);

      return res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (err: any) {
      console.error('[Auth] Logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
  }
);

// POST /api/auth/change-password
// Allows authenticated users to change their password
router.post(
  '/change-password',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      }

      // Get current user with password hash
      const user = await queryOne<{ id: string; password_hash: string }>(
        'SELECT id, password_hash FROM users WHERE id = $1',
        [req.userId]
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Web3 users don't have passwords
      if (user.password_hash.startsWith('web3auth_')) {
        return res.status(400).json({ success: false, message: 'Social login accounts cannot change password' });
      }

      // Verify current password
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash and save new password
      const salt = await bcrypt.genSalt(12);
      const newHash = await bcrypt.hash(newPassword, salt);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.userId]);

      // Invalidate all refresh tokens (force re-login on other devices)
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.userId]);

      // Generate fresh tokens for this session
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      const refreshHash = await bcrypt.hash(refreshToken, 10);
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
        [user.id, refreshHash]
      );

      return res.json({
        success: true,
        data: {
          message: 'Password changed successfully',
          token: accessToken,
          refreshToken,
        },
      });
    } catch (err: any) {
      console.error('[Auth] Change password error:', err);
      return res.status(500).json({ success: false, message: 'Password change failed' });
    }
  }
);

export const authRouter = router;
export default router;
