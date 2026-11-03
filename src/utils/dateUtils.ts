import { RepeatCadence } from '../types';

/**
 * Format an ISO string to localized date/time according to timezone and 12h/24h setting
 */
export function formatDateTime(
  isoString: string,
  timezone: string = 'Asia/Kolkata',
  format: '12h' | '24h' = '12h'
): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const hour12 = format === '12h';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: hour12,
    }).format(date);
  } catch {
    // Fallback if timezone string is invalid
    return new Date(isoString).toLocaleString();
  }
}

/**
 * Format just the date (e.g. Nov 5, 2026)
 */
export function formatDateOnly(
  isoString: string,
  timezone: string = 'Asia/Kolkata'
): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return new Date(isoString).toLocaleDateString();
  }
}

/**
 * Format just the time (e.g. 5:30 PM or 17:30)
 */
export function formatTimeOnly(
  isoString: string,
  timezone: string = 'Asia/Kolkata',
  format: '12h' | '24h' = '12h'
): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: format === '12h',
    }).format(date);
  } catch {
    return new Date(isoString).toLocaleTimeString();
  }
}

/**
 * Get human-readable relative time remaining or overdue duration
 */
export function getRelativeTimeStatus(
  deadlineIso: string,
  completed: boolean = false
): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  diffMinutes: number;
} {
  if (completed) {
    return {
      label: 'Completed',
      isOverdue: false,
      isToday: false,
      diffMinutes: 0,
    };
  }

  const now = new Date();
  const deadline = new Date(deadlineIso);
  const diffMs = deadline.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);

  const isOverdue = diffMs < 0;

  // Check if today in local comparison
  const isToday =
    now.getFullYear() === deadline.getFullYear() &&
    now.getMonth() === deadline.getMonth() &&
    now.getDate() === deadline.getDate();

  if (isOverdue) {
    if (absMinutes < 1) {
      return { label: 'Due just now', isOverdue: true, isToday, diffMinutes };
    }
    if (absMinutes < 60) {
      return {
        label: `Overdue by ${absMinutes}m`,
        isOverdue: true,
        isToday,
        diffMinutes,
      };
    }
    const hours = Math.floor(absMinutes / 60);
    const remMins = absMinutes % 60;
    if (hours < 24) {
      return {
        label: `Overdue by ${hours}h ${remMins > 0 ? `${remMins}m` : ''}`.trim(),
        isOverdue: true,
        isToday,
        diffMinutes,
      };
    }
    const days = Math.floor(hours / 24);
    return {
      label: `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`,
      isOverdue: true,
      isToday,
      diffMinutes,
    };
  }

  // Not overdue yet
  if (diffMinutes < 1) {
    return { label: 'Due right now', isOverdue: false, isToday, diffMinutes };
  }
  if (diffMinutes < 60) {
    return {
      label: `Due in ${diffMinutes}m`,
      isOverdue: false,
      isToday,
      diffMinutes,
    };
  }
  const hours = Math.floor(diffMinutes / 60);
  const remMins = diffMinutes % 60;
  if (hours < 24) {
    return {
      label: `Due in ${hours}h ${remMins > 0 ? `${remMins}m` : ''}`.trim(),
      isOverdue: false,
      isToday,
      diffMinutes,
    };
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return { label: 'Due tomorrow', isOverdue: false, isToday: false, diffMinutes };
  }
  return {
    label: `Due in ${days} days`,
    isOverdue: false,
    isToday: false,
    diffMinutes,
  };
}

/**
 * Check if an ISO date string is due today (in user's timezone)
 */
export function isDueToday(isoString: string, timezone: string = 'Asia/Kolkata'): boolean {
  try {
    const taskDate = new Date(isoString);
    const now = new Date();

    const getParts = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      return formatter.format(d);
    };

    return getParts(taskDate) === getParts(now);
  } catch {
    const taskDate = new Date(isoString);
    const now = new Date();
    return (
      taskDate.getFullYear() === now.getFullYear() &&
      taskDate.getMonth() === now.getMonth() &&
      taskDate.getDate() === now.getDate()
    );
  }
}

/**
 * Check if a date is strictly in the past
 */
export function isPastDeadline(isoString: string): boolean {
  return new Date(isoString).getTime() < Date.now();
}

/**
 * Calculate the next deadline for repeating tasks
 * Predictable handling for monthly recurrence when target month has fewer days.
 * E.g., Jan 31 -> Feb 28 (or Feb 29 in leap year).
 */
export function calculateNextOccurrence(
  currentDeadlineIso: string,
  repeat: RepeatCadence
): string | null {
  if (repeat === 'never') return null;

  const current = new Date(currentDeadlineIso);
  const next = new Date(current);

  if (repeat === 'daily') {
    next.setDate(current.getDate() + 1);
  } else if (repeat === 'weekly') {
    next.setDate(current.getDate() + 7);
  } else if (repeat === 'monthly') {
    const currentDay = current.getDate();
    // Move to 1st of next month, then determine max days
    next.setMonth(current.getMonth() + 1, 1);
    const maxDaysInNextMonth = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0
    ).getDate();
    // Clamp to either original day or max available days
    next.setDate(Math.min(currentDay, maxDaysInNextMonth));
  }

  return next.toISOString();
}

/**
 * Calculate snooze deadline: 10 minutes, 1 hour, or tomorrow morning (9:00 AM)
 */
export function calculateSnoozeTime(
  option: '10m' | '1h' | 'tomorrow_morning',
  timezone: string = 'Asia/Kolkata'
): string {
  const now = new Date();

  if (option === '10m') {
    return new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  }

  if (option === '1h') {
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  }

  // Tomorrow morning at 9:00 AM in the target timezone
  try {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // Set to 9:00 AM local
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString();
  } catch {
    const fallback = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    fallback.setHours(9, 0, 0, 0);
    return fallback.toISOString();
  }
}

/**
 * Convert ISO date string to datetime-local input string (YYYY-MM-DDTHH:mm)
 */
export function toDateTimeLocalString(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return '';
  }
}
