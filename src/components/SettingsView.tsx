import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Globe,
  Bell,
  Volume2,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UserSettings, TaskReminder } from '../types';
import { playReminderChime } from '../utils/audio';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onLoadDemoTasks: () => void;
  onClearAllData: () => void;
  onRequestBrowserNotification: () => Promise<NotificationPermission>;
  permissionState: NotificationPermission;
  tasks: TaskReminder[];
  onImportTasks: (tasks: TaskReminder[]) => void;
}

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - UTC+5:30)' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - UTC+9)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - UTC+4)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onLoadDemoTasks,
  onClearAllData,
  onRequestBrowserNotification,
  permissionState,
  tasks,
  onImportTasks,
}) => {
  const [notificationTestStatus, setNotificationTestStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleTestSound = () => {
    playReminderChime();
  };

  const handleToggleBrowserNotifications = async () => {
    if (!settings.browserNotificationsEnabled) {
      // User is enabling: request permission
      const perm = await onRequestBrowserNotification();
      if (perm === 'granted') {
        onUpdateSettings({ ...settings, browserNotificationsEnabled: true });
        setNotificationTestStatus('Permission granted! Browser notifications are active.');
      } else if (perm === 'denied') {
        onUpdateSettings({ ...settings, browserNotificationsEnabled: false });
        setNotificationTestStatus('Permission was blocked in browser settings. Please allow notifications in site settings.');
      } else {
        onUpdateSettings({ ...settings, browserNotificationsEnabled: false });
      }
    } else {
      // Disabling
      onUpdateSettings({ ...settings, browserNotificationsEnabled: false });
      setNotificationTestStatus(null);
    }
  };

  const handleSendTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Soonzo 🎯 Test Alert', {
          body: 'Success! Your reminder alerts are configured and operating smoothly.',
          icon: '/favicon.ico',
        });
        setNotificationTestStatus('Test notification sent!');
      } catch (err) {
        setNotificationTestStatus('Could not display notification: ' + String(err));
      }
    } else {
      setNotificationTestStatus('Please enable browser notification permissions first.');
    }
  };

  // Export JSON backup
  const handleExportData = () => {
    const dataStr = JSON.stringify({ tasks, settings }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `soonzo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.tasks)) {
          onImportTasks(parsed.tasks);
          if (parsed.settings) {
            onUpdateSettings({ ...settings, ...parsed.settings });
          }
        } else if (Array.isArray(parsed)) {
          onImportTasks(parsed);
        } else {
          setImportError('Invalid format: File must contain an array of tasks.');
        }
      } catch (err) {
        setImportError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          App Settings ⚙️
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Customize themes, timezones, notification behaviors, and local storage
        </p>
      </div>

      {/* Section 1: Appearance & Visuals */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Visual Style & Theme
        </h3>

        {/* Theme mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white block">
              Color Theme
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Soft lavender, sky blue, mint, and warm cream accents
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                settings.theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                settings.theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Emoji Background pattern */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white block">
              Scattered Student Emoji Background
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Subtle decorative student emojis (📚 ✏️ 💡 🚀 🎯 🧠 💻 📝 ⏰ ✨ 🎓)
            </p>
          </div>
          <button
            onClick={() =>
              onUpdateSettings({
                ...settings,
                showEmojiBackground: !settings.showEmojiBackground,
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-hidden ${
              settings.showEmojiBackground ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            role="switch"
            aria-checked={settings.showEmojiBackground}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                settings.showEmojiBackground ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Section 2: Time & Timezone */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Timezone & Clock Format
        </h3>

        {/* Timezone */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-violet-500" />
            <span>Target Timezone (Default: Asia/Kolkata)</span>
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => onUpdateSettings({ ...settings, timezone: e.target.value })}
            className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-violet-500"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All reminder deadlines and alerts are calculated consistently and formatted in this timezone.
          </p>
        </div>

        {/* 12h vs 24h */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white block">
              Clock Display Format
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose between 12-hour (AM/PM) or military 24-hour time
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => onUpdateSettings({ ...settings, timeFormat: '12h' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                settings.timeFormat === '12h'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              12-Hour (e.g. 5:30 PM)
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, timeFormat: '24h' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                settings.timeFormat === '24h'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              24-Hour (e.g. 17:30)
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Notifications & Sound */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Notifications & Alerts
        </h3>

        {/* Browser notification toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-violet-500" />
                <span>Browser System Notifications</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current browser permission:{' '}
                <strong className="capitalize font-mono font-semibold">
                  {permissionState}
                </strong>
              </p>
            </div>
            <button
              onClick={handleToggleBrowserNotifications}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-hidden ${
                settings.browserNotificationsEnabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={settings.browserNotificationsEnabled}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.browserNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.browserNotificationsEnabled && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendTestNotification}
                className="px-3.5 py-1.5 bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 hover:bg-violet-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Send Test Notification
              </button>
            </div>
          )}

          {notificationTestStatus && (
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
              {notificationTestStatus}
            </p>
          )}
        </div>

        {/* Audio chime toggle & test */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-500" />
              <span>Reminder Sound Chime</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gentle synthesized 2-tone harmonic bell when reminders trigger
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestSound}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Test Sound 🔔
            </button>
            <button
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  soundEnabled: !settings.soundEnabled,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-hidden ${
                settings.soundEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={settings.soundEnabled}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Clear Notice on Closed-App Push Notifications */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Architecture Note: Notifications When App is Closed</span>
          </div>
          <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
            In standard modern browsers, delivering notifications when your browser or tab is completely closed requires an external Web Push Server (VAPID key pairing and background push protocol).
          </p>
          <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
            <strong>Operational in Soonzo:</strong> Real-time in-app banners, Web Audio chimes, and browser desktop notifications fire on schedule whenever Soonzo is open or kept in a pinned browser tab.
          </p>
        </div>
      </div>

      {/* Section 4: Data Storage & Management */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Data & Local Storage
        </h3>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 text-xs">
          <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-violet-900 dark:text-violet-200 mb-0.5">
              Data Stays in Your Browser
            </p>
            <p className="text-violet-800 dark:text-violet-300/80 leading-relaxed">
              All reminders, checklist items, and snooze settings are saved in this browser's Local Storage. No personal data is sent to external servers. The architecture is cleanly separated and ready for future account-based cloud sync.
            </p>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup (JSON)</span>
          </button>

          <label className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importError && (
          <p className="text-xs text-rose-500 font-medium">{importError}</p>
        )}

        {/* Demo Tasks and Reset Data */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onLoadDemoTasks}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Demo Tasks</span>
          </button>

          <div>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-medium">Are you sure?</span>
                <button
                  onClick={() => {
                    onClearAllData();
                    setShowClearConfirm(false);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Yes, Clear Everything
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
