import React from 'react';
import { Bell, X, AlertCircle, Clock } from 'lucide-react';
import { NotificationAlert, TaskReminder } from '../types';

interface InAppAlertBannerProps {
  alerts: NotificationAlert[];
  tasks: TaskReminder[];
  onDismiss: (alertId: string) => void;
  onOpenTask: (task: TaskReminder) => void;
  onSnooze: (taskId: string, option: '10m' | '1h' | 'tomorrow_morning') => void;
}

export const InAppAlertBanner: React.FC<InAppAlertBannerProps> = ({
  alerts,
  tasks,
  onDismiss,
  onOpenTask,
  onSnooze,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2.5 pointer-events-none">
      {alerts.map((alert) => {
        const matchedTask = tasks.find((t) => t.id === alert.taskId);

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-200 ${
              alert.isOverdue
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                : 'bg-white/95 dark:bg-slate-900/90 border-violet-300 dark:border-violet-800 text-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  <Bell className="w-4 h-4 animate-bounce" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Soonzo Reminder
                </span>
              </div>
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm font-semibold leading-snug mb-1">
              {alert.taskTitle}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {alert.message}
            </p>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {matchedTask && (
                <button
                  onClick={() => {
                    onOpenTask(matchedTask);
                    onDismiss(alert.id);
                  }}
                  className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
              )}
              <button
                onClick={() => {
                  onSnooze(alert.taskId, '10m');
                  onDismiss(alert.id);
                }}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                +10m
              </button>
              <button
                onClick={() => {
                  onSnooze(alert.taskId, '1h');
                  onDismiss(alert.id);
                }}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                +1h
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
