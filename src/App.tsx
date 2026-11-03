/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TaskReminder,
  UserSettings,
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

export default function App() {
  const [tasks, setTasks] = useState<TaskReminder[]>(() => loadTasksFromStorage());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettingsFromStorage());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskReminder | null>(null);
  const [detailTask, setDetailTask] = useState<TaskReminder | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskReminder | null>(null);

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

  // Persist tasks on change
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  // Persist settings on change
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

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

      // If detail modal is open for this task, update it as well
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
            // Create next occurrence for upcoming schedule
            const nextOccurrenceTask: TaskReminder = {
              ...task,
              id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              deadline: nextDeadline,
              completed: false,
              completedAt: undefined,
              snoozedUntil: undefined,
              // reset checklist for next cycle
              checklist: task.checklist.map((item) => ({ ...item, completed: false })),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              completionHistory: [
                ...(task.completionHistory || []),
                new Date().toISOString(),
              ],
            };

            // Mark current as completed to preserve history
            const completedCurrent: TaskReminder = {
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
              snoozedUntil: undefined, // cancel pending snooze
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

        // Non-repeating completion
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  completed: true,
                  completedAt: new Date().toISOString(),
                  snoozedUntil: undefined, // cancel reminder
                  updatedAt: new Date().toISOString(),
                }
              : t
          )
        );
      } else {
        // Reopen completed task
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

      // Update detail view if open
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
      // Editing existing task
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
      // Creating new task
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

  // Update task details (e.g. from modal checklist interaction)
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
