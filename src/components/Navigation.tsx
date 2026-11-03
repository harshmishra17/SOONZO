import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CheckCircle,
  Settings,
  Plus,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'upcoming' | 'completed' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  pendingCount: number;
  overdueCount: number;
  completedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  pendingCount,
  overdueCount,
  completedCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      badge: overdueCount > 0 ? overdueCount : pendingCount,
      badgeColor: overdueCount > 0 ? 'bg-rose-500 text-white' : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: <CalendarDays className="w-5 h-5 shrink-0" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckCircle className="w-5 h-5 shrink-0" />,
      badge: completedCount > 0 ? completedCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/95 dark:bg-slate-900/95 border-r border-slate-200/90 dark:border-slate-800 p-6 z-20 shrink-0 sticky top-0 h-screen backdrop-blur-xs justify-between">
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-sky-500 to-mint-400 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                Soonzo
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Student Deadlines & Tasks
              </p>
            </div>
          </div>

          {/* Primary CTA Button */}
          <button
            onClick={onOpenAddModal}
            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-violet-600/25 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add reminder</span>
          </button>

          {/* Nav links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Motivational footer note in sidebar */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 dark:from-slate-800/60 dark:to-slate-800/30 border border-violet-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-800 dark:text-violet-300 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Study Tip</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Break big submissions into bite-sized checklist steps to reduce deadline stress.
          </p>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎯</span>
          <span className="font-bold text-base text-slate-900 dark:text-white">
            Soonzo
          </span>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs hover:bg-violet-700"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs relative transition-colors ${
                isActive
                  ? 'text-violet-600 dark:text-violet-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono font-bold ${
                      item.badgeColor || 'bg-violet-600 text-white'
                    }`}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
