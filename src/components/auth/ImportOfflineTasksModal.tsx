import React from 'react';
import { UploadCloud, CheckCircle2, X } from 'lucide-react';
import { TaskReminder } from '../../types';

interface ImportOfflineTasksModalProps {
  isOpen: boolean;
  localTasksCount: number;
  onConfirmImport: () => void;
  onDismiss: () => void;
}

export const ImportOfflineTasksModal: React.FC<ImportOfflineTasksModalProps> = ({
  isOpen,
  localTasksCount,
  onConfirmImport,
  onDismiss,
}) => {
  if (!isOpen || localTasksCount === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 text-center relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center mb-4 text-2xl shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3
          id="import-modal-title"
          className="text-lg font-bold text-slate-900 dark:text-white mb-2"
        >
          Import your offline reminders?
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          We found <strong className="text-slate-900 dark:text-slate-100">{localTasksCount} task{localTasksCount === 1 ? '' : 's'}</strong> saved in this browser from your previous session. Would you like to import them into your Soonzo account now?
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onDismiss}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
          >
            No, Keep Separate
          </button>
          <button
            onClick={onConfirmImport}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Import Tasks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
