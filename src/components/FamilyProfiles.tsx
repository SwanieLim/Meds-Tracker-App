import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { Medication, FamilyMember, AlternativeBrand } from '../types';
import {
  PillIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  TagIcon,
  ShieldCheckIcon,
  UndoIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
} from './Icons';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  getScheduleDueStatus,
  formatTablets,
  formatScheduleDescription,
  isMedDueOnDate,
  getTimeOfDayLabel,
} from '../utils/scheduleUtils';

interface FamilyProfilesProps {
  onOpenAddMedication: (preselectedMemberId?: string) => void;
  onOpenEditMedication: (medication: Medication) => void;
  onOpenRestockModal: (medication: Medication) => void;
  onOpenAddMember: () => void;
  onOpenEditMember: (member: FamilyMember) => void;
}

export const FamilyProfiles: React.FC<FamilyProfilesProps> = ({
  onOpenAddMedication,
  onOpenEditMedication,
  onOpenRestockModal,
  onOpenAddMember,
  onOpenEditMember,
}) => {
  const {
    profiles,
    medications,
    selectedMemberId,
    setSelectedMemberId,
    calculateDaysRemaining,
    isLowStock,
    isCriticalStock,
    logDailySupply,
    logAllDailySuppliesForMember,
    isLoggedToday,
    deleteMedication,
    restoreMedication,
    deleteMember,
    moveMedication,
    sortByTimeOfDay,
  } = useMedication();

  const [expandedAlts, setExpandedAlts] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [recentlyDeletedMed, setRecentlyDeletedMed] = useState<Medication | null>(null);
  const [medToDelete, setMedToDelete] = useState<Medication | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 6000);
  };

  const toggleAlt = (medId: string) => {
    setExpandedAlts((prev) => ({ ...prev, [medId]: !prev[medId] }));
  };

  // Filtered profiles and medications sorted by custom sortOrder
  const currentMember = profiles.find((p) => p.id === selectedMemberId);

  const displayedMeds = medications
    .filter((m) => {
      if (selectedMemberId === 'all') return true;
      return m.memberId === selectedMemberId;
    })
    .sort((a, b) => {
      // If viewing all profiles, keep members grouped together
      if (selectedMemberId === 'all' && a.memberId !== b.memberId) {
        return a.memberId.localeCompare(b.memberId);
      }
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

  const handleMoveMed = (medId: string, direction: 'up' | 'down') => {
    moveMedication(medId, direction);
  };

  const handleSortByTimeOfDay = () => {
    if (selectedMemberId !== 'all') {
      sortByTimeOfDay(selectedMemberId);
      showToast(`Sorted ${currentMember?.name || 'profile'}'s medications by Time of Day (Morning → Night)!`);
    } else {
      profiles.forEach((p) => sortByTimeOfDay(p.id));
      showToast('Sorted all family medications by Time of Day (Morning → Night)!');
    }
  };

  const handleDeleteMed = (med: Medication) => {
    setMedToDelete(med);
  };

  const confirmDeleteMed = () => {
    if (!medToDelete) return;
    const deleted = deleteMedication(medToDelete.id);
    if (deleted) {
      setRecentlyDeletedMed(deleted);
      showToast(`Removed ${deleted.name}.`);
    } else {
      showToast(`Removed ${medToDelete.name}.`);
    }
    setMedToDelete(null);
  };

  const handleDeleteProfile = (member: FamilyMember) => {
    setMemberToDelete(member);
  };

  const confirmDeleteProfile = () => {
    if (!memberToDelete) return;
    deleteMember(memberToDelete.id);
    showToast(`Deleted profile for ${memberToDelete.name}`);
    setMemberToDelete(null);
  };

  const handleUndoDeleteMed = () => {
    if (recentlyDeletedMed) {
      restoreMedication(recentlyDeletedMed);
      showToast(`Restored ${recentlyDeletedMed.name} to active prescriptions!`);
      setRecentlyDeletedMed(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback with Undo */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 text-white px-5 py-3.5 rounded-xl shadow-lg border border-stone-700 animate-in fade-in">
          <CheckCircleIcon className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
          {recentlyDeletedMed && (
            <button
              onClick={handleUndoDeleteMed}
              className="ml-2 px-3 py-1 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <UndoIcon className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      {/* Top Profile Switcher Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Family Member Profiles
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-1">
            Manage lifelong active medications, dosage schedules, and safe pharmacy alternatives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-stone-700 dark:text-stone-200 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Family Member</span>
          </button>
        </div>
      </div>

      {/* Profile Selection Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedMemberId('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedMemberId === 'all'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700'
          }`}
        >
          <span>All Family ({medications.length})</span>
        </button>

        {profiles.map((member) => {
          const memberMeds = medications.filter((m) => m.memberId === member.id && m.active);
          const hasLowStock = memberMeds.some((m) => isLowStock(m));
          const isSelected = selectedMemberId === member.id;

          return (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{member.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isSelected ? 'bg-teal-800 text-teal-100' : 'bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-300'
              }`}>
                {memberMeds.length}
              </span>
              {hasLowStock && (
                <span className="w-2 h-2 rounded-full bg-rose-500" title="Low stock alert" />
              )}
            </button>
          );
        })}
      </div>

      {/* Member Details Banner (When a specific member is chosen) */}
      {currentMember && (
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-display font-bold text-xl shrink-0">
              {currentMember.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                  {currentMember.name}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300 font-semibold">
                  {currentMember.relationship}
                </span>
              </div>
              {currentMember.notes && (
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
                  {currentMember.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                const count = logAllDailySuppliesForMember(currentMember.id);
                if (count > 0) {
                  showToast(`Logged all ${count} doses for ${currentMember.name}`);
                } else {
                  showToast(`All doses already marked for ${currentMember.name}`);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950/80 hover:bg-teal-200 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCircleIcon className="w-4 h-4 text-teal-600" />
              <span>Mark All Doses Taken Today</span>
            </button>

            <button
              onClick={() => onOpenEditMember(currentMember)}
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg cursor-pointer"
              title="Edit Profile"
            >
              <Edit3Icon className="w-4 h-4" />
            </button>

            {profiles.length > 1 && (
              <button
                onClick={() => handleDeleteProfile(currentMember)}
                className="p-2 text-rose-600 hover:text-rose-700 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg cursor-pointer"
                title="Delete Profile"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onOpenAddMedication(currentMember.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Medication for {currentMember.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reorder and Routine Organization Toolbar */}
      {displayedMeds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 dark:bg-slate-850 p-3.5 rounded-xl border border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            <span className="font-bold text-stone-900 dark:text-stone-100">Prescription Order:</span>
            <span>
              {displayedMeds.length} medication{displayedMeds.length !== 1 ? 's' : ''} in routine
            </span>
            <span className="hidden sm:inline text-stone-400">· Use ↑ and ↓ on cards to reorder</span>
          </div>

          <button
            onClick={handleSortByTimeOfDay}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-200 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-teal-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
            title="Automatically arrange medications chronologically: Morning → Midday → Evening → Bedtime"
          >
            <ClockIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Sort by Time of Day (Morning → Night)</span>
          </button>
        </div>
      )}

      {/* Medications Grid */}
      {displayedMeds.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedMeds.map((med) => {
            const member = profiles.find((p) => p.id === med.memberId);
            const memberMeds = displayedMeds.filter((m) => m.memberId === med.memberId);
            const indexInMember = memberMeds.findIndex((m) => m.id === med.id);
            const isFirstInProfile = indexInMember <= 0;
            const isLastInProfile = indexInMember >= memberMeds.length - 1;
            const orderPosition = indexInMember + 1;
            const timeOfDayLabel = getTimeOfDayLabel(med);

            const daysLeft = calculateDaysRemaining(med);
            const low = isLowStock(med);
            const crit = isCriticalStock(med);
            const takenToday = isLoggedToday(med);
            const isAltOpen = !!expandedAlts[med.id];
            const { isDueToday, nextDueText } = getScheduleDueStatus(med);
            const schedDesc = formatScheduleDescription(med);

            return (
              <div
                key={med.id}
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-xs ${
                  crit
                    ? 'border-rose-400 dark:border-rose-800 ring-2 ring-rose-300/40 dark:ring-rose-900/40'
                    : low
                    ? 'border-amber-300 dark:border-amber-700'
                    : 'border-stone-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top line with sequence number, member name, time of day, schedule badge & stock alert */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-slate-700"
                        title={`Sequence #${orderPosition} in ${member?.name || 'profile'}'s regimen`}
                      >
                        #{orderPosition}
                      </span>
                      <span className="text-xs font-bold text-teal-800 dark:text-teal-400">
                        {member?.name || 'Family Member'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200/80 dark:border-teal-800/80">
                        {timeOfDayLabel}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 font-semibold border border-stone-200 dark:border-slate-700">
                        {schedDesc}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isDueToday && (
                        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-slate-700">
                          Not Scheduled Today ({nextDueText})
                        </span>
                      )}
                      {low && (
                        <span
                          className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md flex items-center gap-1.5 ${
                            crit
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-amber-600 text-white shadow-xs'
                          }`}
                        >
                          <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>Time to Restock!</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Medication Main Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                        {med.name}
                      </h3>
                      <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                        Brand: <span className="text-teal-700 dark:text-teal-300 font-bold">{med.brandName}</span>{' '}
                        {med.dosageStrength && `· ${med.dosageStrength}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Move Up & Move Down Buttons */}
                      <div className="flex items-center bg-stone-100 dark:bg-slate-800 rounded-lg p-0.5 border border-stone-200 dark:border-slate-700">
                        <button
                          onClick={() => handleMoveMed(med.id, 'up')}
                          disabled={isFirstInProfile}
                          aria-label={`Move ${med.name} up in list`}
                          title={isFirstInProfile ? 'Already at first position' : 'Move Up (earlier in list)'}
                          className={`p-1.5 rounded-md transition-colors ${
                            isFirstInProfile
                              ? 'text-stone-300 dark:text-slate-600 cursor-not-allowed'
                              : 'text-stone-700 dark:text-stone-200 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer shadow-xs'
                          }`}
                        >
                          <ArrowUpIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveMed(med.id, 'down')}
                          disabled={isLastInProfile}
                          aria-label={`Move ${med.name} down in list`}
                          title={isLastInProfile ? 'Already at last position' : 'Move Down (later in list)'}
                          className={`p-1.5 rounded-md transition-colors ${
                            isLastInProfile
                              ? 'text-stone-300 dark:text-slate-600 cursor-not-allowed'
                              : 'text-stone-700 dark:text-stone-200 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer shadow-xs'
                          }`}
                        >
                          <ArrowDownIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenEditMedication(med)}
                        className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Medication"
                      >
                        <Edit3Icon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMed(med)}
                        className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Medication"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Purpose Box */}
                  <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/60 dark:border-slate-800">
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Purpose / Indication:
                    </span>
                    <p className="text-sm text-stone-800 dark:text-stone-200 font-medium mt-0.5">
                      {med.purpose}
                    </p>
                  </div>

                  {/* Dosage instructions */}
                  <div className="mt-3 flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                    <ClockIcon className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Dosage: </span>
                      <span>{med.dosageInstructions}</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400 ml-1.5 font-medium">
                        ({formatTablets(med.dailyTotalTablets)} tablet{med.dailyTotalTablets !== 1 ? 's' : ''}/dose · {schedDesc})
                      </span>
                    </div>
                  </div>

                  {med.instructions && (
                    <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 pl-6">
                      Special: {med.instructions}
                    </p>
                  )}

                  {/* Smart Inventory Section */}
                  <div className="mt-4 p-4 rounded-xl bg-stone-100/70 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
                      <span>Inventory & Stock Count</span>
                      <span>Alert when $\le$ {med.lowStockThresholdDays} days</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-3xl font-extrabold tabular-nums font-mono text-stone-900 dark:text-stone-100">
                          {formatTablets(med.currentStock)}
                        </span>
                        <span className="text-sm text-stone-500 dark:text-stone-400 ml-1.5 font-medium">
                          tablets left
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xl font-black tabular-nums font-mono ${
                            crit
                              ? 'text-rose-600 dark:text-rose-400'
                              : low
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {daysLeft} day{daysLeft !== 1 ? 's' : ''} of supply
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          crit ? 'bg-rose-600' : low ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{
                          width: `${Math.min(100, (daysLeft / Math.max(1, med.lowStockThresholdDays * 2)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* DEDICATED SECTION FOR ALTERNATIVE BRANDS (IF OUT OF STOCK) */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TagIcon className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                          Alternative Brands (if out of stock)
                        </span>
                        <span className="text-xs text-stone-400 font-semibold">
                          ({med.alternativeBrands?.length || 0})
                        </span>
                      </div>

                      <button
                        onClick={() => toggleAlt(med.id)}
                        className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isAltOpen ? 'Collapse' : 'Show Alternatives'}</span>
                        {isAltOpen ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {isAltOpen && (
                      <div className="mt-3 p-3.5 rounded-xl bg-teal-50/50 dark:bg-slate-800/90 border border-teal-200 dark:border-teal-900/60 space-y-2 text-xs">
                        {med.alternativeBrands && med.alternativeBrands.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[11px] text-teal-900 dark:text-teal-200 font-medium">
                              If <strong className="font-bold">{med.brandName}</strong> is out of stock at your pharmacy, these are verified equivalent substitutions:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {med.alternativeBrands.map((alt) => (
                                <div
                                  key={alt.id}
                                  className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-0.5"
                                >
                                  <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                                    <span>{alt.name}</span>
                                    <ShieldCheckIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  </div>
                                  {alt.manufacturer && (
                                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                      Mfg: {alt.manufacturer}
                                    </p>
                                  )}
                                  {alt.notes && (
                                    <p className="text-[11px] text-stone-600 dark:text-stone-300 italic pt-0.5">
                                      "{alt.notes}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2 text-stone-500">
                            <p>No alternative brands specified yet.</p>
                            <button
                              onClick={() => onOpenEditMedication(med)}
                              className="mt-1 text-teal-700 font-bold hover:underline cursor-pointer"
                            >
                              + Add alternative brand
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    onClick={() => {
                      logDailySupply(med.id);
                      showToast(`Deducted 1 dose (${formatTablets(med.dailyTotalTablets)} tab) for ${med.name}`);
                    }}
                    disabled={takenToday}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors cursor-pointer ${
                      takenToday
                        ? 'bg-stone-100 dark:bg-slate-800 text-stone-400 border border-stone-200 dark:border-slate-700 cursor-not-allowed'
                        : isDueToday
                        ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                        : 'bg-stone-800 hover:bg-stone-900 text-white shadow-xs'
                    }`}
                  >
                    {takenToday ? (
                      <>
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        <span>Today's Supply Logged</span>
                      </>
                    ) : isDueToday ? (
                      <>
                        <PillIcon className="w-4 h-4" />
                        <span>-1 Day Supply ({formatTablets(med.dailyTotalTablets)} tab)</span>
                      </>
                    ) : (
                      <>
                        <PillIcon className="w-4 h-4" />
                        <span>Off-Schedule Dose ({formatTablets(med.dailyTotalTablets)} tab)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenRestockModal(med)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-stone-800 dark:text-stone-200 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <PlusIcon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                    <span>Restock Tablets</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-400 flex items-center justify-center">
            <PillIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              No Medications Registered
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto mt-1">
              {currentMember
                ? `Add active lifelong prescriptions for ${currentMember.name} to start tracking stock counts and refill alerts.`
                : 'Select a family member or add medications to begin tracking.'}
            </p>
          </div>
          <button
            onClick={() => onOpenAddMedication(currentMember?.id)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add First Medication</span>
          </button>
        </div>
      )}

      {/* Delete Medication Confirmation Modal */}
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

      {/* Delete Profile Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={confirmDeleteProfile}
        title="Delete Family Profile?"
        itemName={memberToDelete ? `${memberToDelete.name} (${memberToDelete.relationship})` : ''}
        itemSubtitle="This will also remove all lifelong prescriptions assigned to this profile."
        warningText="Are you sure you want to delete this family profile and all associated medications?"
        confirmButtonText="Delete Profile"
      />
    </div>
  );
};
