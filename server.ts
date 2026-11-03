import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';
import {
  dbManager,
  UserAccount,
  EmailLogEntry,
} from './src/server/db';
import {
  validateUserId,
  validateEmail,
  validatePassword,
  hashPassword,
  verifyPassword,
  findUserByUserId,
  findUserByEmail,
  findUserById,
  createSession,
  authenticateToken,
  applyProgressiveDelay,
  generateSecureToken,
  SESSION_COOKIE_NAME,
} from './src/server/auth';
import { TaskReminder, UserSettings } from './src/types';
import { generateDemoTasks } from './src/utils/demoData';

interface AuthenticatedRequest extends Request {
  user?: UserAccount;
  sessionToken?: string;
}

// Authentication Middleware
async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies[SESSION_COOKIE_NAME];
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const authResult = authenticateToken(token);
  if (!authResult) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  req.user = authResult.user;
  req.sessionToken = token;
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Disable caching for sensitive auth APIs
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // 1. Create account
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { fullName, userId, email, password, confirmPassword } = req.body;

      // Server validation
      if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
        return res.status(400).json({ error: 'Full name is required.' });
      }

      const uidValidation = validateUserId(userId || '');
      if (!uidValidation.valid) {
        return res.status(400).json({ error: uidValidation.message });
      }

      const emailValidation = validateEmail(email || '');
      if (!emailValidation.valid) {
        return res.status(400).json({ error: emailValidation.message });
      }

      const pwdValidation = validatePassword(password || '');
      if (!pwdValidation.valid) {
        return res.status(400).json({ error: pwdValidation.message });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
      }

      const trimmedUserId = userId.trim();
      const userIdLower = trimmedUserId.toLowerCase();
      const trimmedEmail = email.trim();
      const emailLower = trimmedEmail.toLowerCase();

      // Check case-insensitive uniqueness in database
      const existingByUid = findUserByUserId(userIdLower);
      if (existingByUid) {
        return res.status(409).json({ error: 'This User ID is already taken. Please choose another.' });
      }

      const existingByEmail = findUserByEmail(emailLower);
      if (existingByEmail) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      // Hash password with Argon2id
      const passwordHash = await hashPassword(password);

      // Single-use email verification token (24-hour expiry)
      const verificationToken = generateSecureToken(32);
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const internalUuid = uuidv4();
      const now = new Date().toISOString();

      const newUser: UserAccount = {
        id: internalUuid,
        userId: trimmedUserId,
        userIdLower,
        fullName: fullName.trim(),
        email: trimmedEmail,
        emailLower,
        passwordHash,
        emailVerified: false,
        verificationToken,
        verificationExpires,
        sessions: [],
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
      };

      const db = dbManager.getDb();
      db.users.push(newUser);

      // Seed initial tasks for the new user so they have a great first impression
      db.tasks[internalUuid] = generateDemoTasks();
      db.settings[internalUuid] = {
        theme: 'light',
        timezone: 'Asia/Kolkata',
        timeFormat: '12h',
        showEmojiBackground: true,
        soundEnabled: true,
        browserNotificationsEnabled: false,
        inAppBannerEnabled: true,
        defaultReminderTimings: [{ preset: '1_day' }, { preset: '1_hour' }],
        reducedMotion: false,
      };

      // Record simulated email
      const verifyLink = `/verify-email?token=${verificationToken}`;
      const emailLog: EmailLogEntry = {
        id: uuidv4(),
        to: trimmedEmail,
        subject: 'Verify your Soonzo account email',
        type: 'verify_email',
        token: verificationToken,
        link: verifyLink,
        sentAt: now,
      };
      db.emailLogs.push(emailLog);

      // Create session
      const { token } = await createSession(newUser, true, req.headers['user-agent']);

      res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      console.log(`[Soonzo Auth] Registered new user ${newUser.userId} (${newUser.id}). Verification link: ${verifyLink}`);

      return res.status(201).json({
        user: {
          id: newUser.id,
          userId: newUser.userId,
          fullName: newUser.fullName,
          email: newUser.email,
          emailVerified: newUser.emailVerified,
          createdAt: newUser.createdAt,
        },
        devVerificationLink: verifyLink,
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Server error during registration. Please try again.' });
    }
  });

  // 2. Log in
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { userId, password, rememberMe } = req.body;

      if (!userId || !password) {
        return res.status(400).json({ error: 'User ID and password are required.' });
      }

      const user = findUserByUserId(userId);

      // Progressive delay protection against brute force
      if (user) {
        // Check if locked
        if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
          const remMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
          return res.status(429).json({
            error: `Too many failed login attempts. Account temporarily locked for ${remMinutes} minute(s).`,
          });
        }
        await applyProgressiveDelay(user.failedLoginAttempts || 0);
      } else {
        // Run dummy Argon2 hash verify to prevent timing side-channel attacks
        await verifyPassword(
          '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$P6Lh0v5Zf3Y2n8B8K7v5w1m0',
          password
        );
      }

      let passwordValid = false;
      if (user) {
        passwordValid = await verifyPassword(user.passwordHash, password);
      }

      if (!user || !passwordValid) {
        if (user) {
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          if (user.failedLoginAttempts >= 5) {
            user.lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Lock 5 mins
          }
          await dbManager.saveDb();
        }

        // Generic error without revealing account existence
        return res.status(401).json({ error: 'Incorrect User ID or password.' });
      }

      // Successful login: reset failed counters
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;

      const { token } = await createSession(user, Boolean(rememberMe), req.headers['user-agent']);

      const durationMs = (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;
      res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: durationMs,
      });

      return res.json({
        user: {
          id: user.id,
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Server error during login. Please try again.' });
    }
  });

  // 3. Get current authenticated user
  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    res.json({
      user: {
        id: user.id,
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  });

  // 4. Log out (current device)
  app.post('/api/auth/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const token = req.sessionToken;

    if (token && user.sessions) {
      const authResult = authenticateToken(token);
      if (authResult) {
        user.sessions = user.sessions.filter((s) => s.sessionId !== authResult.session.sessionId);
        await dbManager.saveDb();
      }
    }

    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ message: 'Logged out successfully.' });
  });

  // 5. Log out of all devices
  app.post('/api/auth/logout-all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    user.sessions = [];
    await dbManager.saveDb();

    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ message: 'All active sessions on all devices have been terminated.' });
  });

  // 6. Verify Email
  app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const db = dbManager.getDb();
    const user = db.users.find(
      (u) =>
        u.verificationToken === token &&
        u.verificationExpires &&
        new Date(u.verificationExpires).getTime() > Date.now()
    );

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired email verification link. Please request a new link in Settings.',
      });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    user.updatedAt = new Date().toISOString();
    await dbManager.saveDb();

    res.json({ message: 'Email verified successfully! Your account is now fully active.' });
  });

  // 7. Resend Verification Email
  app.post('/api/auth/resend-verification', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    if (user.emailVerified) {
      return res.json({ message: 'Your email address is already verified.' });
    }

    const token = generateSecureToken(32);
    user.verificationToken = token;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    user.updatedAt = new Date().toISOString();

    const link = `/verify-email?token=${token}`;
    const db = dbManager.getDb();
    db.emailLogs.push({
      id: uuidv4(),
      to: user.email,
      subject: 'Verify your Soonzo account email',
      type: 'verify_email',
      token,
      link,
      sentAt: new Date().toISOString(),
    });
    await dbManager.saveDb();

    console.log(`[Soonzo Auth] Resent verification for ${user.email}: ${link}`);

    res.json({
      message: 'A verification link has been sent to your email address.',
      devVerificationLink: link,
    });
  });

  // 8. Forgot Password
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    const { identifier } = req.body; // Can be email or User ID
    const genericResponse = {
      message:
        'If an account matches that information, instructions to reset your password have been sent to the verified email address.',
    };

    if (!identifier || typeof identifier !== 'string') {
      return res.json(genericResponse);
    }

    const trimmed = identifier.trim();
    const user = findUserByEmail(trimmed) || findUserByUserId(trimmed);

    if (user) {
      const resetToken = generateSecureToken(32);
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1-hour expiry
      user.updatedAt = new Date().toISOString();

      const resetLink = `/reset-password?token=${resetToken}`;
      const db = dbManager.getDb();
      db.emailLogs.push({
        id: uuidv4(),
        to: user.email,
        subject: 'Reset your Soonzo account password',
        type: 'password_reset',
        token: resetToken,
        link: resetLink,
        sentAt: new Date().toISOString(),
      });
      await dbManager.saveDb();

      console.log(`[Soonzo Auth] Password reset link for ${user.email}: ${resetLink}`);
      // In development mode, return devResetLink to simplify manual testing in sandbox
      return res.json({ ...genericResponse, devResetLink: resetLink });
    }

    return res.json(genericResponse);
  });

  // 9. Reset Password
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required.' });
    }

    const pwdCheck = validatePassword(newPassword || '');
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.message });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const db = dbManager.getDb();
    const user = db.users.find(
      (u) =>
        u.passwordResetToken === token &&
        u.passwordResetExpires &&
        new Date(u.passwordResetExpires).getTime() > Date.now()
    );

    if (!user) {
      return res.status(400).json({
        error: 'Password reset link is invalid or has expired. Please request a new reset link.',
      });
    }

    // Hash new password with Argon2id
    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = new Date().toISOString();

    // CRITICAL: Invalidate all existing sessions after a password reset
    user.sessions = [];
    await dbManager.saveDb();

    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
  });

  // 10. Forgot User ID
  app.post('/api/auth/forgot-userid', async (req: Request, res: Response) => {
    const { email } = req.body;
    const genericResponse = {
      message: 'If this email is associated with an account, your User ID has been sent to your inbox.',
    };

    if (!email) {
      return res.json(genericResponse);
    }

    const user = findUserByEmail(email);
    if (user) {
      const db = dbManager.getDb();
      db.emailLogs.push({
        id: uuidv4(),
        to: user.email,
        subject: 'Your Soonzo User ID Reminder',
        type: 'forgot_userid',
        userId: user.userId,
        sentAt: new Date().toISOString(),
      });
      await dbManager.saveDb();
      console.log(`[Soonzo Auth] Recover User ID for ${user.email}: User ID is "${user.userId}"`);
      return res.json({ ...genericResponse, devRecoveredUserId: user.userId });
    }

    return res.json(genericResponse);
  });

  // 11. Change Password (Authenticated)
  app.post('/api/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const validCurrent = await verifyPassword(user.passwordHash, currentPassword);
    if (!validCurrent) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.message });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    await dbManager.saveDb();

    res.json({ message: 'Password changed successfully.' });
  });

  // 12. Update Profile (Authenticated)
  app.post('/api/auth/update-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { fullName, userId, email } = req.body;

    if (fullName && fullName.trim()) {
      user.fullName = fullName.trim();
    }

    // If changing public User ID: validate and ensure uniqueness, internal UUID stays intact!
    if (userId && userId.trim() && userId.trim().toLowerCase() !== user.userIdLower) {
      const uidCheck = validateUserId(userId);
      if (!uidCheck.valid) {
        return res.status(400).json({ error: uidCheck.message });
      }

      const existing = findUserByUserId(userId);
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ error: 'This User ID is already taken.' });
      }

      user.userId = userId.trim();
      user.userIdLower = userId.trim().toLowerCase();
    }

    // If changing email address: verify uniqueness and set unverified until confirmed
    if (email && email.trim() && email.trim().toLowerCase() !== user.emailLower) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) {
        return res.status(400).json({ error: emailCheck.message });
      }

      const existing = findUserByEmail(email);
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ error: 'This email is already in use by another account.' });
      }

      user.email = email.trim();
      user.emailLower = email.trim().toLowerCase();
      user.emailVerified = false;
      user.verificationToken = generateSecureToken(32);
      user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    user.updatedAt = new Date().toISOString();
    await dbManager.saveDb();

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  });

  // ==========================================
  // USER-ISOLATED DATA ROUTES (TASKS & SETTINGS)
  // Protected strictly by authenticated user's internal UUID
  // ==========================================

  // Get user's tasks
  app.get('/api/tasks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const db = dbManager.getDb();
    const tasks = db.tasks[user.id] || [];
    res.json({ tasks });
  });

  // Save / Sync tasks for authenticated user
  app.post('/api/tasks/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks must be an array.' });
    }

    const db = dbManager.getDb();
    db.tasks[user.id] = tasks;
    await dbManager.saveDb();

    res.json({ message: 'Tasks synced successfully.', count: tasks.length });
  });

  // Create single task
  app.post('/api/tasks', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const taskData = req.body;

    if (!taskData.title || !taskData.deadline) {
      return res.status(400).json({ error: 'Title and deadline are required.' });
    }

    const newTask: TaskReminder = {
      ...taskData,
      id: `task-${Date.now()}-${uuidv4().substring(0, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = dbManager.getDb();
    if (!db.tasks[user.id]) db.tasks[user.id] = [];
    db.tasks[user.id].unshift(newTask);
    await dbManager.saveDb();

    res.status(201).json({ task: newTask });
  });

  // Update single task
  app.put('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const taskId = req.params.id;
    const updates = req.body;

    const db = dbManager.getDb();
    const userTasks = db.tasks[user.id] || [];
    const index = userTasks.findIndex((t) => t.id === taskId);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    const updatedTask = {
      ...userTasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    userTasks[index] = updatedTask;
    await dbManager.saveDb();

    res.json({ task: updatedTask });
  });

  // Delete single task
  app.delete('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const taskId = req.params.id;

    const db = dbManager.getDb();
    const userTasks = db.tasks[user.id] || [];
    const filtered = userTasks.filter((t) => t.id !== taskId);

    if (filtered.length === userTasks.length) {
      return res.status(404).json({ error: 'Task not found or access denied.' });
    }

    db.tasks[user.id] = filtered;
    await dbManager.saveDb();

    res.json({ message: 'Task deleted successfully.' });
  });

  // Import browser-local tasks into signed-in user's account
  app.post('/api/tasks/import-local', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { localTasks } = req.body;

    if (!Array.isArray(localTasks) || localTasks.length === 0) {
      return res.status(400).json({ error: 'No local tasks provided to import.' });
    }

    const db = dbManager.getDb();
    if (!db.tasks[user.id]) db.tasks[user.id] = [];

    // Filter out duplicates by title or ID
    const existingTitles = new Set(db.tasks[user.id].map((t) => t.title.toLowerCase()));
    const imported: TaskReminder[] = [];

    for (const t of localTasks) {
      if (!existingTitles.has(t.title.toLowerCase())) {
        imported.push({
          ...t,
          id: `imported-${Date.now()}-${uuidv4().substring(0, 6)}`,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    db.tasks[user.id] = [...imported, ...db.tasks[user.id]];
    await dbManager.saveDb();

    res.json({
      message: `Successfully imported ${imported.length} tasks into your account.`,
      importedCount: imported.length,
      tasks: db.tasks[user.id],
    });
  });

  // Get user settings
  app.get('/api/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const db = dbManager.getDb();
    const settings = db.settings[user.id] || {
      theme: 'light',
      timezone: 'Asia/Kolkata',
      timeFormat: '12h',
      showEmojiBackground: true,
      soundEnabled: true,
      browserNotificationsEnabled: false,
      inAppBannerEnabled: true,
      defaultReminderTimings: [{ preset: '1_day' }, { preset: '1_hour' }],
      reducedMotion: false,
    };
    res.json({ settings });
  });

  // Save user settings
  app.put('/api/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { settings } = req.body;

    const db = dbManager.getDb();
    db.settings[user.id] = settings;
    await dbManager.saveDb();

    res.json({ message: 'Settings saved.', settings });
  });

  // Dev simulated email query (for development and test verifications)
  app.get('/api/dev/last-email', (req: Request, res: Response) => {
    const db = dbManager.getDb();
    const last = db.emailLogs.slice(-1)[0] || null;
    res.json({ lastEmail: last });
  });

  // ==========================================
  // VITE / SPA MOUNTING
  // ==========================================
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Soonzo Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
