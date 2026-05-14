# Design Spec: Zyklus-Tracking
**Date**: 2026-05-14  
**Status**: Draft  
**Sub-Project**: Phase 2 - Nutrition Features (Sub-Project 3 of 4)

---

## 1. Overview

**Goal**: Enable women to track their menstrual cycle and use it for personalized nutrition recommendations.

**Scope**:
- Store cycle start date + cycle length (28-35 days typical)
- Calculate current cycle phase based on date
- Define 4 standard cycle phases
- Optional cycle notes/logs (for future tracking)
- Cycle phase API for filtering & recommendations (Sub-Project 4)

**Not in Scope**:
- Daily symptom tracking
- Predictions (AI/ML)
- Syncing with external health apps
- Cycle irregularity detection/alerts

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1: Cycle Registration**
- Users can input:
  - Date of last menstruation start
  - Average cycle length (days)
- System stores this as user's cycle profile

**FR2: Phase Calculation**
- System automatically calculates current cycle phase based on:
  - Last menstruation date
  - Cycle length
  - Today's date
- Calculate phases based on standard cycle timeline

**FR3: Phase Definitions**
- 4 phases with configurable day ranges:
  - Menstruation (days 1-5)
  - Follicular (days 1-13)
  - Ovulation (days 12-16)
  - Luteal (days 15-end of cycle)
- Phase day ranges are relative to cycle start

**FR4: Optional Cycle Logs**
- Users can optionally add notes per cycle (future use)
- Log structure: date, phase, optional notes
- For now: simple storage, used in Phase 3/4

**FR5: API for Phase Information**
- Endpoint to get current phase
- Endpoint to update cycle info
- Endpoint for filtered queries (used by Sub-Project 4)

### 2.2 Non-Functional Requirements

**NFR1: Accuracy**
- Phase calculations must be accurate within 1 day
- Support cycle lengths 21-35 days

**NFR2: Privacy**
- Cycle data is sensitive - store securely
- Only user can see their own cycle data
- No sharing or default visibility

**NFR3: Performance**
- Phase calculation: < 10ms
- Database queries: < 50ms

---

## 3. Database Schema

### 3.1 User Cycles Table

```sql
CREATE TABLE user_cycles (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL FOREIGN KEY UNIQUE,
  last_menstruation_date DATE NOT NULL,
  cycle_length_days INTEGER NOT NULL DEFAULT 28,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Constraints**:
- `cycle_length_days`: 21-35 (enforced in code)
- `last_menstruation_date`: cannot be in future
- `user_id`: UNIQUE (one cycle profile per user)

### 3.2 Cycle Phases Reference Table

```sql
CREATE TABLE cycle_phases (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  day_start INTEGER NOT NULL,
  day_end INTEGER NOT NULL,
  description TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data:
-- Menstruation (1-5), Follicular (1-13), Ovulation (12-16), Luteal (15-28)
```

### 3.3 Cycle Logs Table (Optional)

```sql
CREATE TABLE cycle_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL FOREIGN KEY,
  log_date DATE NOT NULL,
  phase VARCHAR(50),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, log_date)
);
```

---

## 4. Cycle Phase Calculation

### 4.1 Phase Definition

**Standard 28-day cycle:**
```
Day 1-5:   Menstruation (bleeding)
Day 1-13:  Follicular (estrogen rises)
Day 12-16: Ovulation (fertility peak, day 14 typical)
Day 15-28: Luteal (progesterone rises)
```

**Overlaps are intentional** (follicular includes early ovulation, etc.)

### 4.2 Calculation Logic

```typescript
function calculateCurrentPhase(
  lastMenstruationDate: Date,
  cycleLengthDays: number,
  today: Date = new Date()
): {
  phase: CyclePhase,
  dayOfCycle: number,
  cycleProgress: number
}

