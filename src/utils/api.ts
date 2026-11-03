import { UserProfile, TaskReminder, UserSettings } from '../types';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Includes HttpOnly session cookie
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const authApi = {
  async register(params: {
    fullName: string;
    userId: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ user: UserProfile; devVerificationLink?: string }> {
    return fetchJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async login(params: {
    userId: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<{ user: UserProfile }> {
    return fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return fetchJson('/api/auth/me', {
      method: 'GET',
    });
  },

  async logout(): Promise<{ message: string }> {
    return fetchJson('/api/auth/logout', {
      method: 'POST',
    });
  },

  async logoutAll(): Promise<{ message: string }> {
    return fetchJson('/api/auth/logout-all', {
      method: 'POST',
    });
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    return fetchJson('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async resendVerification(): Promise<{ message: string; devVerificationLink?: string }> {
    return fetchJson('/api/auth/resend-verification', {
      method: 'POST',
    });
  },

  async forgotPassword(identifier: string): Promise<{ message: string; devResetLink?: string }> {
    return fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  },

  async resetPassword(params: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    return fetchJson('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async forgotUserId(email: string): Promise<{ message: string; devRecoveredUserId?: string }> {
    return fetchJson('/api/auth/forgot-userid', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async changePassword(params: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    return fetchJson('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async updateProfile(params: {
    fullName?: string;
    userId?: string;
    email?: string;
  }): Promise<{ message: string; user: UserProfile }> {
    return fetchJson('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

export const tasksApi = {
  async getTasks(): Promise<{ tasks: TaskReminder[] }> {
    return fetchJson('/api/tasks');
  },

  async syncTasks(tasks: TaskReminder[]): Promise<{ message: string }> {
    return fetchJson('/api/tasks/sync', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    });
  },

  async createTask(task: Partial<TaskReminder>): Promise<{ task: TaskReminder }> {
    return fetchJson('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateTask(id: string, updates: Partial<TaskReminder>): Promise<{ task: TaskReminder }> {
    return fetchJson(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(id: string): Promise<{ message: string }> {
    return fetchJson(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async importLocalTasks(localTasks: TaskReminder[]): Promise<{ message: string; tasks: TaskReminder[] }> {
    return fetchJson('/api/tasks/import-local', {
      method: 'POST',
      body: JSON.stringify({ localTasks }),
    });
  },
};

export const settingsApi = {
  async getSettings(): Promise<{ settings: UserSettings }> {
    return fetchJson('/api/settings');
  },

  async saveSettings(settings: UserSettings): Promise<{ message: string }> {
    return fetchJson('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },
};
