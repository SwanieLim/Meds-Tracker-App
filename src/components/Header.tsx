import React from 'react';
import { useMedication } from '../context/MedicationContext';
import { NavigationTab, FontScale } from '../types';
import {
  BellAlertIcon,
  UserGroupIcon,
  PillIcon,
  ClockIcon,
  SunIcon,
  MoonIcon,
  PrinterIcon,
  PlusIcon,
} from './Icons';

interface HeaderProps {
  onOpenAddMedication: () => void;
  onOpenPrintSheet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddMedication,
  onOpenPrintSheet,
}) => {
  const {
    activeTab,
    setActiveTab,
    fontScale,
    setFontScale,
    darkMode,
    setDarkMode,
    getLowStockMedications,
    profiles,
    selectedMemberId,
    setSelectedMemberId,
  } = useMedication();

  const lowStockCount = getLowStockMedications().length;

  const tabs: Array<{ id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }> = [
    {
      id: 'dashboard',
      label: 'Refill Alerts',
      icon: <BellAlertIcon className="w-5 h-5 shrink-0" />,
      badge: lowStockCount,
    },
    {
      id: 'profiles',
      label: 'Family Profiles',
      icon: <UserGroupIcon className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'medications',
      label: 'All Medications',
      icon: <PillIcon className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'history',
      label: 'History & Logs',
      icon: <ClockIcon className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-stone-50/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-stone-200 dark:border-slate-800 transition-colors">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Brand Wordmark Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-teal-700 dark:bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <PillIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
                Family Meds Tracker
              </span>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
                Lifelong Prescription & Inventory Care
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-200/70 dark:bg-slate-800/80 p-1.5 rounded-xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white leading-none">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Font Scaling, Dark Mode, Print, Add Med */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Font Scaler for Accessibility */}
            <div
              className="flex items-center bg-stone-200/80 dark:bg-slate-800/80 p-1 rounded-lg text-xs font-semibold"
              title="Adjust text size for easier reading"
            >
              <button
                onClick={() => setFontScale('normal')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  fontScale === 'normal'
                    ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
                aria-label="Normal font size"
              >
                A
              </button>
              <button
                onClick={() => setFontScale('large')}
                className={`px-2 py-1 rounded text-sm transition-colors cursor-pointer ${
                  fontScale === 'large'
                    ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
                aria-label="Large font size"
              >
                A+
              </button>
              <button
                onClick={() => setFontScale('xlarge')}
                className={`px-2 py-1 rounded text-base transition-colors cursor-pointer ${
                  fontScale === 'xlarge'
                    ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
                aria-label="Extra large font size"
              >
                A++
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            {/* Pharmacy Print Checklist */}
            <button
              onClick={onOpenPrintSheet}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-200/70 dark:bg-slate-800 hover:bg-stone-300/70 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              title="Print refill shopping list with alternative brands"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Pharmacy Sheet</span>
            </button>

            {/* Add Medication CTA */}
            <button
              onClick={onOpenAddMedication}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Add Medication</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Mobile Subnav Strip */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-stone-200 dark:border-slate-800 gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-600 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