// Algorithm:
1. dayOfCycle = (today - lastMenstruationDate) % cycleLengthDays
   // Example: if lastMenstruation = 2026-05-01, today = 2026-05-15
   // dayOfCycle = 14

2. For each phase in [Menstruation, Follicular, Ovulation, Luteal]:
   - Check if dayOfCycle falls within [day_start, day_end]
   - Return matching phase (with priority: Ovulation > Follicular > Luteal > Menstruation)

3. cycleProgress = dayOfCycle / cycleLengthDays
   // Example: 14 / 28 = 0.5 (50% through cycle)

// Returns:
{
  phase: "Ovulation",
  dayOfCycle: 14,
  cycleProgress: 0.5
}
```

**Phase Priority** (for overlapping days):
1. Ovulation (days 12-16) - most specific
2. Follicular or Luteal (based on position)
3. Menstruation (days 1-5)

### 4.3 Examples

**Example 1: 28-day cycle**
- Last menstruation: 2026-05-01
- Today: 2026-05-15 (day 15 of cycle)
- Cycle length: 28 days
- Current phase: Ovulation (day 12-16)

**Example 2: 35-day cycle**
- Last menstruation: 2026-04-30
- Today: 2026-05-14 (day 15 of cycle)
- Cycle length: 35 days
- Current phase: Follicular/Ovulation (overlapping)

---

## 5. API Specification

### 5.1 POST /api/users/cycle

**Purpose**: Register/initialize cycle info

**Request**:
```json
{
  "last_menstruation_date": "2026-04-30",
  "cycle_length_days": 28
}
```

**Response**:
```json
{
  "data": {
    "user_id": 123,
    "last_menstruation_date": "2026-04-30",
    "cycle_length_days": 28,
    "current_phase": "Ovulation",
    "day_of_cycle": 14,
    "cycle_progress": 0.5
  }
}
```

### 5.2 GET /api/users/cycle

**Purpose**: Get user's cycle info + current phase

**Response**:
```json
{
  "data": {
    "last_menstruation_date": "2026-04-30",
    "cycle_length_days": 28,
    "current_phase": {
      "name": "Ovulation",
      "day_of_cycle": 14,
      "cycle_progress": 0.5,
      "day_start": 12,
      "day_end": 16,
      "description": "Peak fertility phase"
    }
  }
}
```

### 5.3 PUT /api/users/cycle

**Purpose**: Update cycle info (new start date or cycle length)

**Request**:
```json
{
  "last_menstruation_date": "2026-05-05",
  "cycle_length_days": 30
}
```

**Response**: Same as POST

### 5.4 GET /api/users/cycle/phases

**Purpose**: Get all cycle phases (for reference)

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Menstruation",
      "day_start": 1,
      "day_end": 5,
      "description": "Bleeding phase, low hormones"
    },
    {
      "id": 2,
      "name": "Follicular",
      "day_start": 1,
      "day_end": 13,
      "description": "Follicle development, estrogen rises"
    },
    {
      "id": 3,
      "name": "Ovulation",
      "day_start": 12,
      "day_end": 16,
      "description": "Peak fertility, luteinizing hormone surge"
    },
    {
      "id": 4,
      "name": "Luteal",
      "day_start": 15,
      "day_end": 28,
      "description": "Progesterone rises, body temperature up"
    }
  ]
}
```

### 5.5 GET /api/users/cycle/phase-on-date/:date

**Purpose**: Get phase for any specific date (used for meal planning, etc.)

**Request**: `/api/users/cycle/phase-on-date/2026-06-15`

**Response**:
```json
{
  "data": {
    "date": "2026-06-15",
    "day_of_cycle": 45 % 28 = 17,
    "phase": "Luteal"
  }
}
```

---

## 6. Implementation Details

### 6.1 File Structure

