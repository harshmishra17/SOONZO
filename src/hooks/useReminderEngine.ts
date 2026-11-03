import { useState, useEffect, useCallback, useRef } from 'react';
import { TaskReminder, UserSettings, NotificationAlert } from '../types';
import { playReminderChime } from '../utils/audio';

export function useReminderEngine(
  tasks: TaskReminder[],
  settings: UserSettings,
  onSnoozeTask: (taskId: string, snoozeOption: '10m' | '1h' | 'tomorrow_morning') => void,
  onOpenTaskDetails: (task: TaskReminder) => void
) {
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const firedAlertsRef = useRef<Set<string>>(new Set());

  // Check initial browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Request browser permission explicitly when invoked by user action
  const requestBrowserPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  // Periodic reminder checker
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();

      tasks.forEach((task) => {
        // Skip completed tasks (satisfies: cancel pending reminders when a task is completed)
        if (task.completed) {
          return;
        }

        const deadlineTime = new Date(task.deadline).getTime();
        const diffMinutes = Math.round((deadlineTime - now) / 60000);

        // Check if task was snoozed and snooze time has expired
        if (task.snoozedUntil) {
          const snoozeTime = new Date(task.snoozedUntil).getTime();
          const snoozeKey = `${task.id}-snooze-${task.snoozedUntil}`;
          if (now >= snoozeTime && !firedAlertsRef.current.has(snoozeKey)) {
            firedAlertsRef.current.add(snoozeKey);
            triggerAlert(
              task,
              `Snooze reminder: "${task.title}" is due soon!`,
              diffMinutes < 0
            );
            return;
          }
        }

        // Check 1-hour reminder
        const has1HourReminder = task.reminderTimes.some((r) => r.preset === '1_hour');
        const hourKey = `${task.id}-1h`;
        if (
          has1HourReminder &&
          diffMinutes <= 60 &&
          diffMinutes > 0 &&
          !firedAlertsRef.current.has(hourKey)
        ) {
          firedAlertsRef.current.add(hourKey);
          triggerAlert(
            task,
            `⏰ 1 hour left for: "${task.title}"`,
            false
          );
        }

        // Check 1-day reminder
        const has1DayReminder = task.reminderTimes.some((r) => r.preset === '1_day');
        const dayKey = `${task.id}-1d`;
        if (
          has1DayReminder &&
          diffMinutes <= 1440 &&
          diffMinutes > 1380 &&
          !firedAlertsRef.current.has(dayKey)
        ) {
          firedAlertsRef.current.add(dayKey);
          triggerAlert(
            task,
            `📅 Due tomorrow: "${task.title}"`,
            false
          );
        }

        // Check 1-week reminder
        const has1WeekReminder = task.reminderTimes.some((r) => r.preset === '1_week');
        const weekKey = `${task.id}-1w`;
        if (
          has1WeekReminder &&
          diffMinutes <= 10080 &&
          diffMinutes > 10020 &&
          !firedAlertsRef.current.has(weekKey)
        ) {
          firedAlertsRef.current.add(weekKey);
          triggerAlert(
            task,
            `📌 Due in 1 week: "${task.title}"`,
            false
          );
        }

        // Check exactly due / overdue condition
        const dueKey = `${task.id}-due`;
        if (
          diffMinutes <= 0 &&
          diffMinutes >= -15 && // trigger within first 15 mins of deadline passing
          !firedAlertsRef.current.has(dueKey)
        ) {
          firedAlertsRef.current.add(dueKey);
          triggerAlert(
            task,
            `🚨 Deadline reached for "${task.title}"!`,
            true
          );
        }
      });
    };

    const triggerAlert = (
      task: TaskReminder,
      message: string,
      isOverdue: boolean
    ) => {
      // Play audio chime if sound enabled
      if (settings.soundEnabled) {
        playReminderChime();
      }

      // Browser push notification if enabled
      if (
        settings.browserNotificationsEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const notif = new Notification('Soonzo 🎯 Reminder', {
            body: `${message}\nCategory: ${task.category.toUpperCase()}`,
            icon: '/favicon.ico',
          });
          notif.onclick = () => {
            window.focus();
            onOpenTaskDetails(task);
          };
        } catch (e) {
          console.warn('Browser notification invocation failed:', e);
        }
      }

      // Add to in-app alerts banner
      if (settings.inAppBannerEnabled) {
        const newAlert: NotificationAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
          deadline: task.deadline,
          message,
          timestamp: new Date().toISOString(),
          isOverdue,
        };
        setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);
      }
    };

    // Run check immediately, then every 20 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [tasks, settings, onOpenTaskDetails]);

  return {
    alerts,
    dismissAlert,
    permissionState,
    requestBrowserPermission,
  };
}
