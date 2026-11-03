import fs from 'fs';
import path from 'path';
import { TaskReminder, UserSettings } from '../types';

export interface UserSession {
  sessionId: string;
  tokenHash: string;
  userAgent?: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

export interface UserAccount {
  id: string; // Immutable internal UUID
  userId: string; // Public User ID (4-24 chars, case-preserved display)
  userIdLower: string; // Lowercase normalized for case-insensitive uniqueness & lookup
  fullName: string;
  email: string;
  emailLower: string;
  passwordHash: string; // Argon2id hash
  emailVerified: boolean;
  verificationToken?: string | null;
  verificationExpires?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
  sessions: UserSession[];
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  type: 'verify_email' | 'password_reset' | 'forgot_userid';
  token?: string;
  link?: string;
  userId?: string;
  sentAt: string;
}

export interface SoonzoDatabase {
  users: UserAccount[];
  tasks: Record<string, TaskReminder[]>; // Keyed by internal user UUID
  settings: Record<string, UserSettings>; // Keyed by internal user UUID
  emailLogs: EmailLogEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'soonzo_database.json');

const INITIAL_DB: SoonzoDatabase = {
  users: [],
  tasks: {},
  settings: {},
  emailLogs: [],
};

class DatabaseManager {
  private cache: SoonzoDatabase | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Could not create data directory:', err);
      }
    }
  }

  public getDb(): SoonzoDatabase {
    if (this.cache) return this.cache;

    this.ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      this.cache = { ...INITIAL_DB };
      this.persistSync();
      return this.cache;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: SoonzoDatabase = JSON.parse(raw);
      if (!parsed.users) parsed.users = [];
      if (!parsed.tasks) parsed.tasks = {};
      if (!parsed.settings) parsed.settings = {};
      if (!parsed.emailLogs) parsed.emailLogs = [];
      this.cache = parsed;
      return this.cache;
    } catch (err) {
      console.error('Error reading database file, using fallback initial DB:', err);
      this.cache = { ...INITIAL_DB };
      return this.cache;
    }
  }

  private persistSync() {
    if (!this.cache) return;
    try {
      this.ensureDataDir();
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.cache, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('Error in synchronous database write:', err);
    }
  }

  public async saveDb(): Promise<void> {
    if (!this.cache) return;

    this.writeQueue = this.writeQueue.then(async () => {
      try {
        this.ensureDataDir();
        const tmp = `${DB_FILE}.${Date.now()}.tmp`;
        await fs.promises.writeFile(tmp, JSON.stringify(this.cache, null, 2), 'utf-8');
        await fs.promises.rename(tmp, DB_FILE);
      } catch (err) {
        console.error('Error saving database file:', err);
      }
    });

    return this.writeQueue;
  }
}

export const dbManager = new DatabaseManager();