```
src/
├── lib/
│   └── cycle/
│       ├── calculator.ts       # Phase calculation logic
│       ├── types.ts            # Cycle-related types
│       └── constants.ts        # Phase definitions
├── api/
│   └── users/
│       └── cycle/
│           ├── route.ts        # GET, POST, PUT
│           └── phases/
│               ├── route.ts    # GET all phases
│               └── [date]/
│                   └── route.ts # GET phase for date
├── components/
│   └── cycle/
│       ├── CycleForm.tsx
│       ├── CycleInfo.tsx
│       └── PhaseIndicator.tsx
├── __tests__/
│   ├── unit/
│   │   └── cycle/
│   │       └── calculator.test.ts
│   └── integration/
│       └── cycle/
│           └── cycle-api.test.ts
└── db/
    └── seeds/
        └── cycle-phases.ts     # Phase definitions
```

### 6.2 Core Functions

**`src/lib/cycle/calculator.ts`**:
```typescript
interface CycleInfo {
  lastMenstruationDate: Date;
  cycleLengthDays: number;
}

interface CyclePhase {
  name: string;
  dayStart: number;
  dayEnd: number;
  description: string;
}

interface CurrentPhase {
  phase: CyclePhase;
  dayOfCycle: number;
  cycleProgress: number;
}

function calculateCurrentPhase(
  cycleInfo: CycleInfo,
  today?: Date
): CurrentPhase

function calculatePhaseOnDate(
  cycleInfo: CycleInfo,
  date: Date
): CurrentPhase

function getDayOfCycle(
  lastMenstruationDate: Date,
  cycleLengthDays: number,
  date: Date
): number
```

### 6.3 Type Definitions

```typescript
interface UserCycle {
  id: number;
  user_id: number;
  last_menstruation_date: Date;
  cycle_length_days: number;
  created_at: Date;
  updated_at: Date;
}

interface CyclePhaseDefinition {
  id: number;
  name: string;
  day_start: number;
  day_end: number;
  description: string;
}

interface CycleLog {
  id: number;
  user_id: number;
  log_date: Date;
  phase: string;
  notes?: string;
  created_at: Date;
}
```

### 6.4 Validation

**Input Validation**:
```typescript
function validateCycleInfo(info: Partial<CycleInfo>): ValidationError[] {
  const errors = [];
  
  if (!info.lastMenstruationDate) {
    errors.push("Last menstruation date required");
  }
  if (info.lastMenstruationDate > new Date()) {
    errors.push("Last menstruation date cannot be in future");
  }
  if (!info.cycleLengthDays || info.cycleLengthDays < 21 || info.cycleLengthDays > 35) {
    errors.push("Cycle length must be 21-35 days");
  }
  
  return errors;
}
```

---

## 7. User Interface Components

### 7.1 CycleForm.tsx

- Input fields:
  - Date picker for "Last menstruation date"
  - Number input for "Cycle length (days)"
- Submit button
- Form validation + error messages
- Success message after submission

### 7.2 CycleInfo.tsx

- Display current cycle info:
  - Current phase (large, centered)
  - Day of cycle (e.g., "Day 14 of 28")
  - Cycle progress (visual bar)
  - Days until next phase
- "Edit cycle" button

### 7.3 PhaseIndicator.tsx

- Small visual component showing current phase
- Used in dashboards, recipe recommendations
- Color-coded per phase (Menstruation=red, Follicular=yellow, Ovulation=pink, Luteal=blue)

---

## 8. Phase Definitions (Seed Data)

