import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { ClockIcon, UndoIcon, CheckCircleIcon, RefreshCwIcon, Trash2Icon } from './Icons';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const HistoryLogView: React.FC = () => {
  const {
    logs,
    medications,
    profiles,
    undoLog,
    resetToDefaultData,
    clearAllData,
    exportDataJSON,
    importDataJSON,
  } = useMedication();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kithmed-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported backup file successfully.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        showToast('Backup restored successfully!');
      } else {
        showToast('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    warningText: string;
    confirmText: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    itemName: '',
    warningText: '',
    confirmText: '',
    action: () => {},
  });

  const handleResetSample = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Restore Sample Profiles & Medications?',
      itemName: 'Mum & Dad Lifelong Profiles',
      warningText: 'This will reset active prescriptions and stock levels to initial demonstration values.',
      confirmText: 'Restore Sample Data',
      action: () => {
        resetToDefaultData();
        showToast('Restored sample profiles & medications.');
      },
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All App Data?',
      itemName: 'All Profiles, Prescriptions & Inventory',
      warningText: 'Are you sure you want to delete all stored medications and family profiles? This action cannot be undone.',
      confirmText: 'Clear Everything',
      action: () => {
        clearAllData();
        showToast('Cleared all data.');
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 text-white px-5 py-3 rounded-xl shadow-lg border border-stone-700 animate-in fade-in">
          <CheckCircleIcon className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Dose Activity & Inventory History
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1">
            Complete audit trail of taken doses, stock refills, and manual adjustments
          </p>
        </div>

        {/* Local Storage & Backup Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-slate-700 cursor-pointer"
          >
            Export Backup (.json)
          </button>

          <label className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-slate-700 cursor-pointer">
            <span>Import Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetSample}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 border border-teal-200 dark:border-teal-900 cursor-pointer"
            title="Reset to realistic starter data for Mum & Dad"
          >
            Reset Sample Data
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-teal-700" />
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Audit Logs ({logs.length} entries)
            </h2>
          </div>
          <span className="text-xs text-stone-500">
            Doses deducted or added are safely logged with timestamp
          </span>
        </div>

        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm divide-y divide-stone-200 dark:divide-slate-800">
              <thead className="bg-stone-50 dark:bg-slate-800/60 font-bold uppercase text-[11px] text-stone-600 dark:text-stone-300">
                <tr>
                  <th className="p-3">Time & Date</th>
                  <th className="p-3">Family Member</th>
                  <th className="p-3">Medication</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Quantity Impact</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800">
                {logs.map((log) => {
                  const med = medications.find((m) => m.id === log.medicationId);
                  const member = profiles.find((p) => p.id === log.memberId);
                  const isRestock = log.actionType === 'restock';

                  return (
                    <tr key={log.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 whitespace-nowrap text-stone-500 font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3 font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                        {member?.name || 'Member'}
                      </td>

                      <td className="p-3 font-medium text-stone-800 dark:text-stone-200">
                        {med?.name || 'Medication'}
                        {med?.brandName && (
                          <span className="text-xs text-stone-400 block font-normal">
                            Brand: {med.brandName}
                          </span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isRestock
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          }`}
                        >
                          {isRestock ? 'Pharmacy Refill' : 'Daily Dose Log'}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap font-mono font-bold">
                        {isRestock ? (
                          <span className="text-emerald-600">
                            +{Math.abs(log.tabletsDeducted)} tabs
                          </span>
                        ) : (
                          <span className="text-stone-700 dark:text-stone-300">
                            -{log.tabletsDeducted} tabs
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-stone-500 dark:text-stone-400 text-xs">
                        {log.note || '—'}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            undoLog(log.id);
                            showToast('Reverted this inventory change.');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
                          title="Undo this change and restore stock"
                        >
                          <UndoIcon className="w-3.5 h-3.5" />
                          <span>Undo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center rounded-xl bg-stone-50 dark:bg-slate-800/40 text-stone-500 text-sm">
            <p>No activity logged yet today. Taking a daily dose or restocking will create an audit entry here.</p>
          </div>
        )}
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="p-6 rounded-2xl bg-stone-100/60 dark:bg-slate-800/40 border border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
            Reset or Clear Stored Data
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            You can clear all records or restore the preloaded Mum and Dad sample profiles at any time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSample}
            className="px-3.5 py-2 text-xs font-bold text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-800 hover:bg-stone-50 border border-teal-300 dark:border-teal-800 rounded-xl cursor-pointer"
          >
            Restore Sample Profiles
          </button>
          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl cursor-pointer"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        itemName={confirmModal.itemName}
        warningText={confirmModal.warningText}
        confirmButtonText={confirmModal.confirmText}
      />
    </div>
  );
};
