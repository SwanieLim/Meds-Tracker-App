/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MedicationProvider, useMedication } from './context/MedicationContext';
import { Header } from './components/Header';
import { DashboardAlerts } from './components/DashboardAlerts';
import { FamilyProfiles } from './components/FamilyProfiles';
import { MedicationList } from './components/MedicationList';
import { HistoryLogView } from './components/HistoryLogView';
import { MedicationFormModal } from './components/MedicationFormModal';
import { QuickRestockModal } from './components/QuickRestockModal';
import { AddMemberModal } from './components/AddMemberModal';
import { PrintRestockModal } from './components/PrintRestockModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CheckCircleIcon, UndoIcon } from './components/Icons';
import { Medication, FamilyMember } from './types';

function AppContent() {
  const { activeTab, setActiveTab, setSelectedMemberId, deleteMedication, restoreMedication, profiles } = useMedication();

  // Modals state
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [preselectedMemberId, setPreselectedMemberId] = useState<string | undefined>(undefined);
  const [medToDeleteFromModal, setMedToDeleteFromModal] = useState<Medication | null>(null);
  const [appToastMessage, setAppToastMessage] = useState<string | null>(null);
  const [recentlyDeletedMed, setRecentlyDeletedMed] = useState<Medication | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [targetRestockMed, setTargetRestockMed] = useState<Medication | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const showAppToast = (msg: string) => {
    setAppToastMessage(msg);
    setTimeout(() => {
      setAppToastMessage(null);
    }, 6000);
  };

  const handleConfirmDeleteFromModal = () => {
    if (!medToDeleteFromModal) return;
    const deleted = deleteMedication(medToDeleteFromModal.id);
    if (deleted) {
      setRecentlyDeletedMed(deleted);
      showAppToast(`Deleted ${deleted.name}.`);
    }
    setMedToDeleteFromModal(null);
  };

  const handleUndoDelete = () => {
    if (recentlyDeletedMed) {
      restoreMedication(recentlyDeletedMed);
      showAppToast(`Restored ${recentlyDeletedMed.name}!`);
      setRecentlyDeletedMed(null);
    }
  };

  // Modal handlers
  const handleOpenAddMedication = (memberId?: string) => {
    setEditingMedication(null);
    setPreselectedMemberId(memberId);
    setIsMedModalOpen(true);
  };

  const handleOpenEditMedication = (med: Medication) => {
    setEditingMedication(med);
    setIsMedModalOpen(true);
  };

  const handleOpenRestockModal = (med: Medication) => {
    setTargetRestockMed(med);
    setIsRestockModalOpen(true);
  };

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleSelectMemberAndGoToProfiles = (memberId: string) => {
    setSelectedMemberId(memberId);
    setActiveTab('profiles');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-teal-200 selection:text-teal-900 transition-colors">
      {/* Top Bar with 3-Zone Contract */}
      <Header
        onOpenAddMedication={() => handleOpenAddMedication()}
        onOpenPrintSheet={() => setIsPrintModalOpen(true)}
      />

      {/* Main Viewport Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardAlerts
            onOpenRestockModal={handleOpenRestockModal}
            onOpenAddMedication={() => handleOpenAddMedication()}
            onOpenPrintSheet={() => setIsPrintModalOpen(true)}
            onSelectMember={handleSelectMemberAndGoToProfiles}
          />
        )}

        {activeTab === 'profiles' && (
          <FamilyProfiles
            onOpenAddMedication={handleOpenAddMedication}
            onOpenEditMedication={handleOpenEditMedication}
            onOpenRestockModal={handleOpenRestockModal}
            onOpenAddMember={handleOpenAddMember}
            onOpenEditMember={handleOpenEditMember}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationList
            onOpenAddMedication={() => handleOpenAddMedication()}
            onOpenEditMedication={handleOpenEditMedication}
            onOpenRestockModal={handleOpenRestockModal}
          />
        )}

        {activeTab === 'history' && <HistoryLogView />}
      </main>

      {/* Quiet Footer */}
      <footer className="no-print mt-auto border-t border-stone-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            Family Meds Tracker · Lifelong prescription management & inventory safety
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span>Local Storage Active</span>
            <span aria-hidden="true">·</span>
            <span>Accurate Dosage Math</span>
            <span aria-hidden="true">·</span>
            <span>Instant Refill Reminders</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MedicationFormModal
        isOpen={isMedModalOpen}
        onClose={() => setIsMedModalOpen(false)}
        editingMedication={editingMedication}
        preselectedMemberId={preselectedMemberId}
        onDeleteMedication={(med) => setMedToDeleteFromModal(med)}
      />

      <QuickRestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        medication={targetRestockMed}
      />

      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        editingMember={editingMember}
      />

      <PrintRestockModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Delete Confirmation Modal for Deletions Initiated from Form Modal */}
      <DeleteConfirmModal
        isOpen={!!medToDeleteFromModal}
        onClose={() => setMedToDeleteFromModal(null)}
        onConfirm={handleConfirmDeleteFromModal}
        title="Delete Medication?"
        itemName={medToDeleteFromModal ? `${medToDeleteFromModal.name} (${medToDeleteFromModal.brandName})` : ''}
        itemSubtitle={
          medToDeleteFromModal
            ? `Assigned to ${profiles.find((p) => p.id === medToDeleteFromModal.memberId)?.name || 'Family Member'} · ${medToDeleteFromModal.currentStock} tablets left`
            : undefined
        }
        warningText="This will remove the medication from active prescription tracking. You can undo this immediately using the notification toast."
        confirmButtonText="Delete Medication"
      />

      {/* App-level Toast Feedback with Undo */}
      {appToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 text-white px-5 py-3.5 rounded-xl shadow-lg border border-stone-700 animate-in fade-in">
          <CheckCircleIcon className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-medium">{appToastMessage}</span>
          {recentlyDeletedMed && (
            <button
              onClick={handleUndoDelete}
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
}

export default function App() {
  return (
    <MedicationProvider>
      <AppContent />
    </MedicationProvider>
  );
}