```
Menstruation (Days 1-5):
- Description: Bleeding phase, hormone levels low
- Characteristics: Energy may be lower
- Key nutrients: Iron, B12

Follicular (Days 1-13):
- Description: Follicle develops, estrogen rises
- Characteristics: Energy increases, metabolism rises
- Key nutrients: Vitamin D, B vitamins

Ovulation (Days 12-16):
- Description: Egg release, luteinizing hormone surge
- Characteristics: Peak energy, peak fertility
- Key nutrients: Antioxidants (Vitamin E, Zinc)

Luteal (Days 15-28):
- Description: Corpus luteum forms, progesterone rises
- Characteristics: Slower metabolism, calorie needs increase
- Key nutrients: Magnesium, Calcium
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**File**: `src/__tests__/unit/cycle/calculator.test.ts`

Test cases:
- Standard 28-day cycle (all phases)
- Shorter 21-day cycle
- Longer 35-day cycle
- Day calculations (day 1, day 14, day 28)
- Cycle progress percentage
- Phase boundaries (day 13 vs 14 for phase change)
- Multiple cycles (date in next cycle)
- Current phase vs. historical phase
- Invalid dates (future, null)

### 9.2 Integration Tests

**File**: `src/__tests__/integration/cycle/cycle-api.test.ts`

Test cases:
- POST /api/users/cycle registers cycle
- GET /api/users/cycle returns current info
- PUT /api/users/cycle updates cycle
- GET /api/users/cycle/phases returns all phases
- GET /api/users/cycle/phase-on-date/:date works
- User can only see their own cycle
- Invalid cycle length rejected
- Future date rejected

### 9.3 Coverage Target

- `calculator.ts`: 100%
- API routes: 85%+
- Overall: 80%+

---

## 10. Edge Cases & Constraints

**Edge Cases**:
- First ever log (no previous cycle)
- Irregular cycles (phase may be inaccurate)
- Long cycles (> 35 days, not in standard model)
- Short cycles (< 21 days, not in standard model)
- Overlapping phases (by design)
- Cycle span across year boundary (Dec 28 → Jan 5)

**Constraints**:
- Cycle length: 21-35 days (enforced)
- Last menstruation: cannot be future date
- One cycle profile per user
- Phase definitions are static (not customizable in MVP)

**Assumptions**:
- Users know their cycle length (or can estimate)
- Cycle is relatively regular (within 21-35 range)
- No special cases (pregnancy, menopause, etc.)

---

## 11. Privacy & Security

**Data Sensitivity**:
- Cycle data is personal health information
- Encrypt at rest (future consideration)
- Never log or share user cycle data
- Only visible to user themselves

**Access Control**:
- All endpoints require authentication
- Users can only access their own cycle data
- No admin override (privacy first)

---

## 12. Future Enhancements (Not in Scope)

- Daily symptom/mood tracking
- Cycle irregularity detection
- Predictions (when next phase will occur)
- Syncing with external health apps
- Custom phase definitions per user
- Pregnancy/breastfeeding mode
- Menopause mode
- Mobile app notifications

---

## 13. Dependencies & Integration

**Depends On**:
- User authentication (from MVP)

**Integrates With**:
- Sub-Project 4 (Cycle-based filtering)
- Recipe recommendations
- Nutrient filtering

---

## 14. Definition of Done

✅ All items must be complete:

- [ ] Database tables created (user_cycles, cycle_phases, cycle_logs)
- [ ] Seed data for cycle phases inserted
- [ ] Phase calculation logic implemented (calculator.ts)
- [ ] All API endpoints implemented (GET, POST, PUT)
- [ ] CycleForm component built
- [ ] CycleInfo component built
- [ ] PhaseIndicator component built
- [ ] Input validation implemented
- [ ] Unit tests written (calculator) with 100% coverage
- [ ] Integration tests written (API) with 85%+ coverage
- [ ] Error handling + user messages
- [ ] No console errors
- [ ] Linting passes
- [ ] Tests pass with 80%+ coverage
- [ ] Code reviewed and approved

---

## 15. Acceptance Criteria

When complete, users should be able to:
1. ✅ Enter their last menstruation date and cycle length
2. ✅ See their current cycle phase
3. ✅ See day of cycle and progress
4. ✅ Update cycle info if needed
5. ✅ View phase definitions
6. ✅ API correctly calculates phases for any date

---

**Document Status**: Ready for user review
**Next Step**: User approval → Final sub-project spec (Sub-Project 4)
