# Custom Medication Reordering & Smart Time-of-Day Organization

Allow family caregivers to easily reorganize medications within each profile using quick Move Up/Down controls on cards and a one-tap smart "Sort by Time of Day (Morning → Night)" organizer to eliminate clutter and make long medication regimens effortless to follow.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed via Phase 1 interactive questions:

- **Confirmed Reordering Interaction**: Quick Move Up (↑) and Move Down (↓) buttons directly on each medication card, providing immediate, accessible touch controls on both mobile and desktop without modal friction.
- **Confirmed Smart Sort Preset**: Added one-tap "Sort by Time of Day (Morning → Night)" that automatically analyzes dosage schedules and times (Morning, Afternoon, Evening, Bedtime) to sequence medications into a natural daily routine.
- **Persistence**: Reordered sequence is saved persistently to `localStorage` per profile, ensuring custom orders survive app reloads and browser restarts.

---

## 1. Overview & Core Concept

- **What It Does**: Caregivers managing complex multi-drug regimens for parents or family members can custom sequence medications in the exact order they prefer. Instead of rigid insertion-order lists where evening pills are mixed between morning pills, users can step items up and down or tap one button to group their daily routine chronologically from breakfast to bedtime.
- **Target Audience**: Family caregivers, adult children managing elderly parents' prescriptions (e.g. Mum and Dad), and patients managing multiple chronic therapies.
- **Key Value**: Drastically reduces cognitive fatigue and prevents missed doses caused by hunting through disorganized, long medication lists.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Viewing Profile Medications in Order**:
   - Selecting a profile (e.g., "Mum" or "Dad") displays medications in the user's custom sequence.
   - Each card displays its sequence number (e.g., `#1`, `#2`) alongside quick Move Up (↑) and Move Down (↓) buttons in the card header.

2. **Moving Items Up or Down**:
   - Tapping **↑ Move Up** shifts the medication one spot earlier in the profile's sequence with instant visual feedback and smooth layout transitions.
   - Tapping **↓ Move Down** moves it later in the sequence.
   - Controls are gracefully disabled at boundaries (first card has disabled Up; last card has disabled Down).

3. **One-Tap Smart Routine Organization**:
   - In the profile action toolbar, users can click **"Sort by Time of Day"** with a clock icon.
   - The app parses schedule times and dosage instructions (`Morning` / `Breakfast` → `Afternoon` / `Lunch` → `Evening` / `Dinner` → `Bedtime` / `Night`), sorts all medications into chronological daily order, updates the persisted sort orders, and displays a confirmation toast.

### Visual Identity & Theme

- **Warm Healthcare Palette**: Stone neutral backgrounds (`bg-stone-50` / `dark:bg-slate-950`), deep teal accents (`text-teal-700`, `bg-teal-600`), and warm amber/rose alerts.
- **Move Controls**: Tactile, accessible action buttons (`p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300`) with clear accessible `aria-label` attributes and tooltip titles.
- **Header Toolbar**: Clean, unboxed filter controls and a dedicated routine organizer button styled with calm contrast.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Card-Level Move Up / Down vs. Drag-and-Drop**
  - *Chosen Approach*: Card-level Move Up / Down touch buttons.
  - *Why*: Reliable across mobile touchscreens, tablets, and desktop mice without erratic mobile drag scrolling, accidental drops, or screen-reader accessibility hurdles.
  - *Alternatives Considered*: HTML5 drag-and-drop (prone to scrolling conflicts on mobile browsers) or separate modal (adds unnecessary navigation steps).

- **Decision 2: Smart Time-of-Day Parser**
  - *Chosen Approach*: Heuristic regex/keyword evaluation across `dosageInstructions`, `timesPerDay`, and purpose text to categorize each medication into 4 canonical daytime brackets (Morning: 1, Afternoon: 2, Evening: 3, Bedtime: 4, Unspecified: 5), with secondary alphabetical sort by name.
  - *Why*: Allows instant 1-click organization for regimens with 10+ medications without requiring manual re-entry of dosage data.

- **Decision 3: Isolated Ordering Per Profile**
  - *Chosen Approach*: `sortOrder` operates scoped to each family member's profile so Mum's order and Dad's order are independent and never conflict.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   MedicationContext                    │
│                                                        │
│  State: profiles[], medications[], logs[]              │
│  Methods:                                              │
│   - moveMedication(medicationId, 'up' | 'down')        │
│   - sortByTimeOfDay(memberId)                          │
│   - reorderMedications(memberId, orderedIds[])         │
│   - LocalStorage synchronization                       │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     FamilyProfiles        │ │      MedicationList       │
│                           │ │                           │
│ - "Sort by Time of Day"   │ │ - Displays custom sequence│
│ - Order badges (#1, #2)   │ │ - Filter & sort options   │
│ - [↑] and [↓] controls    │ │                           │
└───────────────────────────┘ └───────────────────────────┘
```

### Data Model Updates

In `src/types/index.ts`:
```typescript
export interface Medication {
  // ... existing fields ...
  sortOrder?: number; // Per-profile ordering index (0, 1, 2, ...)
}
```

### Context & Storage Methods

In `src/context/MedicationContext.tsx`:
- `moveMedication(medicationId: string, direction: 'up' | 'down')`: Finds the medication and its adjacent sibling within the same `memberId`, swaps their `sortOrder` values, updates state and saves to `localStorage`.
- `sortByTimeOfDay(memberId: string)`: Assigns chronological `sortOrder` based on time keywords:
  1. Morning / Breakfast / AM / Early morning
  2. Afternoon / Noon / Midday / Lunch
  3. Evening / Dinner / PM / Sunset
  4. Bedtime / Night / Before sleep
  5. As needed / Other
- Initialize existing sample medications with sensible default `sortOrder` values so initial data is cleanly ordered from the start.

### Component Updates

1. `src/components/FamilyProfiles.tsx`:
   - Sort `displayedMeds` by `(a.sortOrder ?? 0) - (b.sortOrder ?? 0)`.
   - Add Move Up (↑) and Move Down (↓) buttons next to the Edit and Delete buttons on each medication card.
   - Add "Sort by Time of Day" button in the member profile header.
2. `src/utils/scheduleUtils.ts`:
   - Helper `getTimeOfDayRank(med: Medication): number` for deterministic chronological routine sorting.

---

## 5. Verification Plan

1. **Compilation & Type Check**:
   - Run `lint_applet` (`tsc --noEmit`) to verify zero type mismatches with `sortOrder` and new context methods.
   - Run `compile_applet` to confirm a clean Vite production build.
2. **Reordering Verification**:
   - Test Move Up on an item: verify it swaps places with the preceding item and updates UI immediately.
   - Test boundary states: verify Move Up is disabled on the top item and Move Down is disabled on the bottom item.
   - Test "Sort by Time of Day": verify morning meds sort to top, evening/bedtime meds sort to bottom.
   - Test persistence: verify page reloads preserve the rearranged medication order.
