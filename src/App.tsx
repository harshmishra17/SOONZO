/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TaskReminder,
  UserSettings,
  UserProfile,
} from './types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  clearAllLocalData,
} from './utils/storage';
import { generateDemoTasks } from './utils/demoData';
import { calculateNextOccurrence, calculateSnoozeTime } from './utils/dateUtils';
import { fireTaskCompletionCelebration } from './utils/celebration';
import { useReminderEngine } from './hooks/useReminderEngine';
import { authApi, tasksApi, settingsApi } from './utils/api';

import { EmojiBackground } from './components/EmojiBackground';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { UpcomingView } from './components/UpcomingView';
import { CompletedView } from './components/CompletedView';
import { SettingsView } from './components/SettingsView';

import { TaskDetailModal } from './components/TaskDetailModal';
import { AddEditTaskModal } from './components/AddEditTaskModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { InAppAlertBanner } from './components/InAppAlertBanner';
import { AuthView } from './components/auth/AuthView';
import { ImportOfflineTasksModal } from './components/auth/ImportOfflineTasksModal';
import { Mail, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [tasks, setTasks] = useState<TaskReminder[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() => loadSettingsFromStorage());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskReminder | null>(null);
  const [detailTask, setDetailTask] = useState<TaskReminder | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskReminder | null>(null);

  // Offline import prompt
  const [showImportModal, setShowImportModal] = useState(false);
  const [offlineTasks, setOfflineTasks] = useState<TaskReminder[]>([]);

  // Verification banner feedback
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  // Sync settings theme to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Check existing session on boot
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { user } = await authApi.getMe();
        if (isMounted && user) {
          setCurrentUser(user);
          await loadUserRemoteData(user);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load user's private data from backend
  const loadUserRemoteData = async (user: UserProfile) => {
    try {
      const [tasksRes, settingsRes] = await Promise.all([
        tasksApi.getTasks(),
        settingsApi.getSettings(),
      ]);

      if (tasksRes.tasks) {
        setTasks(tasksRes.tasks);
        saveTasksToStorage(tasksRes.tasks);
      }
      if (settingsRes.settings) {
        setSettings(settingsRes.settings);
        saveSettingsToStorage(settingsRes.settings);
      }

      // Check for offline tasks to ask user if they want to import
      const local = loadTasksFromStorage();
      if (local && local.length > 0 && tasksRes.tasks && tasksRes.tasks.length === 0) {
        setOfflineTasks(local);
        setShowImportModal(true);
      }
    } catch (err) {
      console.warn('Failed to fetch remote tasks, falling back to local cache:', err);
      setTasks(loadTasksFromStorage());
    }
  };

  // Sync tasks to backend and local storage
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    saveTasksToStorage(tasks);

    // Debounced sync to backend
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      tasksApi.syncTasks(tasks).catch((e) => console.warn('Background sync error:', e));
    }, 800);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [tasks, currentUser]);

  // Sync settings to backend and local storage
  useEffect(() => {
    saveSettingsToStorage(settings);
    if (currentUser) {
      settingsApi.saveSettings(settings).catch((e) => console.warn('Settings sync error:', e));
    }
  }, [settings, currentUser]);

  // Handle successful login or registration
  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    await loadUserRemoteData(user);

    // Check if offline local tasks are present to offer import
    const local = loadTasksFromStorage();
    if (local && local.length > 0) {
      setOfflineTasks(local);
      setShowImportModal(true);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout request failed:', e);
    }
    // Clear private cached state
    setCurrentUser(null);
    setTasks([]);
    clearAllLocalData();
  };

  // Handle Logout from all devices
  const handleLogoutAll = async () => {
    try {
      await authApi.logoutAll();
    } catch (e) {
      console.warn('Logout all request failed:', e);
    }
    setCurrentUser(null);
    setTasks([]);
    clearAllLocalData();
  };

  // Confirm Import of Local Tasks
  const handleConfirmImportLocal = async () => {
    try {
      const res = await tasksApi.importLocalTasks(offlineTasks);
      setTasks(res.tasks);
      saveTasksToStorage(res.tasks);
      setShowImportModal(false);
      setOfflineTasks([]);
    } catch (e) {
      console.error('Import failed:', e);
      setShowImportModal(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendStatus(null);
    try {
      const res = await authApi.resendVerification();
      setResendStatus(res.message);
    } catch (e: unknown) {
      setResendStatus(e instanceof Error ? e.message : 'Could not send verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  // Handle Snooze (only alters alert time, NEVER the actual deadline)
  const handleQuickSnooze = useCallback(
    (task: TaskReminder, option: '10m' | '1h' | 'tomorrow_morning') => {
      const snoozeUntil = calculateSnoozeTime(option, settings.timezone);

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              snoozedUntil: snoozeUntil,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        })
      );

      setDetailTask((prev) => {
        if (prev && prev.id === task.id) {
          return {
            ...prev,
            snoozedUntil: snoozeUntil,
            updatedAt: new Date().toISOString(),
          };
        }
        return prev;
      });
    },
    [settings.timezone]
  );

  const handleSnoozeById = useCallback(
    (taskId: string, option: '10m' | '1h' | 'tomorrow_morning') => {
      const target = tasks.find((t) => t.id === taskId);
      if (target) {
        handleQuickSnooze(target, option);
      }
    },
    [tasks, handleQuickSnooze]
  );

  const handleOpenTaskDetails = useCallback((task: TaskReminder) => {
    setDetailTask(task);
  }, []);

  // Reminder notification hook
  const { alerts, dismissAlert, permissionState, requestBrowserPermission } =
    useReminderEngine(
      tasks,
      settings,
      handleSnoozeById,
      handleOpenTaskDetails
    );

  // Toggle task completion
  const handleToggleComplete = useCallback(
    (task: TaskReminder) => {
      const willBeCompleted = !task.completed;

      if (willBeCompleted) {
        fireTaskCompletionCelebration();

        // Check if task repeats (daily, weekly, monthly)
        if (task.repeat !== 'never') {
          const nextDeadline = calculateNextOccurrence(task.deadline, task.repeat);

          if (nextDeadline) {
            const nextOccurrenceTask: TaskReminder = {
              ...task,
              id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              deadline: nextDeadline,
              completed: false,
              completedAt: undefined,
              snoozedUntil: undefined,
              checklist: task.checklist.map((item) => ({ ...item, completed: false })),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              completionHistory: [
                ...(task.completionHistory || []),
                new Date().toISOString(),
              ],
            };

            const completedCurrent: TaskReminder = {
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
              snoozedUntil: undefined,
              updatedAt: new Date().toISOString(),
            };

            setTasks((prev) => [
              nextOccurrenceTask,
              ...prev.map((t) => (t.id === task.id ? completedCurrent : t)),
            ]);

            setDetailTask(null);
            return;
          }
        }

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  completed: true,
                  completedAt: new Date().toISOString(),
                  snoozedUntil: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : t
          )
        );
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  completed: false,
                  completedAt: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : t
          )
        );
      }

      setDetailTask((prev) =>
        prev && prev.id === task.id
          ? {
              ...prev,
              completed: willBeCompleted,
              completedAt: willBeCompleted ? new Date().toISOString() : undefined,
              snoozedUntil: undefined,
            }
          : prev
      );
    },
    []
  );

  // Save new or edited task
  const handleSaveTask = (
    taskData: Omit<TaskReminder, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...taskData,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
      setEditingTask(null);
    } else {
      const newTask: TaskReminder = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  // Delete task
  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
    if (detailTask?.id === taskToDelete.id) {
      setDetailTask(null);
    }
    setTaskToDelete(null);
  };

  // Update task details (from checklist)
  const handleUpdateTask = (updatedTask: TaskReminder) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setDetailTask(updatedTask);
  };

  // Load demo tasks
  const handleLoadDemoTasks = () => {
    const demos = generateDemoTasks();
    setTasks(demos);
  };

  // Clear all data
  const handleClearAllData = () => {
    clearAllLocalData();
    setTasks([]);
  };

  // Clear completed tasks only
  const handleClearAllCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  // Counts for badge display
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const overdueCount = tasks.filter(
    (t) => !t.completed && new Date(t.deadline).getTime() < Date.now()
  ).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  // Initial Auth Loading Screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-sky-500 text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-violet-500/20 animate-pulse">
            🎯
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Checking Soonzo security credentials...
          </p>
        </div>
      </div>
    );
  }

  // If not signed in: Protected route redirects to AuthView
  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <EmojiBackground enabled={settings.showEmojiBackground} />
        <AuthView onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Background emojis (customizable in settings) */}
      <EmojiBackground enabled={settings.showEmojiBackground} />

      {/* Floating In-App Reminders and Chimes */}
      <InAppAlertBanner
        alerts={alerts}
        tasks={tasks}
        onDismiss={dismissAlert}
        onOpenTask={handleOpenTaskDetails}
        onSnooze={handleSnoozeById}
      />

      {/* Offline Tasks Import Modal */}
      <ImportOfflineTasksModal
        isOpen={showImportModal}
        localTasksCount={offlineTasks.length}
        onConfirmImport={handleConfirmImportLocal}
        onDismiss={() => {
          setShowImportModal(false);
          setOfflineTasks([]);
        }}
      />

      {/* Verification Notice Banner if email is not yet verified */}
      {!currentUser.emailVerified && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 shadow-xs relative z-40">
          <div className="flex items-center gap-2 max-w-2xl truncate">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950" />
            <span>
              Please verify your email (<strong>{currentUser.email}</strong>) to secure your account.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {resendStatus ? (
              <span className="font-semibold text-amber-950">{resendStatus}</span>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="px-2.5 py-1 bg-amber-950 hover:bg-black text-amber-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                {resendLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                <span>Resend Email</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen">
        {/* Navigation Sidebar / Mobile Nav */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenAddModal={() => {
            setEditingTask(null);
            setIsAddModalOpen(true);
          }}
          pendingCount={pendingCount}
          overdueCount={overdueCount}
          completedCount={completedCount}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full pb-24 md:pb-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              settings={settings}
              onOpenAddModal={() => {
                setEditingTask(null);
                setIsAddModalOpen(true);
              }}
              onOpenDetails={handleOpenTaskDetails}
              onToggleComplete={handleToggleComplete}
              onQuickSnooze={handleQuickSnooze}
              onEdit={(task) => {
                setEditingTask(task);
                setIsAddModalOpen(true);
              }}
              onDelete={(task) => setTaskToDelete(task)}
              onLoadDemoTasks={handleLoadDemoTasks}
            />
          )}

          {currentTab === 'upcoming' && (
            <UpcomingView
              tasks={tasks}
              settings={settings}
              onOpenAddModal={() => {
                setEditingTask(null);
                setIsAddModalOpen(true);
              }}
              onOpenDetails={handleOpenTaskDetails}
              onToggleComplete={handleToggleComplete}
              onQuickSnooze={handleQuickSnooze}
              onEdit={(task) => {
                setEditingTask(task);
                setIsAddModalOpen(true);
              }}
              onDelete={(task) => setTaskToDelete(task)}
            />
          )}

          {currentTab === 'completed' && (
            <CompletedView
              tasks={tasks}
              settings={settings}
              onOpenDetails={handleOpenTaskDetails}
              onToggleComplete={handleToggleComplete}
              onQuickSnooze={handleQuickSnooze}
              onEdit={(task) => {
                setEditingTask(task);
                setIsAddModalOpen(true);
              }}
              onDelete={(task) => setTaskToDelete(task)}
              onClearAllCompleted={handleClearAllCompleted}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              onLoadDemoTasks={handleLoadDemoTasks}
              onClearAllData={handleClearAllData}
              onRequestBrowserNotification={requestBrowserPermission}
              permissionState={permissionState}
              tasks={tasks}
              onImportTasks={(imported) => setTasks(imported)}
              currentUser={currentUser}
              onLogout={handleLogout}
              onLogoutAll={handleLogoutAll}
              onProfileUpdated={(updated) => setCurrentUser(updated)}
            />
          )}
        </main>
      </div>

      {/* Task Details & Preparation Checklist Modal */}
      <TaskDetailModal
        task={detailTask}
        settings={settings}
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        onUpdateTask={handleUpdateTask}
        onToggleComplete={handleToggleComplete}
        onEdit={(task) => {
          setDetailTask(null);
          setEditingTask(task);
          setIsAddModalOpen(true);
        }}
        onDelete={(task) => {
          setDetailTask(null);
          setTaskToDelete(task);
        }}
        onSnooze={handleQuickSnooze}
      />

      {/* Add / Edit Task Modal */}
      <AddEditTaskModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={editingTask}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!taskToDelete}
        task={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
