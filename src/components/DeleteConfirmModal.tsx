import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { TaskReminder } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  task: TaskReminder | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  task,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden text-center"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3
          id="delete-dialog-title"
          className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2"
        >
          Delete this reminder?
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-200 font-semibold">"{task.title}"</strong>? Any pending alerts and checklist steps will be removed.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            Delete Reminder
          </button>
        </div>
      </div>
    </div>
  );
};
