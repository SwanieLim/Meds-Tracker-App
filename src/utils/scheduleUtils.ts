import { Medication, ScheduleType } from '../types';

export interface DayOption {
  key: string;
  shortLabel: string;
  fullLabel: string;
  dayIndex: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export const DAYS_OF_WEEK: DayOption[] = [
  { key: 'mon', shortLabel: 'Mon', fullLabel: 'Monday', dayIndex: 1 },
  { key: 'tue', shortLabel: 'Tue', fullLabel: 'Tuesday', dayIndex: 2 },
  { key: 'wed', shortLabel: 'Wed', fullLabel: 'Wednesday', dayIndex: 3 },
  { key: 'thu', shortLabel: 'Thu', fullLabel: 'Thursday', dayIndex: 4 },
  { key: 'fri', shortLabel: 'Fri', fullLabel: 'Friday', dayIndex: 5 },
  { key: 'sat', shortLabel: 'Sat', fullLabel: 'Saturday', dayIndex: 6 },
  { key: 'sun', shortLabel: 'Sun', fullLabel: 'Sunday', dayIndex: 0 },
];

/**
 * Checks whether a medication is scheduled to be taken on a given date.
 */
export function isMedDueOnDate(med: Medication, targetDate: Date = new Date()): boolean {
  if (!med.active) return false;

  const scheduleType = med.scheduleType || 'daily';

  if (scheduleType === 'daily') {
    return true;
  }

  const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday

  if (scheduleType === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (scheduleType === 'specific_days') {
    const days = med.scheduleDays || [];
    if (days.length === 0) return true; // fallback to daily if none picked
    const currentDayMatch = DAYS_OF_WEEK.find((d) => d.dayIndex === dayOfWeek);
    return currentDayMatch ? days.includes(currentDayMatch.key) : false;
  }

  if (scheduleType === 'alternate_days') {
    // Determine parity relative to medication creation date
    const created = new Date(med.createdAt || '2026-01-01');
    const diffTime = Math.abs(targetDate.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays % 2 === 0;
  }

  return true;
}

/**
 * Gets details on whether medication is due today, and when the next due dose is.
 */
export function getScheduleDueStatus(med: Medication, fromDate: Date = new Date()): {
  isDueToday: boolean;
  nextDueText: string;
} {
  const isDueToday = isMedDueOnDate(med, fromDate);

  if (isDueToday) {
    return {
      isDueToday: true,
      nextDueText: 'Due today',
    };
  }

  // Scan forward up to 14 days to find the next scheduled taking day
  for (let offset = 1; offset <= 14; offset++) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(fromDate.getDate() + offset);

    if (isMedDueOnDate(med, nextDate)) {
      if (offset === 1) {
        return { isDueToday: false, nextDueText: 'Next dose: Tomorrow' };
      }
      const dayName = nextDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      return { isDueToday: false, nextDueText: `Next: ${dayName}` };
    }
  }

  return { isDueToday: false, nextDueText: 'Not scheduled' };
}

/**
 * Simulates calendar days remaining accounting for rest days, weekends, and specific schedules.
 */
export function calculateCalendarDaysRemaining(med: Medication, fromDate: Date = new Date()): number {
  if (med.currentStock <= 0) return 0;

  const dailyDose = Math.max(0.1, Number(med.dailyTotalTablets) || 1);
  let simulatedStock = med.currentStock;
  let calendarDays = 0;
  const MAX_DAYS = 730; // Max 2 years

  const checkDate = new Date(fromDate);

  while (simulatedStock >= dailyDose && calendarDays < MAX_DAYS) {
    // If today is a taking day, subtract dose
    if (isMedDueOnDate(med, checkDate)) {
      simulatedStock = Math.round((simulatedStock - dailyDose) * 100) / 100;
    }

    calendarDays++;
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return calendarDays;
}

/**
 * Cleanly formats tablet counts (e.g. 0.5 -> "½", 1.5 -> "1½", 28.5 -> "28.5" or "28½")
 */
export function formatTablets(count: number, withSuffix: boolean = false): string {
  const rounded = Math.round(count * 100) / 100;
  let formatted = '';

  if (rounded === 0.5) {
    formatted = '½';
  } else if (rounded === 0.25) {
    formatted = '¼';
  } else if (rounded === 0.75) {
    formatted = '¾';
  } else if (rounded === 1.5) {
    formatted = '1½';
  } else if (rounded % 1 === 0.5) {
    formatted = `${Math.floor(rounded)}½`;
  } else if (rounded % 1 === 0) {
    formatted = `${rounded}`;
  } else {
    formatted = `${rounded}`;
  }

  if (withSuffix) {
    const isSingle = rounded === 1;
    return `${formatted} tablet${isSingle ? '' : 's'}`;
  }

  return formatted;
}

/**
 * Human readable schedule description (e.g. "Mon, Wed, Thu" or "Weekdays only")
 */
export function formatScheduleDescription(med: Medication): string {
  const scheduleType = med.scheduleType || 'daily';

  if (scheduleType === 'daily') {
    return 'Daily';
  }
  if (scheduleType === 'weekdays') {
    return 'Weekdays (Mon–Fri)';
  }
  if (scheduleType === 'alternate_days') {
    return 'Alternate Days';
  }
  if (scheduleType === 'specific_days') {
    const days = med.scheduleDays || [];
    if (days.length === 0) return 'Daily';
    const dayLabels = days
      .map((key) => DAYS_OF_WEEK.find((d) => d.key === key)?.shortLabel || key)
      .join(', ');
    return dayLabels;
  }

  return 'Daily';
}

/**
 * Returns a numerical rank (1-5) representing when during the day a medication is taken:
 * 1: Morning / Breakfast / AM
 * 2: Midday / Lunch / Noon
 * 3: Evening / Dinner / PM
 * 4: Bedtime / Night
 * 5: Flexible / Any time
 */
export function getTimeOfDayRank(med: Medication): number {
  const text = `${med.dosageInstructions} ${med.instructions || ''}`.toLowerCase();

  // 1. Bedtime / Night
  if (/\b(bedtime|before bed|night|sleep|at bedtime|before sleep)\b/i.test(text)) {
    return 4;
  }
  // 2. Evening / Dinner / PM
  if (/\b(evening|dinner|pm|supper|nightfall|sunset)\b/i.test(text)) {
    return 3;
  }
  // 3. Midday / Lunch / Noon / Afternoon
  if (/\b(noon|midday|lunch|afternoon|12\s*pm)\b/i.test(text)) {
    return 2;
  }
  // 4. Morning / Breakfast / AM
  if (/\b(morning|breakfast|am|waking|wake\s*up|fasting)\b/i.test(text)) {
    return 1;
  }

  // Fallback heuristic based on times per day
  if (med.timesPerDay === 1) {
    return 1; // Default single daily dose to morning
  }

  return 5;
}

/**
 * Human readable label for time of day grouping
 */
export function getTimeOfDayLabel(med: Medication): string {
  const rank = getTimeOfDayRank(med);
  switch (rank) {
    case 1:
      return 'Morning (AM)';
    case 2:
      return 'Midday / Lunch';
    case 3:
      return 'Evening / Dinner';
    case 4:
      return 'Bedtime / Night';
    default:
      return 'Anytime / As Directed';
  }
}
