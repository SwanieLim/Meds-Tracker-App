export interface AlternativeBrand {
  id: string;
  name: string;
  manufacturer?: string;
  notes?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  avatarColor: string;
  notes?: string;
  createdAt: string;
}

export type ScheduleType = 'daily' | 'weekdays' | 'specific_days' | 'alternate_days';

export interface Medication {
  id: string;
  memberId: string;
  name: string;
  brandName: string;
  dosageStrength?: string;
  dosageInstructions: string;
  tabletsPerDose: number; // can be 0.5, 1, 1.5, etc.
  timesPerDay: number;
  dailyTotalTablets: number; // on taking days
  scheduleType?: ScheduleType;
  scheduleDays?: string[]; // e.g. ['mon', 'wed', 'thu']
  purpose: string;
  currentStock: number; // can be decimal e.g. 14.5
  lowStockThresholdDays: number;
  alternativeBrands: AlternativeBrand[];
  instructions?: string;
  prescribingDoctor?: string;
  active: boolean;
  sortOrder?: number; // Custom display sequence index within member's profile
  lastDoseLoggedDate?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  tabletsDeducted: number;
  actionType: 'daily_supply' | 'single_dose' | 'restock' | 'adjustment';
  note?: string;
}

export type FontScale = 'normal' | 'large' | 'xlarge';

export type NavigationTab = 'dashboard' | 'profiles' | 'medications' | 'history';
