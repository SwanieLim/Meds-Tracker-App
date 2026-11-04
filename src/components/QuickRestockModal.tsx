import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { Medication } from '../types';
import { CloseIcon, PlusIcon, PillIcon, CheckCircleIcon } from './Icons';
import { formatTablets, calculateCalendarDaysRemaining } from '../utils/scheduleUtils';

interface QuickRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({
  isOpen,
  onClose,
  medication,
}) => {
  const { restockMedication, calculateDaysRemaining } = useMedication();

  const [additionalCount, setAdditionalCount] = useState<number>(30);
  const [restockNote, setRestockNote] = useState<string>('');

  if (!isOpen || !medication) return null;

  const currentDays = calculateDaysRemaining(medication);
  const newStock = Math.round((medication.currentStock + additionalCount) * 100) / 100;
  const newDays = calculateCalendarDaysRemaining({ ...medication, currentStock: newStock });

  const presets = [
    { label: '+30 Tabs (1 Mo)', count: 30 },
    { label: '+60 Tabs (2 Mo)', count: 60 },
    { label: '+90 Tabs (3 Mo)', count: 90 },
    { label: '+100 Box', count: 100 },
  ];

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (additionalCount <= 0) return;

    restockMedication(
      medication.id,
      additionalCount,
      restockNote.trim() || `Refilled +${additionalCount} tablets`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-800 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <PlusIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                Restock Medication
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Update inventory count after picking up a pharmacy refill
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Medication Info Strip */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-1">
          <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
            {medication.name}
          </h3>
          <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">
            Brand: {medication.brandName} {medication.dosageStrength && `· ${medication.dosageStrength}`}
          </p>
          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span>Current: {formatTablets(medication.currentStock)} tabs left</span>
            <span>({currentDays} days supply)</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
            Quick Pack Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.count}
                type="button"
                onClick={() => setAdditionalCount(preset.count)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  additionalCount === preset.count
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Quantity */}
        <form onSubmit={handleRestock} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Tablets Added to Inventory
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={additionalCount}
              onChange={(e) => setAdditionalCount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 text-lg font-bold font-mono rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 focus:outline-teal-600"
              required
            />
          </div>

          {/* Real-time projection preview */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                Projected New Inventory
              </span>
              <span className="text-2xl font-black font-mono text-emerald-950 dark:text-emerald-100">
                {formatTablets(newStock)} tablets
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                Supply Coverage
              </span>
              <span className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                {newDays} days
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Refill Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Picked up 1 box from Guardian Pharmacy"
              value={restockNote}
              onChange={(e) => setRestockNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 text-sm"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 shadow-sm transition-colors cursor-pointer"
            >
              Confirm Restock (+{additionalCount} tabs)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
