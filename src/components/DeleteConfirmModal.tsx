import React from 'react';
import { CloseIcon, AlertTriangleIcon, Trash2Icon } from './Icons';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemSubtitle?: string;
  warningText?: string;
  confirmButtonText?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemSubtitle,
  warningText = 'You can undo this action immediately if deleted by mistake.',
  confirmButtonText = 'Delete Permanently',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Top bar with close button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Trash2Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Please confirm deletion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Item context box */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/80 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
              {itemName}
            </span>
          </div>
          {itemSubtitle && (
            <p className="text-xs text-stone-600 dark:text-stone-300 pl-6">
              {itemSubtitle}
            </p>
          )}
        </div>

        {/* Warning text */}
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
          {warningText}
        </p>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 shadow-sm transition-colors cursor-pointer flex items-center gap-2"
          >
            <Trash2Icon className="w-4 h-4" />
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
