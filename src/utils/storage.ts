import { TaskReminder, UserSettings } from '../types';
import { generateDemoTasks } from './demoData';

const STORAGE_KEYS = {
  TASKS: 'soonzo_tasks_v1',
  LEGACY_TASKS: 'duemate_tasks_v1',
  SETTINGS: 'soonzo_settings_v1',
  LEGACY_SETTINGS: 'duemate_settings_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  timezone: 'Asia/Kolkata',
  timeFormat: '12h',
  showEmojiBackground: true,
  soundEnabled: true,
  browserNotificationsEnabled: false,
  inAppBannerEnabled: true,
  defaultReminderTimings: [
    { preset: '1_day' },
    { preset: '1_hour' },
  ],
  reducedMotion: false,
};

export function loadTasksFromStorage(): TaskReminder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS) || localStorage.getItem(STORAGE_KEYS.LEGACY_TASKS);
    if (!raw) {
      // First time visitor: seed with initial demo tasks so user gets an active experience right away!
      const initial = generateDemoTasks();
      saveTasksToStorage(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse tasks from localStorage:', err);
    return [];
  }
}

export function saveTasksToStorage(tasks: TaskReminder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

export function loadSettingsFromStorage(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem(STORAGE_KEYS.LEGACY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to parse settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
