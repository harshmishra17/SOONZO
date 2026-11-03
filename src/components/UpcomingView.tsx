import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Plus, Filter, Search, X } from 'lucide-react';
import { TaskReminder, TaskCategory, UserSettings } from '../types';
import { TaskCard } from './TaskCard';
import { isDueToday, isPastDeadline } from '../utils/dateUtils';

interface UpcomingViewProps {
  tasks: TaskReminder[];
  settings: UserSettings;
  onOpenAddModal: () => void;
  onOpenDetails: (task: TaskReminder) => void;
  onToggleComplete: (task: TaskReminder) => void;
  onQuickSnooze: (task: TaskReminder, option: '10m' | '1h' | 'tomorrow_morning') => void;
  onEdit: (task: TaskReminder) => void;
  onDelete: (task: TaskReminder) => void;
}

export const UpcomingView: React.FC<UpcomingViewProps> = ({
  tasks,
  settings,
  onOpenAddModal,
  onOpenDetails,
  onToggleComplete,
  onQuickSnooze,
  onEdit,
  onDelete,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter pending tasks sorted by nearest deadline and matching search
  const pendingTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tasks
      .filter((t) => !t.completed)
      .filter((t) => categoryFilter === 'all' || t.category === categoryFilter)
      .filter((t) => {
        if (!query) return true;
        const titleMatch = t.title.toLowerCase().includes(query);
        const categoryMatch = t.category.toLowerCase().includes(query);
        const notesMatch = t.notes ? t.notes.toLowerCase().includes(query) : false;
        return titleMatch || categoryMatch || notesMatch;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [tasks, categoryFilter, searchQuery]);

  // Group by time frame: Overdue, Today, Tomorrow, This Week (next 7 days), Later
  const groups = useMemo(() => {
    const overdue: TaskReminder[] = [];
    const today: TaskReminder[] = [];
    const tomorrow: TaskReminder[] = [];
    const thisWeek: TaskReminder[] = [];
    const later: TaskReminder[] = [];

    const now = new Date();
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const weekLater = new Date(now);
    weekLater.setDate(weekLater.getDate() + 7);

    pendingTasks.forEach((task) => {
      const d = new Date(task.deadline);
      if (isPastDeadline(task.deadline)) {
        overdue.push(task);
      } else if (isDueToday(task.deadline, settings.timezone)) {
        today.push(task);
      } else if (
        d.getDate() === tomorrowDate.getDate() &&
        d.getMonth() === tomorrowDate.getMonth() &&
        d.getFullYear() === tomorrowDate.getFullYear()
      ) {
        tomorrow.push(task);
      } else if (d.getTime() <= weekLater.getTime()) {
        thisWeek.push(task);
      } else {
        later.push(task);
      }
    });

    return [
      { id: 'overdue', title: 'Overdue Deadlines', count: overdue.length, tasks: overdue, color: 'text-rose-600 dark:text-rose-400' },
      { id: 'today', title: 'Due Today', count: today.length, tasks: today, color: 'text-amber-600 dark:text-amber-400' },
      { id: 'tomorrow', title: 'Due Tomorrow', count: tomorrow.length, tasks: tomorrow, color: 'text-sky-600 dark:text-sky-400' },
      { id: 'thisWeek', title: 'This Week', count: thisWeek.length, tasks: thisWeek, color: 'text-violet-600 dark:text-violet-400' },
      { id: 'later', title: 'Later & Ongoing', count: later.length, tasks: later, color: 'text-slate-700 dark:text-slate-300' },
    ].filter((g) => g.count > 0);
  }, [pendingTasks, settings.timezone]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Upcoming Deadlines 🗓️
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chronological timeline sorted nearest first
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Search Input Bar & Filter Strip */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks by title, category, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-400/30 focus:border-violet-500 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter strip */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['all', 'hackathon', 'submission', 'exam', 'personal'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-violet-300'
                }`}
              >
                {cat === 'all' ? 'All Deadlines' : cat === 'hackathon' ? 'Hackathons 🚀' : cat === 'submission' ? 'Submissions 📝' : cat === 'exam' ? 'Exams 📚' : 'Personal 🌱'}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {pendingTasks.length} deadline{pendingTasks.length === 1 ? '' : 's'}
            {searchQuery && ' found'}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-violet-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {searchQuery ? 'No matching deadlines found' : 'No upcoming deadlines'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            {searchQuery
              ? `No upcoming deadlines match "${searchQuery}". Try a different search term or category.`
              : 'Your schedule is currently clear! Add a new hackathon, exam, or submission reminder.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold"
              >
                + Add Reminder
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chronological Groups */}
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.id} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${group.color}`}>
                {group.title}
              </h3>
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                ({group.count})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  settings={settings}
                  onOpenDetails={onOpenDetails}
                  onToggleComplete={onToggleComplete}
                  onQuickSnooze={onQuickSnooze}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
