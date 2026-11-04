import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FamilyMember, Medication, DoseLog, FontScale, NavigationTab } from '../types';
import { INITIAL_MEMBERS, INITIAL_MEDICATIONS } from '../data/initialData';
import {
  calculateCalendarDaysRemaining,
  isMedDueOnDate,
  getScheduleDueStatus,
  formatTablets,
  formatScheduleDescription,
  getTimeOfDayRank,
} from '../utils/scheduleUtils';

const STORAGE_KEY = 'kithmed_tracker_v1';
const FONT_SCALE_KEY = 'kithmed_font_scale_v1';
const THEME_KEY = 'kithmed_theme_v1';

interface StorageState {
  profiles: FamilyMember[];
  medications: Medication[];
  logs: DoseLog[];
}

interface MedicationContextType {
  profiles: FamilyMember[];
  medications: Medication[];
  logs: DoseLog[];
  selectedMemberId: string | 'all';
  setSelectedMemberId: (id: string | 'all') => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  // Member management
  addMember: (member: Omit<FamilyMember, 'id' | 'createdAt'>) => string;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;
  addMedication: (med: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => Medication | null;
  restoreMedication: (med: Medication) => void;
  // Reordering & Organization
  moveMedication: (medicationId: string, direction: 'up' | 'down') => void;
  sortByTimeOfDay: (memberId: string) => void;
  reorderMedications: (memberId: string, orderedIds: string[]) => void;
  // Inventory & Dose Actions
  logDailySupply: (medicationId: string, customDose?: number) => void;
  logAllDailySuppliesForMember: (memberId: string) => number;
  undoLog: (logId: string) => void;
  restockMedication: (medicationId: string, additionalTablets: number, note?: string) => void;
  adjustStock: (medicationId: string, newCount: number, reason?: string) => void;
  // Stock helpers
  calculateDaysRemaining: (med: Medication) => number;
  isLowStock: (med: Medication) => boolean;
  isCriticalStock: (med: Medication) => boolean;
  getLowStockMedications: () => Array<{ medication: Medication; member: FamilyMember; daysRemaining: number }>;
  isLoggedToday: (med: Medication) => boolean;
  // System
  resetToDefaultData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const MedicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage or default sample data
  const [profiles, setProfiles] = useState<FamilyMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StorageState = JSON.parse(saved);
        if (parsed.profiles && parsed.profiles.length > 0) {
          return parsed.profiles;
        }
      }
    } catch (e) {
      console.error('Error reading profiles from localStorage', e);
    }
    return INITIAL_MEMBERS;
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StorageState = JSON.parse(saved);
        if (parsed.medications && parsed.medications.length > 0) {
          // Ensure every medication has a valid sortOrder per member
          const memberCounters: Record<string, number> = {};
          return parsed.medications.map((m) => {
            if (m.sortOrder === undefined || m.sortOrder === null) {
              const nextOrder = memberCounters[m.memberId] || 0;
              memberCounters[m.memberId] = nextOrder + 1;
              return { ...m, sortOrder: nextOrder };
            }
            return m;
          });
        }
      }
    } catch (e) {
      console.error('Error reading medications from localStorage', e);
    }
    return INITIAL_MEDICATIONS;
  });

  const [logs, setLogs] = useState<DoseLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StorageState = JSON.parse(saved);
        if (parsed.logs) {
          return parsed.logs;
        }
      }
    } catch (e) {
      console.error('Error reading logs from localStorage', e);
    }
    return [];
  });

  // UI state
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Accessible font scaling
  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    try {
      const saved = localStorage.getItem(FONT_SCALE_KEY) as FontScale;
      if (saved === 'normal' || saved === 'large' || saved === 'xlarge') {
        return saved;
      }
    } catch (e) {
      // default
    }
    return 'large'; // Default to large for high readability as requested
  });

  // Dark mode state
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved !== null) return saved === 'true';
    } catch (e) {
      // ignore
    }
    return false;
  });

  // Sync font scale to <html> element
  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    try {
      localStorage.setItem(FONT_SCALE_KEY, scale);
    } catch (e) {
      // ignore
    }
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    try {
      localStorage.setItem(THEME_KEY, String(val));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-normal', 'font-scale-large', 'font-scale-xlarge');
    root.classList.add(`font-scale-${fontScale}`);
  }, [fontScale]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync state to localStorage on every change
  useEffect(() => {
    try {
      const state: StorageState = {
        profiles,
        medications,
        logs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }, [profiles, medications, logs]);

  // Inventory Calculations using calendar simulation
  const calculateDaysRemaining = (med: Medication): number => {
    return calculateCalendarDaysRemaining(med);
  };

  const isLowStock = (med: Medication): boolean => {
    if (!med.active) return false;
    const daysLeft = calculateDaysRemaining(med);
    return daysLeft <= med.lowStockThresholdDays;
  };

  const isCriticalStock = (med: Medication): boolean => {
    if (!med.active) return false;
    const daysLeft = calculateDaysRemaining(med);
    return daysLeft <= 3;
  };

  const getLowStockMedications = () => {
    const alerts: Array<{ medication: Medication; member: FamilyMember; daysRemaining: number }> = [];
    medications.forEach((med) => {
      if (med.active && isLowStock(med)) {
        const member = profiles.find((p) => p.id === med.memberId) || {
          id: med.memberId,
          name: 'Unknown',
          relationship: 'Family Member',
          avatarColor: 'slate',
          createdAt: '',
        };
        alerts.push({
          medication: med,
          member,
          daysRemaining: calculateDaysRemaining(med),
        });
      }
    });

    // Sort by most urgent (least days remaining first)
    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const isLoggedToday = (med: Medication): boolean => {
    const today = getTodayDateString();
    return med.lastDoseLoggedDate === today;
  };

  // Profile actions
  const addMember = (memberData: Omit<FamilyMember, 'id' | 'createdAt'>): string => {
    const newId = `member-${Date.now()}`;
    const newMember: FamilyMember = {
      ...memberData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setProfiles((prev) => [...prev, newMember]);
    return newId;
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setProfiles((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMember = (id: string) => {
    setProfiles((prev) => prev.filter((m) => m.id !== id));
    // also deactivate or remove associated medications
    setMedications((prev) => prev.filter((med) => med.memberId !== id));
    if (selectedMemberId === id) {
      setSelectedMemberId('all');
    }
  };

  // Medication actions
  const addMedication = (medData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const newId = `med-${Date.now()}`;
    const nowISO = new Date().toISOString();
    let assignedOrder = medData.sortOrder;
    if (assignedOrder === undefined) {
      const memberMeds = medications.filter((m) => m.memberId === medData.memberId);
      const maxOrder = memberMeds.reduce((max, m) => Math.max(max, m.sortOrder ?? 0), -1);
      assignedOrder = maxOrder + 1;
    }
    const newMed: Medication = {
      ...medData,
      id: newId,
      sortOrder: assignedOrder,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    setMedications((prev) => [...prev, newMed]);
    return newId;
  };

  const updateMedication = (id: string, updates: Partial<Medication>) => {
    const nowISO = new Date().toISOString();
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, ...updates, updatedAt: nowISO } : med))
    );
  };

  const deleteMedication = (id: string): Medication | null => {
    let deletedItem: Medication | null = null;
    setMedications((prev) => {
      const found = prev.find((m) => m.id === id);
      if (found) deletedItem = found;
      return prev.filter((med) => med.id !== id);
    });
    return deletedItem;
  };

  const restoreMedication = (med: Medication) => {
    setMedications((prev) => {
      if (prev.some((m) => m.id === med.id)) return prev;
      return [med, ...prev];
    });
  };

  // Reorder a single medication within its profile up or down
  const moveMedication = (medicationId: string, direction: 'up' | 'down') => {
    setMedications((prev) => {
      const target = prev.find((m) => m.id === medicationId);
      if (!target) return prev;

      // Filter and sort items belonging to this specific family member
      const memberMeds = prev
        .filter((m) => m.memberId === target.memberId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const currentIndex = memberMeds.findIndex((m) => m.id === medicationId);
      if (currentIndex === -1) return prev;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= memberMeds.length) return prev;

      // Swap positions
      const reordered = [...memberMeds];
      const temp = reordered[currentIndex];
      reordered[currentIndex] = reordered[targetIndex];
      reordered[targetIndex] = temp;

      // Create mapping of medId -> new sortOrder
      const orderMap = new Map<string, number>();
      reordered.forEach((m, idx) => {
        orderMap.set(m.id, idx);
      });

      const nowISO = new Date().toISOString();
      return prev.map((m) => {
        if (orderMap.has(m.id)) {
          return {
            ...m,
            sortOrder: orderMap.get(m.id),
            updatedAt: nowISO,
          };
        }
        return m;
      });
    });
  };

  // Automatically sequence a family member's medications chronologically: Morning -> Midday -> Evening -> Bedtime
  const sortByTimeOfDay = (memberId: string) => {
    setMedications((prev) => {
      const memberMeds = prev.filter((m) => m.memberId === memberId);
      if (memberMeds.length === 0) return prev;

      // Sort by Time of Day rank (1=Morning, 2=Midday, 3=Evening, 4=Bedtime, 5=Other)
      // Tie breaker: Alphabetical by medication name
      const sorted = [...memberMeds].sort((a, b) => {
        const rankA = getTimeOfDayRank(a);
        const rankB = getTimeOfDayRank(b);
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });

      const orderMap = new Map<string, number>();
      sorted.forEach((m, idx) => {
        orderMap.set(m.id, idx);
      });

      const nowISO = new Date().toISOString();
      return prev.map((m) => {
        if (orderMap.has(m.id)) {
          return {
            ...m,
            sortOrder: orderMap.get(m.id),
            updatedAt: nowISO,
          };
        }
        return m;
      });
    });
  };

  // Batch reorder a member's medications with an explicit array of IDs
  const reorderMedications = (memberId: string, orderedIds: string[]) => {
    setMedications((prev) => {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => {
        orderMap.set(id, idx);
      });

      const nowISO = new Date().toISOString();
      return prev.map((m) => {
        if (m.memberId === memberId && orderMap.has(m.id)) {
          return {
            ...m,
            sortOrder: orderMap.get(m.id),
            updatedAt: nowISO,
          };
        }
        return m;
      });
    });
  };

  // Smart Inventory Logging with fractional dose support
  const logDailySupply = (medicationId: string, customDose?: number) => {
    const target = medications.find((m) => m.id === medicationId);
    if (!target) return;

    const today = getTodayDateString();
    const deduction = customDose !== undefined ? customDose : target.dailyTotalTablets;
    const newStock = Math.max(0, Math.round((target.currentStock - deduction) * 100) / 100);

    // Create log
    const logItem: DoseLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      medicationId: target.id,
      memberId: target.memberId,
      date: today,
      timestamp: new Date().toISOString(),
      tabletsDeducted: deduction,
      actionType: 'daily_supply',
      note: `Dose logged (-${formatTablets(deduction, true)})`,
    };

    setLogs((prev) => [logItem, ...prev]);
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medicationId
          ? {
              ...m,
              currentStock: newStock,
              lastDoseLoggedDate: today,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );
  };

  const logAllDailySuppliesForMember = (memberId: string): number => {
    const today = getTodayDateString();
    const now = new Date();
    // Only target medications that are active, not logged today, AND scheduled for today!
    const targetMeds = medications.filter(
      (m) => m.memberId === memberId && m.active && m.lastDoseLoggedDate !== today && isMedDueOnDate(m, now)
    );

    if (targetMeds.length === 0) return 0;

    const newLogs: DoseLog[] = [];
    const timestamp = new Date().toISOString();

    setMedications((prev) =>
      prev.map((m) => {
        if (m.memberId === memberId && m.active && m.lastDoseLoggedDate !== today && isMedDueOnDate(m, now)) {
          const deduction = m.dailyTotalTablets;
          const newStock = Math.max(0, Math.round((m.currentStock - deduction) * 100) / 100);

          newLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            medicationId: m.id,
            memberId: m.memberId,
            date: today,
            timestamp,
            tabletsDeducted: deduction,
            actionType: 'daily_supply',
            note: `Scheduled dose logged (-${formatTablets(deduction, true)})`,
          });

          return {
            ...m,
            currentStock: newStock,
            lastDoseLoggedDate: today,
            updatedAt: timestamp,
          };
        }
        return m;
      })
    );

    setLogs((prev) => [...newLogs, ...prev]);
    return targetMeds.length;
  };

  const undoLog = (logId: string) => {
    const targetLog = logs.find((l) => l.id === logId);
    if (!targetLog) return;

    // Restore stock
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id === targetLog.medicationId) {
          let adjustedStock = m.currentStock;
          if (targetLog.actionType === 'daily_supply' || targetLog.actionType === 'single_dose') {
            adjustedStock = Math.round((m.currentStock + targetLog.tabletsDeducted) * 100) / 100;
          } else if (targetLog.actionType === 'restock') {
            adjustedStock = Math.max(0, Math.round((m.currentStock - targetLog.tabletsDeducted) * 100) / 100);
          }
          return {
            ...m,
            currentStock: adjustedStock,
            lastDoseLoggedDate: '', // clear today's flag if undone
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      })
    );

    // Remove log entry
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  const restockMedication = (medicationId: string, additionalTablets: number, note?: string) => {
    const target = medications.find((m) => m.id === medicationId);
    if (!target) return;

    const newStock = Math.round((target.currentStock + additionalTablets) * 100) / 100;
    const today = getTodayDateString();

    const logItem: DoseLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      medicationId: target.id,
      memberId: target.memberId,
      date: today,
      timestamp: new Date().toISOString(),
      tabletsDeducted: -additionalTablets, // negative deduction = added
      actionType: 'restock',
      note: note || `Restocked +${formatTablets(additionalTablets, true)}`,
    };

    setLogs((prev) => [logItem, ...prev]);
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medicationId
          ? {
              ...m,
              currentStock: newStock,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );
  };

  const adjustStock = (medicationId: string, newCount: number, reason?: string) => {
    const target = medications.find((m) => m.id === medicationId);
    if (!target) return;

    const diff = newCount - target.currentStock;
    const today = getTodayDateString();

    const logItem: DoseLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      medicationId: target.id,
      memberId: target.memberId,
      date: today,
      timestamp: new Date().toISOString(),
      tabletsDeducted: -diff,
      actionType: 'adjustment',
      note: reason || `Manual stock adjustment to ${newCount} tablets`,
    };

    setLogs((prev) => [logItem, ...prev]);
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medicationId
          ? {
              ...m,
              currentStock: Math.max(0, newCount),
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );
  };

  const resetToDefaultData = () => {
    setProfiles(INITIAL_MEMBERS);
    setMedications(INITIAL_MEDICATIONS);
    setLogs([]);
    setSelectedMemberId('all');
    localStorage.removeItem(STORAGE_KEY);
  };

  const clearAllData = () => {
    setProfiles([]);
    setMedications([]);
    setLogs([]);
    setSelectedMemberId('all');
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportDataJSON = (): string => {
    const state: StorageState = {
      profiles,
      medications,
      logs,
    };
    return JSON.stringify(state, null, 2);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed: StorageState = JSON.parse(jsonString);
      if (Array.isArray(parsed.profiles) && Array.isArray(parsed.medications)) {
        setProfiles(parsed.profiles);
        setMedications(parsed.medications);
        setLogs(parsed.logs || []);
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON import', e);
    }
    return false;
  };

  return (
    <MedicationContext.Provider
      value={{
        profiles,
        medications,
        logs,
        selectedMemberId,
        setSelectedMemberId,
        activeTab,
        setActiveTab,
        fontScale,
        setFontScale,
        darkMode,
        setDarkMode,
        addMember,
        updateMember,
        deleteMember,
        addMedication,
        updateMedication,
        deleteMedication,
        restoreMedication,
        moveMedication,
        sortByTimeOfDay,
        reorderMedications,
        logDailySupply,
        logAllDailySuppliesForMember,
        undoLog,
        restockMedication,
        adjustStock,
        calculateDaysRemaining,
        isLowStock,
        isCriticalStock,
        getLowStockMedications,
        isLoggedToday,
        resetToDefaultData,
        clearAllData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedication = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedication must be used within a MedicationProvider');
  }
  return context;
};
