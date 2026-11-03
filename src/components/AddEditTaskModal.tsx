import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Bell,
  RotateCcw,
  Tag,
  Link as LinkIcon,
  CheckSquare,
} from 'lucide-react';
import {
  TaskReminder,
  TaskCategory,
  PriorityLevel,
  RepeatCadence,
  ReminderTimingPreset,
  ReminderTiming,
  ChecklistItem,
} from '../types';
import { isPastDeadline, toDateTimeLocalString } from '../utils/dateUtils';

interface AddEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<TaskReminder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  taskToEdit?: TaskReminder | null;
}

export const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('hackathon');
  const [deadlineLocal, setDeadlineLocal] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');
  const [repeat, setRepeat] = useState<RepeatCadence>('never');
  const [reminderPresets, setReminderPresets] = useState<ReminderTimingPreset[]>(['1_day', '1_hour']);
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Form error state
  const [errors, setErrors] = useState<{ title?: string; deadline?: string }>({});

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCategory(taskToEdit.category);
      setDeadlineLocal(toDateTimeLocalString(taskToEdit.deadline));
      setPriority(taskToEdit.priority);
      setNotes(taskToEdit.notes || '');
      setLink(taskToEdit.link || '');
      setRepeat(taskToEdit.repeat);
      setReminderPresets(taskToEdit.reminderTimes.map((r) => r.preset));
      const customRem = taskToEdit.reminderTimes.find((r) => r.preset === 'custom');
      if (customRem && customRem.customMinutes) {
        setCustomMinutes(customRem.customMinutes);
      }
      setChecklistItems(taskToEdit.checklist || []);
    } else {
      // Default to 2 days from now at 18:00
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 2);
      defaultDate.setHours(18, 0, 0, 0);

      setTitle('');
      setCategory('hackathon');
      setDeadlineLocal(toDateTimeLocalString(defaultDate.toISOString()));
      setPriority('normal');
      setNotes('');
      setLink('');
      setRepeat('never');
      setReminderPresets(['1_day', '1_hour']);
      setCustomMinutes(30);
      setChecklistItems([]);
    }
    setErrors({});
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const isSelectedDeadlinePast = deadlineLocal ? isPastDeadline(new Date(deadlineLocal).toISOString()) : false;

  const handleToggleReminderPreset = (preset: ReminderTimingPreset) => {
    if (reminderPresets.includes(preset)) {
      setReminderPresets(reminderPresets.filter((p) => p !== preset));
    } else {
      setReminderPresets([...reminderPresets, preset]);
    }
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    setChecklistItems([
      ...checklistItems,
      {
        id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: newChecklistText.trim(),
        completed: false,
      },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklistItems(checklistItems.filter((i) => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; deadline?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!deadlineLocal) {
      newErrors.deadline = 'Deadline date and time is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isoDeadline = new Date(deadlineLocal).toISOString();

    const finalReminders: ReminderTiming[] = reminderPresets.map((preset) => {
      if (preset === 'custom') {
        return { preset, customMinutes };
      }
      return { preset };
    });

    onSave({
      title: title.trim(),
      category,
      deadline: isoDeadline,
      priority,
      notes: notes.trim() || undefined,
      link: link.trim() || undefined,
      repeat,
      reminderTimes: finalReminders,
      checklist: checklistItems,
      completed: taskToEdit ? taskToEdit.completed : false,
      snoozedUntil: taskToEdit ? taskToEdit.snoozedUntil : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-add-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2
              id="modal-add-title"
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            >
              {taskToEdit ? 'Edit Reminder 🎯' : 'Add New Reminder 🎯'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Keep track of deadlines, exam milestones, and project goals
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Reminder Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Hackathon Final Submission, CS201 Midterm"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-200 dark:focus:ring-rose-950'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-violet-200 dark:focus:ring-violet-900 focus:border-violet-500'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.title}</p>
            )}
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500"
              >
                <option value="hackathon">Hackathon 🚀</option>
                <option value="submission">Submission 📝</option>
                <option value="exam">Exam 📚</option>
                <option value="personal">Personal 🌱</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="normal">🟡 Normal Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>
          </div>

          {/* Deadline Date & Time */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Deadline Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadlineLocal}
              onChange={(e) => {
                setDeadlineLocal(e.target.value);
                if (errors.deadline) setErrors({ ...errors, deadline: undefined });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 font-mono ${
                errors.deadline
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-violet-200 focus:border-violet-500'
              }`}
            />
            {errors.deadline && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.deadline}</p>
            )}

            {/* Clear past deadline warning */}
            {isSelectedDeadlinePast && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Past deadline notice:</strong> The selected date is already in the past. It will be flagged as overdue upon saving.
                </span>
              </div>
            )}
          </div>

          {/* Repeat Cadence */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-violet-500" />
              <span>Repeat Cadence</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['never', 'daily', 'weekly', 'monthly'] as RepeatCadence[]).map((cadence) => (
                <button
                  type="button"
                  key={cadence}
                  onClick={() => setRepeat(cadence)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors capitalize ${
                    repeat === cadence
                      ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                  }`}
                >
                  {cadence}
                </button>
              ))}
            </div>
            {repeat === 'monthly' && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Note: Monthly recurrence safely clamps to month-end when a target month has fewer days (e.g. Jan 31 → Feb 28).
              </p>
            )}
          </div>

          {/* Multiple Reminder Timings */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>Remind Me Beforehand</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleToggleReminderPreset('1_week')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  reminderPresets.includes('1_week')
                    ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                1 Week before
              </button>
              <button
                type="button"
                onClick={() => handleToggleReminderPreset('1_day')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  reminderPresets.includes('1_day')
                    ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                1 Day before
              </button>
              <button
                type="button"
                onClick={() => handleToggleReminderPreset('1_hour')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  reminderPresets.includes('1_hour')
                    ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                1 Hour before
              </button>
              <button
                type="button"
                onClick={() => handleToggleReminderPreset('custom')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  reminderPresets.includes('custom')
                    ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                Custom
              </button>
            </div>

            {reminderPresets.includes('custom') && (
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span>Alert</span>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-18 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md font-mono"
                />
                <span>minutes before deadline</span>
              </div>
            )}
          </div>

          {/* Optional Registration or Submission link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Portal / Registration Link (Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://devpost.com/my-hackathon or https://classroom.google.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Notes & Details (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add key info, room numbers, teammates, requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-violet-500 resize-none leading-relaxed"
            />
          </div>

          {/* Optional Preparation Checklist */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-violet-500" />
              <span>Preparation Checklist (Optional)</span>
            </label>

            {checklistItems.length > 0 && (
              <div className="space-y-1.5 mb-2.5">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(item.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add checklist step (e.g. Confirm team, submit slides)..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newChecklistText.trim()) {
                      setChecklistItems([
                        ...checklistItems,
                        {
                          id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                          text: newChecklistText.trim(),
                          completed: false,
                        },
                      ]);
                      setNewChecklistText('');
                    }
                  }
                }}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (newChecklistText.trim()) {
                    setChecklistItems([
                      ...checklistItems,
                      {
                        id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        text: newChecklistText.trim(),
                        completed: false,
                      },
                    ]);
                    setNewChecklistText('');
                  }
                }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors shrink-0"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-xs transition-colors"
            >
              {taskToEdit ? 'Save Changes' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
