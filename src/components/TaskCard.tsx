import React from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertCircle,
  Bell,
  MoreVertical,
  RotateCcw,
  ListTodo,
} from 'lucide-react';
import { TaskReminder, UserSettings } from '../types';
import { formatDateTime, getRelativeTimeStatus } from '../utils/dateUtils';

interface TaskCardProps {
  task: TaskReminder;
  settings: UserSettings;
  onOpenDetails: (task: TaskReminder) => void;
  onToggleComplete: (task: TaskReminder) => void;
  onQuickSnooze: (task: TaskReminder, option: '10m' | '1h' | 'tomorrow_morning') => void;
  onEdit: (task: TaskReminder) => void;
  onDelete: (task: TaskReminder) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  settings,
  onOpenDetails,
  onToggleComplete,
  onQuickSnooze,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = React.useState(false);

  const relative = getRelativeTimeStatus(task.deadline, task.completed);
  const totalChecklist = task.checklist.length;
  const completedChecklist = task.checklist.filter((c) => c.completed).length;

  const getCategoryTheme = () => {
    switch (task.category) {
      case 'hackathon':
        return {
          label: 'Hackathon 🚀',
          badgeBg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/50',
          accent: 'border-l-violet-400',
        };
      case 'submission':
        return {
          label: 'Submission 📝',
          badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
          accent: 'border-l-sky-400',
        };
      case 'exam':
        return {
          label: 'Exam 📚',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
          accent: 'border-l-amber-400',
        };
      case 'personal':
      default:
        return {
          label: 'Personal 🌱',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
          accent: 'border-l-emerald-400',
        };
    }
  };

  const categoryTheme = getCategoryTheme();

  const getPriorityLabel = () => {
    switch (task.priority) {
      case 'high':
        return {
          text: 'High Priority',
          dot: 'bg-rose-500',
          textClass: 'text-rose-700 dark:text-rose-400',
        };
      case 'normal':
        return {
          text: 'Normal Priority',
          dot: 'bg-amber-500',
          textClass: 'text-amber-700 dark:text-amber-400',
        };
      case 'low':
      default:
        return {
          text: 'Low Priority',
          dot: 'bg-emerald-500',
          textClass: 'text-emerald-700 dark:text-emerald-400',
        };
    }
  };

  const priorityMeta = getPriorityLabel();

  return (
    <div
      className={`group relative rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md ${
        task.completed
          ? 'border-slate-200 dark:border-slate-800 opacity-75'
          : relative.isOverdue
          ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-200 dark:ring-rose-950'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700/60'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top metadata row */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${categoryTheme.badgeBg}`}
            >
              {categoryTheme.label}
            </span>

            {/* Priority with text label and dot */}
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${priorityMeta.dot}`}
                aria-hidden="true"
              />
              <span className={`font-medium ${priorityMeta.textClass}`}>
                {priorityMeta.text}
              </span>
            </div>

            {task.repeat !== 'never' && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />
                <span className="capitalize">{task.repeat}</span>
              </span>
            )}
          </div>

          {/* Action menu dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="More task options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-7 w-38 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-30 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenDetails(task);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Edit Reminder
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(task);
                    }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    Delete Task
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title and completion trigger */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggleComplete(task)}
            className="mt-0.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors shrink-0 focus-visible:outline-hidden"
            title={task.completed ? 'Mark uncompleted' : 'Mark completed'}
            aria-label={task.completed ? 'Reopen task' : 'Mark task completed'}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 hover:scale-110 transition-transform" />
            )}
          </button>

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onOpenDetails(task)}
          >
            <h3
              className={`text-base font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-100 ${
                task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
              }`}
            >
              {task.title}
            </h3>

            {task.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Checklist Progress if applicable */}
        {totalChecklist > 0 && (
          <div
            className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 cursor-pointer"
            onClick={() => onOpenDetails(task)}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                <span>
                  {completedChecklist} of {totalChecklist} steps completed
                </span>
              </span>
              <span className="font-mono text-[11px] font-medium">
                {Math.round((completedChecklist / totalChecklist) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-violet-500 dark:bg-violet-400 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(completedChecklist / totalChecklist) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom row: Deadline info & Quick actions */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {/* Deadline & countdown badge */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDateTime(task.deadline, settings.timezone, settings.timeFormat)}
              </span>
            </span>

            {/* Time remaining indicator */}
            {!task.completed && (
              <span
                className={`font-medium px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
                  relative.isOverdue
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold'
                    : relative.isToday
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {relative.isOverdue && <AlertCircle className="w-3 h-3" />}
                {relative.label}
              </span>
            )}
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            {task.link && (
              <a
                href={task.link}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Open registration or submission link"
                aria-label="Open external link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {!task.completed && (
              <div className="relative">
                <button
                  onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                  className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                  title="Snooze reminder"
                  aria-label="Snooze reminder alert"
                >
                  <Bell className="w-3 h-3 text-amber-500" />
                  <span>Snooze</span>
                </button>

                {showSnoozeMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowSnoozeMenu(false)}
                    />
                    <div className="absolute right-0 bottom-8 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs">
                      <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        Snooze Alert Only
                      </div>
                      <button
                        onClick={() => {
                          setShowSnoozeMenu(false);
                          onQuickSnooze(task, '10m');
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-700 dark:text-slate-200"
                      >
                        ⏱️ 10 minutes
                      </button>
                      <button
                        onClick={() => {
                          setShowSnoozeMenu(false);
                          onQuickSnooze(task, '1h');
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-700 dark:text-slate-200"
                      >
                        ⏳ 1 hour
                      </button>
                      <button
                        onClick={() => {
                          setShowSnoozeMenu(false);
                          onQuickSnooze(task, 'tomorrow_morning');
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-slate-700 dark:text-slate-200"
                      >
                        ☀️ Tomorrow morning (9 AM)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => onOpenDetails(task)}
              className="px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/60 rounded-lg transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
