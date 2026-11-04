import React, { useState, useEffect } from 'react';
import { useMedication } from '../context/MedicationContext';
import { FamilyMember } from '../types';
import { CloseIcon, UserGroupIcon } from './Icons';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMember?: FamilyMember | null;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  editingMember,
}) => {
  const { addMember, updateMember, setSelectedMemberId } = useMedication();

  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Parent');
  const [avatarColor, setAvatarColor] = useState<string>('teal');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setRelationship(editingMember.relationship);
      setAvatarColor(editingMember.avatarColor || 'teal');
      setNotes(editingMember.notes || '');
    } else {
      setName('');
      setRelationship('Mother');
      setAvatarColor('teal');
      setNotes('');
    }
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const relationshipOptions = [
    'Mother',
    'Father',
    'Grandmother',
    'Grandfather',
    'Spouse / Partner',
    'Daughter',
    'Son',
    'Self',
    'Other Relative',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMember) {
      updateMember(editingMember.id, {
        name: name.trim(),
        relationship,
        avatarColor,
        notes: notes.trim() || undefined,
      });
    } else {
      const newId = addMember({
        name: name.trim(),
        relationship,
        avatarColor,
        notes: notes.trim() || undefined,
      });
      setSelectedMemberId(newId);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
                {editingMember ? 'Edit Profile' : 'Add Family Member'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Create a dedicated profile to manage their medications
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

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Name or Nickname *
            </label>
            <input
              type="text"
              placeholder="e.g. Mum, Dad, Grandpa Joe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 focus:outline-teal-600 font-semibold"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Relationship
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 font-semibold focus:outline-teal-600"
            >
              {relationshipOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Health / Schedule Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Takes morning and bedtime medications. Prefers pill organizer on bedside table."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-teal-600"
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
              {editingMember ? 'Save Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
