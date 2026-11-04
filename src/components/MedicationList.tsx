import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { Medication } from '../types';
import {
  PillIcon,
  SearchIcon,
  AlertTriangleIcon,
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TagIcon,
  UndoIcon,
} from './Icons';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  getScheduleDueStatus,
  formatTablets,
  formatScheduleDescription,
  isMedDueOnDate,
} from '../utils/scheduleUtils';

interface MedicationListProps {
  onOpenAddMedication: () => void;
  onOpenEditMedication: (medication: Medication) => void;
  onOpenRestockModal: (medication: Medication) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  onOpenAddMedication,
  onOpenEditMedication,
  onOpenRestockModal,
}) => {
  const {
    profiles,
    medications,
    calculateDaysRemaining,
    isLowStock,
    isCriticalStock,
    logDailySupply,
    isLoggedToday,
    deleteMedication,
    restoreMedication,
  } = useMedication();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'lowStock' | 'adequate'>('all');
  const [expandedAlts, setExpandedAlts] = useState<Record<string, boolean>>({});
  const [medToDelete, setMedToDelete] = useState<Medication | null>(null);
  const [recentlyDeletedMed, setRecentlyDeletedMed] = useState<Medication | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const confirmDeleteMed = () => {
    if (!medToDelete) return;
    const deleted = deleteMedication(medToDelete.id);
    if (deleted) {
      setRecentlyDeletedMed(deleted);
      showToast(`Removed ${deleted.name}.`);
    }
    setMedToDelete(null);
  };

  const handleUndo = () => {
    if (recentlyDeletedMed) {
      restoreMedication(recentlyDeletedMed);
      showToast(`Restored ${recentlyDeletedMed.name}!`);
      setRecentlyDeletedMed(null);
    }
  };

  const toggleAlt = (id: string) => {
    setExpandedAlts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredMeds = medications.filter((med) => {
    // member filter
    if (filterMemberId !== 'all' && med.memberId !== filterMemberId) return false;

    // status filter
    const isLow = isLowStock(med);
    if (filterStatus === 'lowStock' && !isLow) return false;
    if (filterStatus === 'adequate' && isLow) return false;

    // search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = med.name.toLowerCase().includes(q);
      const matchBrand = med.brandName.toLowerCase().includes(q);
      const matchPurpose = med.purpose.toLowerCase().includes(q);
      const matchAlt = med.alternativeBrands?.some((a) => a.name.toLowerCase().includes(q));
      return matchName || matchBrand || matchPurpose || matchAlt;
    }

    return true;
  }).sort((a, b) => {
    if (filterMemberId === 'all' && a.memberId !== b.memberId) {
      return a.memberId.localeCompare(b.memberId);
    }
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Medication & Inventory Directory
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1">
            All active prescriptions, tablet inventory counts, and out-of-stock alternative brands
          </p>
        </div>

        <button
          onClick={onOpenAddMedication}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add New Medication</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, brand, or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-teal-600"
          />
        </div>

        {/* Member filter */}
        <div>
          <select
            value={filterMemberId}
            onChange={(e) => setFilterMemberId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-teal-600 font-semibold"
          >
            <option value="all">All Family Members ({profiles.length})</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.relationship})
              </option>
            ))}
          </select>
        </div>

        {/* Stock status filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-teal-600 font-semibold"
          >
            <option value="all">All Stock Statuses</option>
            <option value="lowStock">Needs Restocking (Below Alert Limit)</option>
            <option value="adequate">Adequately Stocked</option>
          </select>
        </div>
      </div>

      {/* Medication Table / List */}
      {filteredMeds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeds.map((med) => {
            const member = profiles.find((p) => p.id === med.memberId);
            const daysLeft = calculateDaysRemaining(med);
            const low = isLowStock(med);
            const crit = isCriticalStock(med);
            const taken = isLoggedToday(med);
            const isAltOpen = !!expandedAlts[med.id];
            const { isDueToday, nextDueText } = getScheduleDueStatus(med);
            const schedDesc = formatScheduleDescription(med);

            return (
              <div
                key={med.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-xs ${
                  crit
                    ? 'border-rose-400 dark:border-rose-800'
                    : low
                    ? 'border-amber-300 dark:border-amber-700'
                    : 'border-stone-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-400">
                      {member?.name || 'Member'} · {schedDesc}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!isDueToday && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-stone-100 dark:bg-slate-800 text-stone-500">
                          {nextDueText}
                        </span>
                      )}
                      {low && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-rose-600 text-white flex items-center gap-1">
                          <AlertTriangleIcon className="w-3 h-3" />
                          <span>Restock</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                    {med.name} {med.dosageStrength}
                  </h3>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    Brand: <span className="text-teal-700 dark:text-teal-300">{med.brandName}</span>
                  </p>

                  <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 italic line-clamp-2">
                    "{med.purpose}"
                  </p>

                  {/* Stock Gauge Box */}
                  <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100">
                        {formatTablets(med.currentStock)} tabs
                      </span>
                      <span
                        className={`text-sm font-black font-mono ${
                          crit
                            ? 'text-rose-600'
                            : low
                            ? 'text-amber-600'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {daysLeft} days left
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Rate: {formatTablets(med.dailyTotalTablets)} tab · {schedDesc}</span>
                      <span>Alert at $\le$ {med.lowStockThresholdDays}d</span>
                    </div>
                  </div>

                  {/* Alternative brands indicator */}
                  {med.alternativeBrands && med.alternativeBrands.length > 0 && (
                    <div className="mt-2.5">
                      <button
                        onClick={() => toggleAlt(med.id)}
                        className="text-xs font-semibold text-teal-700 dark:text-teal-400 flex items-center justify-between w-full hover:underline cursor-pointer"
                      >
                        <span className="flex items-center gap-1">
                          <TagIcon className="w-3 h-3" />
                          <span>{med.alternativeBrands.length} Alternative Brands</span>
                        </span>
                        {isAltOpen ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                      </button>

                      {isAltOpen && (
                        <div className="mt-2 p-2.5 rounded-lg bg-teal-50 dark:bg-slate-800 border border-teal-200 dark:border-teal-900/40 text-[11px] space-y-1">
                          {med.alternativeBrands.map((alt) => (
                            <div key={alt.id} className="text-stone-800 dark:text-stone-200">
                              <span className="font-bold">• {alt.name}</span>
                              {alt.notes && <span className="text-stone-500 block pl-2 italic">{alt.notes}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => logDailySupply(med.id)}
                    disabled={taken}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      taken
                        ? 'bg-stone-100 dark:bg-slate-800 text-stone-400 cursor-not-allowed'
                        : isDueToday
                        ? 'bg-teal-700 hover:bg-teal-800 text-white'
                        : 'bg-stone-800 hover:bg-stone-900 text-white'
                    }`}
                  >
                    {taken ? 'Taken' : isDueToday ? `-1 Dose (${formatTablets(med.dailyTotalTablets)})` : `Off-Schedule (${formatTablets(med.dailyTotalTablets)})`}
                  </button>

                  <button
                    onClick={() => onOpenRestockModal(med)}
                    className="py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                  >
                    + Restock
                  </button>

                  <button
                    onClick={() => onOpenEditMedication(med)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Edit"
                  >
                    <Edit3Icon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setMedToDelete(med)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Delete Medication"
                  >
                    <Trash2Icon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
          <p className="text-stone-500 text-sm">No medications match your filter criteria.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!medToDelete}
        onClose={() => setMedToDelete(null)}
        onConfirm={confirmDeleteMed}
        title="Delete Medication?"
        itemName={medToDelete ? `${medToDelete.name} (${medToDelete.brandName})` : ''}
        itemSubtitle={
          medToDelete
            ? `Assigned to ${profiles.find((p) => p.id === medToDelete.memberId)?.name || 'Family Member'} · ${formatTablets(medToDelete.currentStock)} tablets left`
            : undefined
        }
        warningText="This will remove the medication from active prescription tracking. You can undo this immediately using the notification toast."
        confirmButtonText="Delete Medication"
      />

      {/* Toast Feedback with Undo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 text-white px-5 py-3.5 rounded-xl shadow-lg border border-stone-700 animate-in fade-in">
          <CheckCircleIcon className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          {recentlyDeletedMed && (
            <button
              onClick={handleUndo}
              className="ml-2 px-3 py-1 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <UndoIcon className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
