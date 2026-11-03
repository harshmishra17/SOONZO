import React, { useState, useMemo } from 'react';
import {
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { TaskReminder, TaskCategory, UserSettings } from '../types';
import { TaskCard } from './TaskCard';
import { isDueToday, isPastDeadline } from '../utils/dateUtils';

interface DashboardViewProps {
  tasks: TaskReminder[];
  settings: UserSettings;
  onOpenAddModal: () => void;
  onOpenDetails: (task: TaskReminder) => void;
  onToggleComplete: (task: TaskReminder) => void;
  onQuickSnooze: (task: TaskReminder, option: '10m' | '1h' | 'tomorrow_morning') => void;
  onEdit: (task: TaskReminder) => void;
  onDelete: (task: TaskReminder) => void;
  onLoadDemoTasks: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  settings,
  onOpenAddModal,
  onOpenDetails,
  onToggleComplete,
  onQuickSnooze,
  onEdit,
  onDelete,
  onLoadDemoTasks,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Friendly motivational message
  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  const motivationalMessage = useMemo(() => {
    if (activeTasks.length === 0) {
      return {
        greeting: 'All caught up. Enjoy your break! 🎉',
        subtitle: 'No pending deadlines right now. Take some rest or plan your next challenge.',
      };
    }
    const overdueCount = activeTasks.filter((t) => isPastDeadline(t.deadline)).length;
    if (overdueCount > 0) {
      return {
        greeting: 'Hey! Let’s make today count ☀️',
        subtitle: `You have ${overdueCount} task${overdueCount > 1 ? 's' : ''} needing attention today. Tackle them step by step!`,
      };
    }
    return {
      greeting: 'One step closer. You’ve got this! 🚀',
      subtitle: `${activeTasks.length} active assignment${activeTasks.length > 1 ? 's' : ''} in your queue. Stay focused!`,
    };
  }, [activeTasks]);

  // Filter tasks by selected category and search query (title, category, notes)
  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tasks.filter((t) => {
      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }

      // Search query filter (title, category, or notes)
      if (query) {
        const titleMatch = t.title.toLowerCase().includes(query);
        const categoryMatch = t.category.toLowerCase().includes(query);
        const notesMatch = t.notes ? t.notes.toLowerCase().includes(query) : false;
        if (!titleMatch && !categoryMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, selectedCategory, searchQuery]);

  // Group filtered tasks into:
  // 1. Overdue (pending & deadline past)
  // 2. Today's tasks (pending & due today)
  // 3. Upcoming (pending & due in future, sorted nearest first)
  const { overdueTasks, todayTasks, upcomingTasks } = useMemo(() => {
    const overdue: TaskReminder[] = [];
    const today: TaskReminder[] = [];
    const upcoming: TaskReminder[] = [];

    const nonCompleted = filteredTasks.filter((t) => !t.completed);

    // Sort by deadline nearest first
    nonCompleted.sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

    nonCompleted.forEach((task) => {
      if (isPastDeadline(task.deadline)) {
        overdue.push(task);
      } else if (isDueToday(task.deadline, settings.timezone)) {
        today.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return { overdueTasks: overdue, todayTasks: today, upcomingTasks: upcoming };
  }, [filteredTasks, settings.timezone]);

  const categoryTabs: { id: TaskCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'hackathon', label: 'Hackathons 🚀' },
    { id: 'submission', label: 'Submissions 📝' },
    { id: 'exam', label: 'Exams 📚' },
    { id: 'personal', label: 'Personal 🌱' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white p-6 sm:p-8 shadow-lg shadow-violet-500/15 overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Student Command Center</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {motivationalMessage.greeting}
          </h2>
          <p className="text-sm sm:text-base text-violet-100 leading-relaxed">
            {motivationalMessage.subtitle}
          </p>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              onClick={onOpenAddModal}
              className="py-2.5 px-5 bg-white text-violet-900 hover:bg-violet-50 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add reminder</span>
            </button>

            {tasks.length === 0 && (
              <button
                onClick={onLoadDemoTasks}
                className="py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium text-xs sm:text-sm backdrop-blur-sm transition-all"
              >
                Load demo tasks
              </button>
            )}
          </div>
        </div>

        {/* Decorative corner icon */}
        <div className="absolute right-4 bottom-2 text-7xl sm:text-8xl opacity-15 select-none pointer-events-none hidden sm:block">
          🎯
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Overdue</span>
            <AlertCircle className={`w-4 h-4 ${overdueTasks.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {overdueTasks.length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {overdueTasks.length === 0 ? 'No overdue deadlines' : 'Immediate action required'}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Due Today</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {todayTasks.length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Due before midnight
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Upcoming</span>
            <Calendar className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {upcomingTasks.length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Sorted nearest first
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {completedTasks.length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Goals checked off
          </span>
        </div>
      </div>

      {/* Search Input Bar & Category Filter Tabs */}
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

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl overflow-x-auto max-w-full">
            {categoryTabs.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {filteredTasks.length} reminder{filteredTasks.length === 1 ? '' : 's'}
            {searchQuery && ' found'}
          </div>
        </div>
      </div>

      {/* Empty State when no tasks match filter or all tasks empty */}
      {filteredTasks.length === 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4 text-2xl">
            🎯
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
            {searchQuery ? 'No matching reminders found' : 'No reminders in this view'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {searchQuery
              ? `No reminders match "${searchQuery}". Try a different keyword or reset filters.`
              : selectedCategory === 'all'
              ? 'Get started by creating your first student reminder or loading demo items.'
              : `No ${selectedCategory} reminders found. Add one now!`}
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
              <>
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  + Add Reminder
                </button>
                {tasks.length === 0 && (
                  <button
                    onClick={onLoadDemoTasks}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    Load Demo Tasks
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Clearly Labelled Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <section aria-labelledby="section-overdue">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </span>
            <h3 id="section-overdue" className="text-base font-bold text-rose-700 dark:text-rose-400">
              Overdue Tasks ({overdueTasks.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · Immediate attention needed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overdueTasks.map((task) => (
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
      )}

      {/* Section 2: Today's Tasks */}
      {todayTasks.length > 0 && (
        <section aria-labelledby="section-today">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
            <h3 id="section-today" className="text-base font-bold text-slate-900 dark:text-white">
              Today's Tasks ({todayTasks.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · Due today
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayTasks.map((task) => (
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
      )}

      {/* Section 3: Upcoming Deadlines (Sorted Nearest First) */}
      {upcomingTasks.length > 0 && (
        <section aria-labelledby="section-upcoming">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 id="section-upcoming" className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Deadlines ({upcomingTasks.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · Sorted nearest first
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingTasks.map((task) => (
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
      )}
    </div>
  );
};
