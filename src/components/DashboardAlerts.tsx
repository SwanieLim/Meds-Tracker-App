import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { Medication, FamilyMember } from '../types';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  PillIcon,
  RefreshCwIcon,
  PrinterIcon,
  ClockIcon,
  UndoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from './Icons';
import {
  getScheduleDueStatus,
  formatTablets,
  formatScheduleDescription,
  isMedDueOnDate,
} from '../utils/scheduleUtils';

interface DashboardAlertsProps {
  onOpenRestockModal: (medication: Medication) => void;
  onOpenAddMedication: () => void;
  onOpenPrintSheet: () => void;
  onSelectMember: (memberId: string) => void;
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  onOpenRestockModal,
  onOpenAddMedication,
  onOpenPrintSheet,
  onSelectMember,
}) => {
  const {
    profiles,
    medications,
    logs,
    calculateDaysRemaining,
    isLowStock,
    isCriticalStock,
    getLowStockMedications,
    logDailySupply,
    logAllDailySuppliesForMember,
    undoLog,
    isLoggedToday,
  } = useMedication();

  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const lowStockItems = getLowStockMedications();
  const criticalCount = lowStockItems.filter((item) => aCritical(item.daysRemaining)).length;

  function aCritical(days: number) {
    return days <= 3;
  }

  const toggleAlternatives = (medId: string) => {
    setExpandedAlternatives((prev) => ({
      ...prev,
      [medId]: !prev[medId],
    }));
  };

  const handleTakeDose = (med: Medication) => {
    logDailySupply(med.id);
    showToast(`Logged 1-day supply for ${med.name}. Stock updated.`);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Profile-level summaries
  const todayDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 text-white px-5 py-3.5 rounded-xl shadow-lg border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircleIcon className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Header Info Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Family Refill Alerts & Medication Dashboard
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1">
            Tracking active lifelong prescriptions for your household · Today is {todayDate}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenPrintSheet}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PrinterIcon className="w-4 h-4 text-stone-500" />
            <span>Pharmacy Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Urgent Restock Stat */}
        <div className={`p-5 rounded-2xl border transition-all ${
          criticalCount > 0
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 shadow-xs'
            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
            <span>Critical Refills</span>
            <AlertTriangleIcon className={`w-4 h-4 ${criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl font-bold tabular-nums font-mono ${
              criticalCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-stone-900 dark:text-stone-100'
            }`}>
              {criticalCount}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              $\le$ 3 days remaining
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
            {criticalCount > 0 ? 'Immediate pharmacy refill needed' : 'No critical emergencies'}
          </p>
        </div>

        {/* Low Stock Warning Stat */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
            <span>Refill Watchlist</span>
            <PillIcon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold tabular-nums font-mono text-amber-600 dark:text-amber-400">
              {lowStockItems.length}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              below set threshold
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
            Across {profiles.length} family profiles
          </p>
        </div>

        {/* Total Active Prescriptions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
            <span>Active Prescriptions</span>
            <PillIcon className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold tabular-nums font-mono text-stone-900 dark:text-stone-100">
              {medications.filter((m) => m.active).length}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              lifelong regimens
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
            Active daily monitoring
          </p>
        </div>

        {/* Today's Taken Status */}
        {(() => {
          const activeScheduledToday = medications.filter((m) => m.active && isMedDueOnDate(m, new Date()));
          const takenScheduledCount = activeScheduledToday.filter((m) => isLoggedToday(m)).length;
          return (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
                <span>Today's Doses Logged</span>
                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                  {takenScheduledCount}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  of {activeScheduledToday.length} scheduled today
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                {activeScheduledToday.length === 0
                  ? 'No medications scheduled for today'
                  : 'Deducts inventory automatically'}
              </p>
            </div>
          );
        })()}
      </div>

      {/* CENTRAL "REFILL REMINDER" SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                Central Refill Reminders
              </h2>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Medications that have dropped below their low-stock threshold and require restocking
            </p>
          </div>

          {lowStockItems.length > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-900 self-start sm:self-auto">
              {lowStockItems.length} Medication{lowStockItems.length > 1 ? 's' : ''} Need Restocking
            </span>
          )}
        </div>

        {/* When items are low stock */}
        {lowStockItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStockItems.map(({ medication: med, member, daysRemaining }) => {
              const isCrit = daysRemaining <= 3;
              const hasTakenToday = isLoggedToday(med);
              const isAltExpanded = !!expandedAlternatives[med.id];
              const { isDueToday, nextDueText } = getScheduleDueStatus(med);
              const scheduleDesc = formatScheduleDescription(med);

              return (
                <div
                  key={med.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCrit
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 shadow-sm'
                      : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 shadow-sm'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      {/* Family Member Tag */}
                      <button
                        onClick={() => onSelectMember(member.id)}
                        className="text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                        <span>{member.name}</span>
                        <span className="text-stone-400 font-normal">({member.relationship})</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {!isDueToday && (
                          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-slate-700">
                            Not Scheduled Today ({nextDueText})
                          </span>
                        )}
                        {/* Explicit "Time to Restock!" Warning Banner */}
                        <span
                          className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md flex items-center gap-1.5 ${
                            isCrit
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-amber-600 text-white shadow-xs'
                          }`}
                        >
                          <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Time to Restock!</span>
                        </span>
                      </div>
                    </div>

                    {/* Medication Names */}
                    <div className="mt-1">
                      <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                        {med.name} {med.dosageStrength}
                      </h3>
                      <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">
                        Brand: {med.brandName}
                      </p>
                    </div>

                    {/* Purpose Statement */}
                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 italic">
                      "{med.purpose}"
                    </p>

                    {/* Inventory Gauge Box */}
                    <div className="mt-4 p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
                        <span>Current Inventory</span>
                        <span>Alert Threshold: {med.lowStockThresholdDays} days</span>
                      </div>

                      <div className="mt-2 flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl font-bold tabular-nums font-mono text-stone-900 dark:text-stone-100">
                            {formatTablets(med.currentStock)}
                          </span>
                          <span className="text-sm text-stone-500 dark:text-stone-400 ml-1">
                            tablet{med.currentStock !== 1 ? 's' : ''} left
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xl font-black tabular-nums font-mono ${
                              isCrit ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 w-full h-2 rounded-full bg-stone-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            isCrit ? 'bg-rose-600' : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (daysRemaining / Math.max(1, med.lowStockThresholdDays)) * 100)}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                        <span>Dosage: {med.dosageInstructions}</span>
                        <span>
                          ({formatTablets(med.dailyTotalTablets)} tab/dose · {scheduleDesc})
                        </span>
                      </div>
                    </div>

                    {/* Dedicated Alternative Brands Dropdown / Preview */}
                    {med.alternativeBrands && med.alternativeBrands.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleAlternatives(med.id)}
                          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-900 hover:underline cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <PillIcon className="w-3.5 h-3.5" />
                            <span>
                              {med.alternativeBrands.length} Alternative Brand
                              {med.alternativeBrands.length > 1 ? 's' : ''} available if out of stock
                            </span>
                          </span>
                          {isAltExpanded ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )}
                        </button>

                        {isAltExpanded && (
                          <div className="mt-2 p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-teal-200 dark:border-teal-900/50 space-y-2 text-xs animate-in fade-in duration-150">
                            <p className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[11px]">
                              Safe Substitutes (Show to Pharmacist):
                            </p>
                            <ul className="space-y-1.5 divide-y divide-stone-100 dark:divide-slate-800">
                              {med.alternativeBrands.map((alt) => (
                                <li key={alt.id} className="pt-1.5 first:pt-0">
                                  <div className="flex items-center justify-between font-semibold text-stone-900 dark:text-stone-100">
                                    <span>{alt.name}</span>
                                    {alt.manufacturer && (
                                      <span className="text-stone-400 font-normal text-[11px]">
                                        {alt.manufacturer}
                                      </span>
                                    )}
                                  </div>
                                  {alt.notes && (
                                    <p className="text-stone-600 dark:text-stone-400 text-[11px] mt-0.5">
                                      {alt.notes}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-stone-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenRestockModal(med)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Restock Medication</span>
                    </button>

                    <button
                      onClick={() => handleTakeDose(med)}
                      disabled={hasTakenToday}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                        hasTakenToday
                          ? 'bg-stone-100 dark:bg-slate-800 text-stone-400 border-stone-200 dark:border-slate-700 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 hover:bg-stone-50 border-stone-300 dark:border-slate-700'
                      }`}
                      title={
                        hasTakenToday
                          ? "Today's supply has already been logged"
                          : isDueToday
                          ? `Deduct today's dose (${formatTablets(med.dailyTotalTablets)} tab)`
                          : `Take off-schedule dose (${formatTablets(med.dailyTotalTablets)} tab)`
                      }
                    >
                      {hasTakenToday ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                          <span>Today's Dose Taken</span>
                        </>
                      ) : isDueToday ? (
                        <>
                          <PillIcon className="w-4 h-4 text-teal-600" />
                          <span>-1 Day Supply ({formatTablets(med.dailyTotalTablets)} tab)</span>
                        </>
                      ) : (
                        <>
                          <PillIcon className="w-4 h-4 text-stone-500" />
                          <span>Off-Schedule Dose ({formatTablets(med.dailyTotalTablets)} tab)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty / Safe state */
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              All Prescriptions Adequately Stocked!
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
              None of your family members' active medications are currently below their low-stock thresholds.
            </p>
          </div>
        )}
      </section>

      {/* QUICK DAILY LOGGING STRIP FOR MUM & DAD */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
              Today's Quick Medication Checkoff
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              One-click logging to deduct today's supplies and maintain an accurate daily tablet count
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((member) => {
            const memberMeds = medications.filter((m) => m.memberId === member.id && m.active);
            const dueMeds = memberMeds.filter((m) => isMedDueOnDate(m, new Date()));
            const pendingDueMeds = dueMeds.filter((m) => !isLoggedToday(m));
            const takenDueMeds = dueMeds.filter((m) => isLoggedToday(m));
            const allTaken = dueMeds.length > 0 && pendingDueMeds.length === 0;

            return (
              <div
                key={member.id}
                className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-800/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                      {member.name}
                    </span>
                    <span className="text-xs font-medium text-stone-500">
                      {memberMeds.length} active prescription{memberMeds.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                    {dueMeds.length === 0 ? (
                      <span>No prescriptions scheduled today · Rest day</span>
                    ) : (
                      <span>
                        {takenDueMeds.length} of {dueMeds.length} taken today · {pendingDueMeds.length} pending
                      </span>
                    )}
                  </p>

                  <div className="space-y-1.5 mb-4">
                    {memberMeds.map((med) => {
                      const dueToday = isMedDueOnDate(med, new Date());
                      const { nextDueText } = getScheduleDueStatus(med);
                      const taken = isLoggedToday(med);
                      const schedDesc = formatScheduleDescription(med);

                      if (!dueToday) {
                        return (
                          <div
                            key={med.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-stone-200/50 dark:border-slate-700/50 last:border-0 text-stone-500 dark:text-stone-400"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-slate-600"></span>
                              <span>
                                {med.name} ({formatTablets(med.dailyTotalTablets)} tab · {schedDesc})
                              </span>
                            </span>
                            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                              Not Scheduled Today ({nextDueText})
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={med.id}
                          className="flex items-center justify-between text-xs py-1.5 border-b border-stone-200/50 dark:border-slate-700/50 last:border-0"
                        >
                          <span className={taken ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-200 font-medium'}>
                            {med.name} ({formatTablets(med.dailyTotalTablets)} tab{med.dailyTotalTablets !== 1 ? 's' : ''})
                          </span>
                          {taken ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Taken
                            </span>
                          ) : (
                            <button
                              onClick={() => handleTakeDose(med)}
                              className="text-teal-700 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                            >
                              Log Dose ({formatTablets(med.dailyTotalTablets)} tab)
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const count = logAllDailySuppliesForMember(member.id);
                    if (count > 0) {
                      showToast(`Logged all ${count} scheduled doses for ${member.name}.`);
                    }
                  }}
                  disabled={allTaken || dueMeds.length === 0}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    dueMeds.length === 0
                      ? 'bg-stone-100 dark:bg-slate-800 text-stone-400 border border-stone-200 dark:border-slate-700 cursor-default'
                      : allTaken
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                      : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                  }`}
                >
                  {dueMeds.length === 0 ? (
                    <span>No Prescriptions Scheduled for Today</span>
                  ) : allTaken ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      <span>All Scheduled Doses Taken Today!</span>
                    </>
                  ) : (
                    <>
                      <PillIcon className="w-4 h-4" />
                      <span>Take All Today's Doses for {member.name} ({pendingDueMeds.length} due)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* RECENT INVENTORY LOGS & AUDIT TRAIL WITH UNDO */}
      {logs.length > 0 && (
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-stone-500" />
              <h3 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                Recent Inventory Logs
              </h3>
            </div>
            <span className="text-xs text-stone-500">
              Click undo to revert any accidental dose deduction
            </span>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-slate-800 max-h-56 overflow-y-auto pr-1">
            {logs.slice(0, 5).map((log) => {
              const med = medications.find((m) => m.id === log.medicationId);
              const member = profiles.find((p) => p.id === log.memberId);
              const isRefill = log.actionType === 'restock';

              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRefill ? 'bg-emerald-500' : 'bg-teal-500'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        {member?.name || 'Member'}: {med?.name || 'Medication'}
                      </p>
                      <p className="text-stone-500 dark:text-stone-400">
                        {log.note || `${log.actionType} (${log.tabletsDeducted} tabs)`} ·{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      undoLog(log.id);
                      showToast(`Reverted entry: ${med?.name}`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                    title="Undo this action and restore tablet count"
                  >
                    <UndoIcon className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
