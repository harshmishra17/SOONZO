import crypto from 'crypto';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { dbManager, UserAccount, UserSession } from './db';

const SESSION_COOKIE_NAME = 'soonzo_session';

// Argon2id configuration with unique random salt handled automatically by Argon2
const ARGON2_OPTIONS = {
  type: 2 as const, // 2 = argon2id
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function validateUserId(userId: string): { valid: boolean; message?: string } {
  const trimmed = userId.trim();
  if (trimmed.length < 4 || trimmed.length > 24) {
    return { valid: false, message: 'User ID must be between 4 and 24 characters.' };
  }
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      message: 'User ID can only contain letters, numbers, and underscores (no spaces or special symbols).',
    };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'Please provide a valid email address.' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password cannot exceed 128 characters.' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch (err) {
    console.error('Argon2 verify error:', err);
    return false;
  }
}

// Progressive delay calculator to mitigate repeated automated credential attacks
export async function applyProgressiveDelay(failedAttempts: number): Promise<void> {
  if (failedAttempts <= 2) return;
  const delayMs = Math.min((failedAttempts - 2) * 500, 3000);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

// Find user by case-insensitive User ID or internal UUID
export function findUserByUserId(userId: string): UserAccount | undefined {
  const normalized = userId.trim().toLowerCase();
  const db = dbManager.getDb();
  return db.users.find((u) => u.userIdLower === normalized);
}

export function findUserByEmail(email: string): UserAccount | undefined {
  const normalized = email.trim().toLowerCase();
  const db = dbManager.getDb();
  return db.users.find((u) => u.emailLower === normalized);
}

export function findUserById(internalId: string): UserAccount | undefined {
  const db = dbManager.getDb();
  return db.users.find((u) => u.id === internalId);
}

// Session Creation
export async function createSession(
  user: UserAccount,
  rememberMe: boolean,
  userAgent?: string
): Promise<{ token: string; session: UserSession }> {
  const token = generateSecureToken(32);
  const tokenHash = hashToken(token);
  const now = new Date();
  const durationDays = rememberMe ? 30 : 7;
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const session: UserSession = {
    sessionId: uuidv4(),
    tokenHash,
    userAgent,
    createdAt: now.toISOString(),
    lastActiveAt: now.toISOString(),
    expiresAt,
  };

  user.sessions = user.sessions || [];
  // Prune expired sessions
  user.sessions = user.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now());
  user.sessions.push(session);

  await dbManager.saveDb();
  return { token, session };
}

// Authenticate session from token
export function authenticateToken(token: string): { user: UserAccount; session: UserSession } | null {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const db = dbManager.getDb();

  for (const user of db.users) {
    if (!user.sessions) continue;
    const session = user.sessions.find((s) => s.tokenHash === tokenHash);
    if (session) {
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        // Expired
        return null;
      }
      session.lastActiveAt = new Date().toISOString();
      return { user, session };
    }
  }
  return null;
}

export { SESSION_COOKIE_NAME };
