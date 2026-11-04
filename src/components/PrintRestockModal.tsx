import React from 'react';
import { useMedication } from '../context/MedicationContext';
import { CloseIcon, PrinterIcon, PillIcon } from './Icons';
import { formatTablets, formatScheduleDescription } from '../utils/scheduleUtils';

interface PrintRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintRestockModal: React.FC<PrintRestockModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profiles, medications, calculateDaysRemaining, isLowStock } = useMedication();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls Bar (hidden during print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
              Pharmacy Restock & Prescription Sheet
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Printable reference for your pharmacist with verified alternative brands
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="printable-content overflow-y-auto space-y-6 p-2 bg-white text-stone-900 dark:bg-slate-900 dark:text-stone-100">
          <div className="border-b-2 border-stone-800 dark:border-stone-200 pb-3 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black font-display tracking-tight text-teal-800 dark:text-teal-400">
                FAMILY MEDICATION & REFILL ORDER SHEET
              </h1>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Generated from Family Meds Tracker · Date: {today}
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-rose-600 block">CHECK INVENTORY</span>
              <span className="text-stone-500">Take directly to pharmacist</span>
            </div>
          </div>

          {profiles.map((member) => {
            const memberMeds = medications.filter((m) => m.memberId === member.id && m.active);
            if (memberMeds.length === 0) return null;

            return (
              <div key={member.id} className="space-y-3">
                <div className="bg-stone-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span>
                    PATIENT: {member.name.toUpperCase()} ({member.relationship})
                  </span>
                  <span className="text-xs font-normal text-stone-600 dark:text-stone-400">
                    {memberMeds.length} active lifelong medication{memberMeds.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-200 dark:border-slate-800 divide-y divide-stone-200 dark:divide-slate-800">
                    <thead className="bg-stone-50 dark:bg-slate-800/60 font-bold uppercase text-[11px] text-stone-700 dark:text-stone-300">
                      <tr>
                        <th className="p-2.5">Medication & Brand</th>
                        <th className="p-2.5">Dosage / Rate</th>
                        <th className="p-2.5">Stock Left</th>
                        <th className="p-2.5">Refill Status</th>
                        <th className="p-2.5">Safe Alternative Brands (if out of stock)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-slate-800">
                      {memberMeds.map((med) => {
                        const daysLeft = calculateDaysRemaining(med);
                        const low = isLowStock(med);

                        return (
                          <tr key={med.id} className={low ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}>
                            <td className="p-2.5 align-top">
                              <span className="font-bold block text-sm">{med.name} {med.dosageStrength}</span>
                              <span className="text-teal-700 dark:text-teal-400 font-semibold">
                                Brand: {med.brandName}
                              </span>
                              <p className="text-[11px] text-stone-500 italic mt-0.5">{med.purpose}</p>
                            </td>

                            <td className="p-2.5 align-top">
                              <span className="font-semibold block">{med.dosageInstructions}</span>
                              <span className="text-stone-500 font-medium">
                                ({formatTablets(med.dailyTotalTablets)} tab · {formatScheduleDescription(med)})
                              </span>
                              {med.prescribingDoctor && (
                                <span className="block text-[10px] text-stone-400 mt-1">
                                  Dr: {med.prescribingDoctor}
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 align-top font-mono">
                              <span className="font-bold text-sm block">{formatTablets(med.currentStock)} tabs</span>
                              <span className="text-stone-500">{daysLeft} days supply</span>
                            </td>

                            <td className="p-2.5 align-top">
                              {low ? (
                                <span className="inline-block px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px] uppercase">
                                  Time to Restock! ({daysLeft}d)
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                                  Sufficient ({daysLeft}d)
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 align-top">
                              {med.alternativeBrands && med.alternativeBrands.length > 0 ? (
                                <ul className="space-y-1">
                                  {med.alternativeBrands.map((alt) => (
                                    <li key={alt.id} className="text-[11px]">
                                      <strong className="text-stone-900 dark:text-stone-100">• {alt.name}</strong>
                                      {alt.manufacturer && ` (${alt.manufacturer})`}
                                      {alt.notes && (
                                        <span className="text-stone-500 block italic pl-2 text-[10px]">
                                          {alt.notes}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-stone-400 italic">No alternative listed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div className="border-t border-stone-200 dark:border-slate-800 pt-3 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Pharmacist Verification Signature: _________________________</span>
            <span>Date: _______________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
