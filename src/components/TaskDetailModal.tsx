import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Bell,
  RotateCcw,
  Tag,
  AlertCircle,
  Edit2,
  CheckSquare,
} from 'lucide-react';
import { TaskReminder, UserSettings, ChecklistItem } from '../types';
import { formatDateTime, getRelativeTimeStatus, calculateSnoozeTime } from '../utils/dateUtils';
import { fireTaskCompletionCelebration } from '../utils/celebration';

interface TaskDetailModalProps {
  task: TaskReminder | null;
  settings: UserSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (updatedTask: TaskReminder) => void;
  onToggleComplete: (task: TaskReminder) => void;
  onEdit: (task: TaskReminder) => void;
  onDelete: (task: TaskReminder) => void;
  onSnooze: (task: TaskReminder, option: '10m' | '1h' | 'tomorrow_morning') => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  settings,
  isOpen,
  onClose,
  onUpdateTask,
  onToggleComplete,
  onEdit,
  onDelete,
  onSnooze,
}) => {
  const [newChecklistText, setNewChecklistText] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  if (!isOpen || !task) return null;

  const relative = getRelativeTimeStatus(task.deadline, task.completed);
  const totalSteps = task.checklist.length;
  const completedSteps = task.checklist.filter((i) => i.completed).length;
  const percentComplete = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Add checklist item
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: newChecklistText.trim(),
      completed: false,
    };

    const updatedTask: TaskReminder = {
      ...task,
      checklist: [...task.checklist, newItem],
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updatedTask);
    setNewChecklistText('');
  };

  // Toggle checklist item
  const handleToggleChecklist = (itemId: string) => {
    const updatedChecklist = task.checklist.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.completed;
        if (nextState) {
          fireTaskCompletionCelebration();
        }
        return { ...item, completed: nextState };
      }
      return item;
    });

    onUpdateTask({
      ...task,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  // Remove checklist item
  const handleRemoveChecklist = (itemId: string) => {
    onUpdateTask({
      ...task,
      checklist: task.checklist.filter((item) => item.id !== itemId),
      updatedAt: new Date().toISOString(),
    });
  };

  // Save edited checklist item
  const handleSaveChecklistEdit = (itemId: string) => {
    if (!editingText.trim()) return;
    onUpdateTask({
      ...task,
      checklist: task.checklist.map((item) =>
        item.id === itemId ? { ...item, text: editingText.trim() } : item
      ),
      updatedAt: new Date().toISOString(),
    });
    setEditingChecklistId(null);
    setEditingText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-task-title"
      >
        {/* Header banner */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                {task.category}
              </span>

              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                  task.priority === 'high'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    : task.priority === 'normal'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {task.priority === 'high'
                  ? '🔴 High Priority'
                  : task.priority === 'normal'
                  ? '🟡 Normal Priority'
                  : '🟢 Low Priority'}
              </span>

              {task.repeat !== 'never' && (
                <span className="text-xs text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                  <RotateCcw className="w-3 h-3" />
                  Repeats: {task.repeat}
                </span>
              )}
            </div>

            <h2
              id="modal-task-title"
              className={`text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 break-words ${
                task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
              }`}
            >
              {task.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Deadline card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Official Deadline
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  task.completed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : relative.isOverdue
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    : 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                }`}
              >
                {relative.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Calendar className="w-4 h-4 text-violet-500 shrink-0" />
              <span>
                {formatDateTime(task.deadline, settings.timezone, settings.timeFormat)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Timezone: {settings.timezone}
            </p>

            {task.snoozedUntil && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Reminder alert snoozed until:{' '}
                  <strong>
                    {formatDateTime(task.snoozedUntil, settings.timezone, settings.timeFormat)}
                  </strong>{' '}
                  (Deadline unchanged)
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {task.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Notes & Instructions
              </h3>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 leading-relaxed whitespace-pre-line">
                {task.notes}
              </p>
            </div>
          )}

          {/* Registration or Submission link */}
          {task.link && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Portal / Submission Link
              </h3>
              <a
                href={task.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors font-medium break-all"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>{task.link}</span>
              </a>
            </div>
          )}

          {/* Preparation Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-violet-500" />
                <span>Preparation Checklist</span>
              </h3>
              {totalSteps > 0 && (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {completedSteps} of {totalSteps} steps completed ({percentComplete}%)
                </span>
              )}
            </div>

            {totalSteps > 0 && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            )}

            {/* Checklist items list */}
            <div className="space-y-2 mb-3">
              {task.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
                >
                  <button
                    onClick={() => handleToggleChecklist(item.id)}
                    className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                    aria-label={item.completed ? 'Mark step incomplete' : 'Mark step complete'}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {editingChecklistId === item.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-sm bg-white dark:bg-slate-800 border border-violet-400 rounded-lg focus:outline-hidden"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveChecklistEdit(item.id);
                          if (e.key === 'Escape') setEditingChecklistId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveChecklistEdit(item.id)}
                        className="px-2.5 py-1 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => handleToggleChecklist(item.id)}
                      className={`flex-1 text-sm cursor-pointer select-none ${
                        item.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.text}
                    </span>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingChecklistId(item.id);
                        setEditingText(item.text);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Edit step"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveChecklist(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Remove step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add step input */}
            <form onSubmit={handleAddChecklist} className="flex gap-2">
              <input
                type="text"
                placeholder="Add preparation step (e.g., Prepare slides, test code)..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-violet-500 dark:focus:border-violet-400"
              />
              <button
                type="submit"
                disabled={!newChecklistText.trim()}
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Step</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleComplete(task);
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors ${
                task.completed
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{task.completed ? 'Reopen Task' : 'Mark Completed'}</span>
            </button>

            {!task.completed && (
              <div className="relative">
                <button
                  onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Snooze Alert</span>
                </button>

                {showSnoozeOptions && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSnoozeOptions(false)}
                    />
                    <div className="absolute left-0 bottom-12 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                      <div className="px-3 py-1 font-semibold uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        Snooze Alert (Deadline untouched)
                      </div>
                      <button
                        onClick={() => {
                          setShowSnoozeOptions(false);
                          onSnooze(task, '10m');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-700 dark:text-slate-200"
                      >
                        ⏱️ Snooze 10 minutes
                      </button>
                      <button
                        onClick={() => {
                          setShowSnoozeOptions(false);
                          onSnooze(task, '1h');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-700 dark:text-slate-200"
                      >
                        ⏳ Snooze 1 hour
                      </button>
                      <button
                        onClick={() => {
                          setShowSnoozeOptions(false);
                          onSnooze(task, 'tomorrow_morning');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-700 dark:text-slate-200"
                      >
                        ☀️ Snooze until tomorrow morning
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-3 py-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(task);
              }}
              className="px-3 py-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
