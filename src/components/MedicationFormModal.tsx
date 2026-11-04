import React, { useState, useEffect } from 'react';
import { useMedication } from '../context/MedicationContext';
import { Medication, AlternativeBrand, ScheduleType } from '../types';
import { CloseIcon, PlusIcon, Trash2Icon, TagIcon, PillIcon, ClockIcon } from './Icons';
import {
  DAYS_OF_WEEK,
  formatTablets,
  calculateCalendarDaysRemaining,
} from '../utils/scheduleUtils';

interface MedicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMedication?: Medication | null;
  preselectedMemberId?: string;
  onDeleteMedication?: (medication: Medication) => void;
}

export const MedicationFormModal: React.FC<MedicationFormModalProps> = ({
  isOpen,
  onClose,
  editingMedication,
  preselectedMemberId,
  onDeleteMedication,
}) => {
  const { profiles, addMedication, updateMedication } = useMedication();

  const [formError, setFormError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [dosageStrength, setDosageStrength] = useState<string>('');
  const [dosageInstructions, setDosageInstructions] = useState<string>('');
  const [tabletsPerDose, setTabletsPerDose] = useState<number>(1);
  const [timesPerDay, setTimesPerDay] = useState<number>(1);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['mon', 'wed', 'thu']);
  const [purpose, setPurpose] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<number>(30);
  const [lowStockThresholdDays, setLowStockThresholdDays] = useState<number>(7);
  const [instructions, setInstructions] = useState<string>('');
  const [prescribingDoctor, setPrescribingDoctor] = useState<string>('');

  // Alternative Brands
  const [alternativeBrands, setAlternativeBrands] = useState<AlternativeBrand[]>([]);
  const [newAltName, setNewAltName] = useState<string>('');
  const [newAltMfg, setNewAltMfg] = useState<string>('');
  const [newAltNotes, setNewAltNotes] = useState<string>('');

  useEffect(() => {
    if (editingMedication) {
      setMemberId(editingMedication.memberId);
      setName(editingMedication.name);
      setBrandName(editingMedication.brandName);
      setDosageStrength(editingMedication.dosageStrength || '');
      setDosageInstructions(editingMedication.dosageInstructions);
      setTabletsPerDose(editingMedication.tabletsPerDose || 1);
      setTimesPerDay(editingMedication.timesPerDay || 1);
      setScheduleType(editingMedication.scheduleType || 'daily');
      setScheduleDays(editingMedication.scheduleDays || ['mon', 'wed', 'thu']);
      setPurpose(editingMedication.purpose);
      setCurrentStock(editingMedication.currentStock);
      setLowStockThresholdDays(editingMedication.lowStockThresholdDays || 7);
      setInstructions(editingMedication.instructions || '');
      setPrescribingDoctor(editingMedication.prescribingDoctor || '');
      setAlternativeBrands(editingMedication.alternativeBrands || []);
    } else {
      // Default new
      setMemberId(preselectedMemberId || (profiles[0]?.id || ''));
      setName('');
      setBrandName('');
      setDosageStrength('');
      setDosageInstructions('1 tablet, once daily');
      setTabletsPerDose(1);
      setTimesPerDay(1);
      setScheduleType('daily');
      setScheduleDays(['mon', 'wed', 'thu']);
      setPurpose('');
      setCurrentStock(30);
      setLowStockThresholdDays(7);
      setInstructions('');
      setPrescribingDoctor('');
      setAlternativeBrands([]);
    }
  }, [editingMedication, preselectedMemberId, profiles, isOpen]);

  if (!isOpen) return null;

  const dailyTotal = Math.round(tabletsPerDose * timesPerDay * 100) / 100;
  
  // Forecast preview days with calendar simulation
  const previewMed: Medication = {
    id: editingMedication?.id || 'temp',
    memberId,
    name,
    brandName,
    dosageInstructions,
    tabletsPerDose,
    timesPerDay,
    dailyTotalTablets: dailyTotal,
    scheduleType,
    scheduleDays,
    purpose,
    currentStock,
    lowStockThresholdDays,
    alternativeBrands,
    active: true,
    createdAt: editingMedication?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const previewDaysLeft = calculateCalendarDaysRemaining(previewMed);
  const alertThresholdTablets = Math.round(lowStockThresholdDays * dailyTotal * 10) / 10;

  const handleAddAlternative = () => {
    if (!newAltName.trim()) return;
    const newAlt: AlternativeBrand = {
      id: `alt-${Date.now()}`,
      name: newAltName.trim(),
      manufacturer: newAltMfg.trim() || undefined,
      notes: newAltNotes.trim() || undefined,
    };
    setAlternativeBrands([...alternativeBrands, newAlt]);
    setNewAltName('');
    setNewAltMfg('');
    setNewAltNotes('');
  };

  const handleRemoveAlternative = (id: string) => {
    setAlternativeBrands(alternativeBrands.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !brandName.trim() || !memberId) {
      setFormError('Please fill in the Medication Name, Brand Name, and select a Family Member.');
      return;
    }

    const medData = {
      memberId,
      name: name.trim(),
      brandName: brandName.trim(),
      dosageStrength: dosageStrength.trim() || undefined,
      dosageInstructions:
        dosageInstructions.trim() ||
        `${formatTablets(tabletsPerDose)} tablet, ${timesPerDay}x daily`,
      tabletsPerDose: Number(tabletsPerDose),
      timesPerDay: Number(timesPerDay),
      dailyTotalTablets: dailyTotal,
      scheduleType,
      scheduleDays: scheduleType === 'specific_days' ? scheduleDays : undefined,
      purpose: purpose.trim() || 'Prescription medication',
      currentStock: Number(currentStock),
      lowStockThresholdDays: Number(lowStockThresholdDays),
      alternativeBrands,
      instructions: instructions.trim() || undefined,
      prescribingDoctor: prescribingDoctor.trim() || undefined,
      active: true,
      sortOrder: editingMedication?.sortOrder,
      lastDoseLoggedDate: editingMedication?.lastDoseLoggedDate || '',
    };

    if (editingMedication) {
      updateMedication(editingMedication.id, medData);
    } else {
      addMedication(medData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <PillIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                {editingMedication ? 'Edit Medication Details' : 'Add Active Lifelong Medication'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Configure prescription details, stock threshold, and out-of-stock alternative brands
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Family Member Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Family Member *
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 font-semibold focus:outline-teal-600"
              required
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.relationship})
                </option>
              ))}
            </select>
          </div>

          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Generic Name / Active Substance *
              </label>
              <input
                type="text"
                placeholder="e.g. Amlodipine Besylate"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 focus:outline-teal-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Brand Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Norvasc"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 focus:outline-teal-600"
                required
              />
            </div>
          </div>

          {/* Dosage Strength & Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Strength
              </label>
              <input
                type="text"
                placeholder="e.g. 5mg or 500mg"
                value={dosageStrength}
                onChange={(e) => setDosageStrength(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 focus:outline-teal-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Dosage Instructions *
              </label>
              <input
                type="text"
                placeholder="e.g. 1 tablet, twice daily with breakfast and dinner"
                value={dosageInstructions}
                onChange={(e) => setDosageInstructions(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 focus:outline-teal-600"
                required
              />
            </div>
          </div>

          {/* Dosage & Half-Tablet Selection */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Dosage & Tablet Amount
              </span>
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                {formatTablets(dailyTotal)} tablet{dailyTotal !== 1 ? 's' : ''}/taking day
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1 font-medium">
                  Tablets per dose
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={tabletsPerDose}
                    onChange={(e) => setTabletsPerDose(parseFloat(e.target.value) || 0.5)}
                    className="w-24 px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold font-mono text-base"
                    required
                  />
                  {/* Quick tap buttons for 0.5, 1, 1.5, 2 */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: '½ tab', val: 0.5 },
                      { label: '1 tab', val: 1 },
                      { label: '1½ tab', val: 1.5 },
                      { label: '2 tab', val: 2 },
                    ].map((btn) => (
                      <button
                        key={btn.val}
                        type="button"
                        onClick={() => {
                          setTabletsPerDose(btn.val);
                          setDosageInstructions(`${formatTablets(btn.val)} tablet, ${timesPerDay}x daily`);
                        }}
                        className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          tabletsPerDose === btn.val
                            ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1 font-medium">
                  Times per day
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="6"
                    step="1"
                    value={timesPerDay}
                    onChange={(e) => setTimesPerDay(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold font-mono text-base"
                    required
                  />
                  <div className="flex items-center gap-1">
                    {[
                      { label: '1x daily', val: 1 },
                      { label: '2x daily', val: 2 },
                      { label: '3x daily', val: 3 },
                    ].map((freq) => (
                      <button
                        key={freq.val}
                        type="button"
                        onClick={() => {
                          setTimesPerDay(freq.val);
                          setDosageInstructions(`${formatTablets(tabletsPerDose)} tablet, ${freq.val}x daily`);
                        }}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          timesPerDay === freq.val
                            ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100'
                        }`}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flexible Intake Schedule */}
          <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-slate-850 border border-teal-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Intake Schedule (Days Taken)
                </span>
              </div>
              <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                {scheduleType === 'daily' && 'Every single day'}
                {scheduleType === 'weekdays' && 'Monday to Friday only'}
                {scheduleType === 'alternate_days' && 'Every other day'}
                {scheduleType === 'specific_days' && `${scheduleDays.length} specific days per week`}
              </span>
            </div>

            {/* Schedule Type Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'daily', label: 'Everyday' },
                { id: 'weekdays', label: 'Weekdays Only' },
                { id: 'specific_days', label: 'Specific Days' },
                { id: 'alternate_days', label: 'Alternate Days' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScheduleType(opt.id as ScheduleType)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    scheduleType === opt.id
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Specific Days Checkbox Pills */}
            {scheduleType === 'specific_days' && (
              <div className="pt-2 border-t border-teal-100 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
                  <span className="font-semibold">Tap to select taking days:</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setScheduleDays(['mon', 'wed', 'thu'])}
                      className="text-teal-700 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                    >
                      Mon, Wed, Thu
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setScheduleDays(['mon', 'wed', 'fri'])}
                      className="text-teal-700 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                    >
                      Mon, Wed, Fri
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isPicked = scheduleDays.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          if (isPicked) {
                            if (scheduleDays.length > 1) {
                              setScheduleDays(scheduleDays.filter((x) => x !== d.key));
                            }
                          } else {
                            setScheduleDays([...scheduleDays, d.key]);
                          }
                        }}
                        className={`flex-1 min-w-[50px] py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                          isPicked
                            ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-slate-700 hover:bg-stone-100'
                        }`}
                      >
                        {d.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Purpose / Indication */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Purpose (What it does) *
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Lowers blood pressure and protects cardiac function"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 focus:outline-teal-600"
              required
            />
          </div>

          {/* Inventory Count & Alert Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Current Stock Count (Tablets left) *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 font-bold font-mono focus:outline-teal-600 text-lg"
                required
              />
              <span className="text-xs text-stone-500 mt-1 block">
                $\approx$ {previewDaysLeft} calendar days of supply remaining
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Low Stock Alert Threshold (Days) *
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={lowStockThresholdDays}
                onChange={(e) => setLowStockThresholdDays(parseInt(e.target.value) || 7)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 font-bold font-mono focus:outline-teal-600 text-lg"
                required
              />
              <span className="text-xs text-stone-500 mt-1 block">
                Alerts when $\le$ {lowStockThresholdDays} calendar days remaining
              </span>
            </div>
          </div>

          {/* DEDICATED SECTION: ALTERNATIVE BRANDS (IF OUT OF STOCK) */}
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-slate-850 border border-teal-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-teal-700" />
              <h3 className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
                Alternative Brands (if out of stock)
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Save bioequivalent generic or alternate brand names so you can instantly ask the pharmacist if the primary brand is out of stock.
            </p>

            {/* List of existing alternative brands */}
            {alternativeBrands.length > 0 && (
              <div className="space-y-2">
                {alternativeBrands.map((alt) => (
                  <div
                    key={alt.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                        <span>{alt.name}</span>
                        {alt.manufacturer && (
                          <span className="font-normal text-stone-400">({alt.manufacturer})</span>
                        )}
                      </div>
                      {alt.notes && (
                        <p className="text-stone-500 dark:text-stone-400 italic mt-0.5">{alt.notes}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAlternative(alt.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Remove alternative brand"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new alternative input block */}
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-2">
              <span className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                + Add Alternative Brand
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Brand / Generic Name (e.g. Sandoz Metformin)"
                  value={newAltName}
                  onChange={(e) => setNewAltName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Manufacturer / Pharmacy (e.g. Sandoz)"
                  value={newAltMfg}
                  onChange={(e) => setNewAltMfg(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Notes (e.g. Direct bioequivalent; available at Guardian)"
                  value={newAltNotes}
                  onChange={(e) => setNewAltNotes(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddAlternative}
                  disabled={!newAltName.trim()}
                  className="px-3 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Add Brand
                </button>
              </div>
            </div>
          </div>

          {/* Doctor & Special Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Prescribing Doctor (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Sarah Tan"
                value={prescribingDoctor}
                onChange={(e) => setPrescribingDoctor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Special Directions
              </label>
              <input
                type="text"
                placeholder="e.g. Take with a full glass of water"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Form Action Footer */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-xs font-semibold text-rose-800 dark:text-rose-300">
              {formError}
            </div>
          )}

          <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {editingMedication && onDeleteMedication ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteMedication(editingMedication);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2Icon className="w-4 h-4" />
                <span>Delete Medication</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 shadow-sm transition-colors cursor-pointer"
              >
                {editingMedication ? 'Save Changes' : 'Save Medication'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
