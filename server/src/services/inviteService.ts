// ============================================================
// Invite Service
// Referral system: generate invite codes, track usage,
// award bonus XP when invitee makes first claim.
// ============================================================

import { query, queryOne, queryMany } from '../config/database';
import { awardXp } from './progressionEngine';
import { awardTitle } from './progressionEngine';
import { sendNotification } from './notificationService';
import crypto from 'crypto';

/** XP awarded to the inviter when the invitee makes their first claim */
const INVITER_BONUS_XP = 500;
/** XP awarded to the invitee when they make their first claim */
const INVITEE_BONUS_XP = 200;
/** Number of successful invites needed for the "Recruiter" title */
const RECRUITER_THRESHOLD = 5;

/**
 * Generate a unique 8-character invite code.
 */
function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new invite code for a user.
 */
export async function createInvite(
  userId: string,
): Promise<{ id: string; invite_code: string; expires_at: Date }> {
  // Generate a unique code (retry up to 5 times on collision)
  let code: string = '';
  for (let i = 0; i < 5; i++) {
    code = generateCode();
    const existing = await queryOne(
      'SELECT id FROM invites WHERE invite_code = $1',
      [code],
    );
    if (!existing) break;
  }

  const invite = await queryOne<{ id: string; invite_code: string; expires_at: Date }>(
    `INSERT INTO invites (inviter_id, invite_code)
     VALUES ($1, $2)
     RETURNING id, invite_code, expires_at`,
    [userId, code],
  );

  if (!invite) {
    throw new Error('Failed to create invite');
  }

  return invite;
}

/**
 * Redeem an invite code during registration.
 * Links the invite to the new user and updates status to 'registered'.
 */
export async function useInvite(
  code: string,
  newUserId: string,
): Promise<{ inviter_id: string } | null> {
  const invite = await queryOne<{ id: string; inviter_id: string; status: string; expires_at: Date }>(
    `SELECT id, inviter_id, status, expires_at FROM invites WHERE invite_code = $1`,
    [code],
  );

  if (!invite) return null;

  // Check if invite is still valid
  if (invite.status !== 'pending') return null;
  if (new Date(invite.expires_at) < new Date()) {
    await query(
      "UPDATE invites SET status = 'expired' WHERE id = $1",
      [invite.id],
    );
    return null;
  }

  // Prevent self-invite
  if (invite.inviter_id === newUserId) return null;

  await query(
    `UPDATE invites SET invitee_id = $1, status = 'registered' WHERE id = $2`,
    [newUserId, invite.id],
  );

  return { inviter_id: invite.inviter_id };
}

/**
 * Called after a user's first-ever territory claim.
 * If they were invited, award bonus XP to both inviter and invitee.
 */
export async function checkFirstClaim(userId: string): Promise<void> {
  // Find an invite where this user is the invitee and status is 'registered'
  const invite = await queryOne<{ id: string; inviter_id: string }>(
    `SELECT id, inviter_id FROM invites
     WHERE invitee_id = $1 AND status = 'registered'
     LIMIT 1`,
    [userId],
  );

  if (!invite) return;

  // Award bonus XP to inviter
  await awardXp(invite.inviter_id, INVITER_BONUS_XP, 'invite_bonus');

  // Notify inviter
  const invitee = await queryOne<{ username: string }>(
    'SELECT username FROM users WHERE id = $1',
    [userId],
  );
  try {
    await sendNotification({
      userId: invite.inviter_id,
      type: 'invite_bonus',
      title: 'Invite Bonus!',
      body: `${invitee?.username ?? 'Your friend'} made their first claim. You earned ${INVITER_BONUS_XP} XP!`,
      data: { invitee_id: userId, xp: INVITER_BONUS_XP },
      priority: 'MEDIUM',
    });
  } catch {
    // Non-critical
  }

  // Award bonus XP to invitee
  await awardXp(userId, INVITEE_BONUS_XP, 'invite_bonus');

  // Update invite status
  await query(
    `UPDATE invites SET status = 'first_claim', bonus_awarded = TRUE WHERE id = $1`,
    [invite.id],
  );

  // Check if inviter qualifies for Recruiter title
  const successfulInvites = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM invites
     WHERE inviter_id = $1 AND status = 'first_claim'`,
    [invite.inviter_id],
  );

  if (parseInt(successfulInvites?.count || '0', 10) >= RECRUITER_THRESHOLD) {
    await awardTitle(invite.inviter_id, 'recruiter');
  }
}

/**
 * Get all invites sent by a user.
 */
export async function getMyInvites(
  userId: string,
): Promise<Array<{
  id: string;
  invite_code: string;
  status: string;
  invitee_username: string | null;
  bonus_awarded: boolean;
  created_at: Date;
  expires_at: Date;
}>> {
  const invites = await queryMany<{
    id: string;
    invite_code: string;
    status: string;
    invitee_username: string | null;
    bonus_awarded: boolean;
    created_at: Date;
    expires_at: Date;
  }>(
    `SELECT i.id, i.invite_code, i.status, i.bonus_awarded,
            i.created_at, i.expires_at,
            u.username as invitee_username
     FROM invites i
     LEFT JOIN users u ON i.invitee_id = u.id
     WHERE i.inviter_id = $1
     ORDER BY i.created_at DESC`,
    [userId],
  );

  return invites;
}

export const inviteService = {
  createInvite,
  useInvite,
  checkFirstClaim,
  getMyInvites,
};
