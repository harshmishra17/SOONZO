import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TaskReminder, TaskCategory, UserSettings } from '../types';
import { TaskCard } from './TaskCard';
import { formatDateTime } from '../utils/dateUtils';

interface CompletedViewProps {
  tasks: TaskReminder[];
  settings: UserSettings;
  onOpenDetails: (task: TaskReminder) => void;
  onToggleComplete: (task: TaskReminder) => void;
  onQuickSnooze: (task: TaskReminder, option: '10m' | '1h' | 'tomorrow_morning') => void;
  onEdit: (task: TaskReminder) => void;
  onDelete: (task: TaskReminder) => void;
  onClearAllCompleted: () => void;
}

export const CompletedView: React.FC<CompletedViewProps> = ({
  tasks,
  settings,
  onOpenDetails,
  onToggleComplete,
  onQuickSnooze,
  onEdit,
  onDelete,
  onClearAllCompleted,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');

  const completedTasks = useMemo(() => {
    return tasks
      .filter((t) => t.completed)
      .filter((t) => categoryFilter === 'all' || t.category === categoryFilter)
      .sort((a, b) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [tasks, categoryFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Completed Tasks</span>
            <span className="text-emerald-500">✅</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            History of successfully completed deadlines and repeating occurrences
          </p>
        </div>

        {completedTasks.length > 0 && (
          <button
            onClick={onClearAllCompleted}
            className="px-3.5 py-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Completed</span>
          </button>
        )}
      </div>

      {/* Filter strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['all', 'hackathon', 'submission', 'exam', 'personal'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-300'
            }`}
          >
            {cat === 'all' ? 'All Completed' : cat === 'hackathon' ? 'Hackathons 🚀' : cat === 'submission' ? 'Submissions 📝' : cat === 'exam' ? 'Exams 📚' : 'Personal 🌱'}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {completedTasks.length === 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No completed tasks yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Check off items from your dashboard or preparation checklist when done to see your accomplishments here!
          </p>
        </div>
      )}

      {/* Grid of completed tasks */}
      {completedTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedTasks.map((task) => (
            <div key={task.id} className="relative">
              <TaskCard
                task={task}
                settings={settings}
                onOpenDetails={onOpenDetails}
                onToggleComplete={onToggleComplete}
                onQuickSnooze={onQuickSnooze}
                onEdit={onEdit}
                onDelete={onDelete}
              />
              {task.completedAt && (
                <div className="mt-1 px-3 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <span>Finished:</span>
                  <span>{formatDateTime(task.completedAt, settings.timezone, settings.timeFormat)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
