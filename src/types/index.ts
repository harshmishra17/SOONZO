export type TaskCategory = 'hackathon' | 'submission' | 'exam' | 'personal';

export type PriorityLevel = 'low' | 'normal' | 'high';

export type RepeatCadence = 'never' | 'daily' | 'weekly' | 'monthly';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ReminderTimingPreset = '1_week' | '1_day' | '1_hour' | 'custom';

export interface ReminderTiming {
  preset: ReminderTimingPreset;
  customMinutes?: number; // Minutes before deadline if preset is 'custom'
}

export interface TaskReminder {
  id: string;
  title: string;
  category: TaskCategory;
  deadline: string; // ISO 8601 string
  priority: PriorityLevel;
  notes?: string;
  link?: string;
  reminderTimes: ReminderTiming[];
  repeat: RepeatCadence;
  checklist: ChecklistItem[];
  completed: boolean;
  completedAt?: string;
  snoozedUntil?: string; // ISO 8601 string - only alters alert time, NOT deadline!
  createdAt: string;
  updatedAt: string;
  completionHistory?: string[]; // timestamps of past occurrences for repeating tasks
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  timeFormat: '12h' | '24h';
  showEmojiBackground: boolean;
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  inAppBannerEnabled: boolean;
  defaultReminderTimings: ReminderTiming[];
  reducedMotion: boolean;
}

export interface NotificationAlert {
  id: string;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  deadline: string;
  message: string;
  timestamp: string;
  isOverdue: boolean;
}
