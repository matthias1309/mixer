# Cycle Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build user menstrual cycle tracking with automatic phase calculation based on start date and cycle length.

**Architecture:** Stateless phase calculation from start date + cycle length. Four standard phases (Menstruation, Follicular, Ovulation, Luteal) with fixed day ranges. Optional cycle logs for future use. All data stored per user with privacy first.

**Tech Stack:** TypeScript, Next.js API Routes, SQLite/PostgreSQL, Jest, React

**Dependencies:** None (standalone sub-project 3 of 4)

---

## File Structure

**New files to create:**
```
src/
├── lib/cycle/
│   ├── calculator.ts          # Phase calculation logic
│   ├── types.ts               # Cycle-related types
│   └── constants.ts           # Phase definitions
├── api/users/
│   └── cycle/
│       ├── route.ts           # GET, POST, PUT cycle
│       ├── phases/
│       │   └── route.ts       # GET all phases
│       └── phase-on-date/
│           └── [date]/
│               └── route.ts   # GET phase for date
├── components/cycle/
│   ├── CycleForm.tsx
│   ├── CycleInfo.tsx
│   └── PhaseIndicator.tsx
└── __tests__/
    ├── unit/cycle/
    │   └── calculator.test.ts
    └── integration/cycle/
        └── cycle-api.test.ts
```

**Modify existing files:**
- `src/types/user.ts` - Add CycleInfo interface
- Database schema - Create cycle tables

---

## Tasks

### Task 1: Create Database Migration

**Files:**
- Create: `src/db/migrations/002_create_cycle_tables.sql`

- [ ] **Step 1: Create user_cycles table**

```sql
-- src/db/migrations/002_create_cycle_tables.sql
CREATE TABLE IF NOT EXISTS user_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  last_menstruation_date DATE NOT NULL,
  cycle_length_days INTEGER NOT NULL DEFAULT 28,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_cycles_user ON user_cycles(user_id);
```

- [ ] **Step 2: Create cycle_phases reference table**

```sql
CREATE TABLE IF NOT EXISTS cycle_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  day_start INTEGER NOT NULL,
  day_end INTEGER NOT NULL,
  description TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 3: Create cycle_logs table (optional)**

```sql
CREATE TABLE IF NOT EXISTS cycle_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  phase VARCHAR(50),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, log_date)
);

CREATE INDEX idx_cycle_logs_user ON cycle_logs(user_id);
CREATE INDEX idx_cycle_logs_date ON cycle_logs(log_date);
```

- [ ] **Step 4: Verify migration**

```bash
sqlite3 :memory: < src/db/migrations/002_create_cycle_tables.sql
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/db/migrations/002_create_cycle_tables.sql
git commit -m "feat: create cycle tracking database tables"
```

---

### Task 2: Create Type Definitions

**Files:**
- Create: `src/lib/cycle/types.ts`
- Modify: `src/types/user.ts`

- [ ] **Step 1: Create cycle types**

```typescript
// src/lib/cycle/types.ts

export interface CycleInfo {
  last_menstruation_date: Date;
  cycle_length_days: number;
}

export interface CyclePhase {
  id: number;
  name: string;
  day_start: number;
  day_end: number;
  description: string;
}

export interface CurrentPhase {
  phase: CyclePhase;
  day_of_cycle: number;
  cycle_progress: number; // 0-1
}

export interface UserCycle {
  id: number;
  user_id: number;
  last_menstruation_date: Date;
  cycle_length_days: number;
  created_at: Date;
  updated_at: Date;
}

export interface CycleLog {
  id: number;
  user_id: number;
  log_date: Date;
  phase: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CycleInfoResponse {
  last_menstruation_date: Date;
  cycle_length_days: number;
  current_phase: CurrentPhase;
}
```

- [ ] **Step 2: Extend user types**

Add to `src/types/user.ts`:

```typescript
import { CycleInfo } from '@/lib/cycle/types';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  cycle?: CycleInfo;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cycle/types.ts src/types/user.ts
git commit -m "feat: add cycle tracking type definitions"
```

---

### Task 3: Create Cycle Constants

**Files:**
- Create: `src/lib/cycle/constants.ts`

- [ ] **Step 1: Create constants**

```typescript
// src/lib/cycle/constants.ts

export const CYCLE_PHASES = {
  MENSTRUATION: 'Menstruation',
  FOLLICULAR: 'Follicular',
  OVULATION: 'Ovulation',
  LUTEAL: 'Luteal',
} as const;

export const PHASE_DEFINITIONS = [
  {
    name: CYCLE_PHASES.MENSTRUATION,
    day_start: 1,
    day_end: 5,
    description: 'Bleeding phase, hormone levels low',
  },
  {
    name: CYCLE_PHASES.FOLLICULAR,
    day_start: 1,
    day_end: 13,
    description: 'Follicle develops, estrogen rises',
  },
  {
    name: CYCLE_PHASES.OVULATION,
    day_start: 12,
    day_end: 16,
    description: 'Egg release, luteinizing hormone surge',
  },
  {
    name: CYCLE_PHASES.LUTEAL,
    day_start: 15,
    day_end: 28,
    description: 'Corpus luteum forms, progesterone rises',
  },
] as const;

export const CYCLE_LENGTH_MIN = 21;
export const CYCLE_LENGTH_MAX = 35;
export const DEFAULT_CYCLE_LENGTH = 28;

export const PHASE_PRIORITY = {
  [CYCLE_PHASES.OVULATION]: 4,
  [CYCLE_PHASES.FOLLICULAR]: 3,
  [CYCLE_PHASES.LUTEAL]: 3,
  [CYCLE_PHASES.MENSTRUATION]: 1,
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cycle/constants.ts
git commit -m "feat: add cycle phase constants and definitions"
```

---

### Task 4: Create Phase Calculator

**Files:**
- Create: `src/lib/cycle/calculator.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/unit/cycle/calculator.test.ts

import { calculateCurrentPhase, calculatePhaseOnDate } from '@/lib/cycle/calculator';
import { CYCLE_PHASES } from '@/lib/cycle/constants';

describe('Cycle Phase Calculator', () => {
  // Test date: 2026-05-14 (example)
  const testDate = new Date('2026-05-14');

  it('calculates current phase for 28-day cycle', () => {
    const lastMenstruation = new Date('2026-04-30'); // 14 days ago
    const result = calculateCurrentPhase(
      { last_menstruation_date: lastMenstruation, cycle_length_days: 28 },
      testDate
    );

    expect(result.day_of_cycle).toBe(14);
    expect(result.phase.name).toBe(CYCLE_PHASES.OVULATION);
    expect(result.cycle_progress).toBeCloseTo(0.5, 1);
  });

  it('handles day 1 of cycle', () => {
    const lastMenstruation = testDate; // Today is day 1
    const result = calculateCurrentPhase(
      { last_menstruation_date: lastMenstruation, cycle_length_days: 28 },
      testDate
    );

    expect(result.day_of_cycle).toBe(0);
    expect(result.phase.name).toBe(CYCLE_PHASES.MENSTRUATION);
  });

  it('calculates phase on specific date', () => {
    const lastMenstruation = new Date('2026-04-30');
    const queryDate = new Date('2026-05-05'); // Day 5 (last day of menstruation)

    const result = calculatePhaseOnDate(
      { last_menstruation_date: lastMenstruation, cycle_length_days: 28 },
      queryDate
    );

    expect(result.day_of_cycle).toBe(5);
    expect(result.phase.name).toBe(CYCLE_PHASES.MENSTRUATION);
  });

  it('handles different cycle lengths', () => {
    const lastMenstruation = new Date('2026-04-30');
    const result35day = calculateCurrentPhase(
      { last_menstruation_date: lastMenstruation, cycle_length_days: 35 },
      testDate
    );

    expect(result35day.day_of_cycle).toBe(14);
    const cycleProgress = 14 / 35;
    expect(result35day.cycle_progress).toBeCloseTo(cycleProgress, 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/unit/cycle/calculator.test.ts -v
```

Expected: FAIL - "calculateCurrentPhase is not defined"

- [ ] **Step 3: Implement calculator**

```typescript
// src/lib/cycle/calculator.ts

import { CycleInfo, CurrentPhase, CyclePhase } from './types';
import { PHASE_DEFINITIONS, PHASE_PRIORITY } from './constants';

function getDayOfCycle(
  lastMenstruationDate: Date,
  cycleLengthDays: number,
  date: Date
): number {
  const diffMs = date.getTime() - lastMenstruationDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays % cycleLengthDays;
}

function findPhaseForDay(dayOfCycle: number): CyclePhase {
  // Check overlapping phases by priority
  const phasesByPriority = PHASE_DEFINITIONS.sort(
    (a, b) => (PHASE_PRIORITY[b.name as keyof typeof PHASE_PRIORITY] || 0) -
              (PHASE_PRIORITY[a.name as keyof typeof PHASE_PRIORITY] || 0)
  );

  for (const phase of phasesByPriority) {
    if (dayOfCycle >= phase.day_start && dayOfCycle <= phase.day_end) {
      return phase as CyclePhase;
    }
  }

  // Fallback to first matching phase
  return (PHASE_DEFINITIONS.find(
    p => dayOfCycle >= p.day_start && dayOfCycle <= p.day_end
  ) || PHASE_DEFINITIONS[0]) as CyclePhase;
}

export function calculateCurrentPhase(
  cycleInfo: CycleInfo,
  today: Date = new Date()
): CurrentPhase {
  const dayOfCycle = getDayOfCycle(
    cycleInfo.last_menstruation_date,
    cycleInfo.cycle_length_days,
    today
  );

  const phase = findPhaseForDay(dayOfCycle);
  const cycleProgress = dayOfCycle / cycleInfo.cycle_length_days;

  return {
    phase,
    day_of_cycle: dayOfCycle,
    cycle_progress: cycleProgress,
  };
}

export function calculatePhaseOnDate(
  cycleInfo: CycleInfo,
  date: Date
): CurrentPhase {
  return calculateCurrentPhase(cycleInfo, date);
}

export function getDayOfCycleForDate(
  lastMenstruationDate: Date,
  cycleLengthDays: number,
  date: Date
): number {
  return getDayOfCycle(lastMenstruationDate, cycleLengthDays, date);
}

export function validateCycleInfo(info: Partial<CycleInfo>): string[] {
  const errors: string[] = [];

  if (!info.last_menstruation_date) {
    errors.push('Last menstruation date is required');
  } else if (info.last_menstruation_date > new Date()) {
    errors.push('Last menstruation date cannot be in the future');
  }

  if (!info.cycle_length_days || 
      info.cycle_length_days < 21 || 
      info.cycle_length_days > 35) {
    errors.push('Cycle length must be between 21 and 35 days');
  }

  return errors;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/unit/cycle/calculator.test.ts -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/cycle/calculator.ts src/__tests__/unit/cycle/calculator.test.ts
git commit -m "feat: implement cycle phase calculation (4 phases, modulo cycle length)"
```

---

### Task 5: Create Cycle API Endpoints

**Files:**
- Create: `src/api/users/cycle/route.ts`
- Create: `src/api/users/cycle/phases/route.ts`

- [ ] **Step 1: Write failing test for cycle endpoints**

```typescript
// src/__tests__/integration/cycle/cycle-api.test.ts

import { GET as getCycle, POST as postCycle } from '@/api/users/cycle/route';

describe('Cycle API Endpoints', () => {
  it('POST creates user cycle', async () => {
    const request = new Request('http://localhost/api/users/cycle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        last_menstruation_date: '2026-04-30',
        cycle_length_days: 28,
      }),
    });

    const response = await postCycle(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveProperty('current_phase');
    expect(data.data).toHaveProperty('cycle_length_days');
  });

  it('GET retrieves user cycle with current phase', async () => {
    const request = new Request('http://localhost/api/users/cycle', {
      headers: { 'Authorization': 'Bearer test-token' },
    });

    const response = await getCycle(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveProperty('current_phase');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/integration/cycle/cycle-api.test.ts -v
```

Expected: FAIL

- [ ] **Step 3: Create GET /api/users/cycle endpoint**

```typescript
// src/api/users/cycle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/client';
import { calculateCurrentPhase } from '@/lib/cycle/calculator';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const cycle = await db.get(
      'SELECT * FROM user_cycles WHERE user_id = ?',
      [user.userId]
    );

    if (!cycle) {
      return NextResponse.json(
        { error: 'Cycle not initialized' },
        { status: 404 }
      );
    }

    const currentPhase = calculateCurrentPhase({
      last_menstruation_date: new Date(cycle.last_menstruation_date),
      cycle_length_days: cycle.cycle_length_days,
    });

    return NextResponse.json({
      status: 200,
      data: {
        last_menstruation_date: cycle.last_menstruation_date,
        cycle_length_days: cycle.cycle_length_days,
        current_phase: currentPhase,
      },
    });
  } catch (error) {
    console.error('Cycle fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cycle' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { last_menstruation_date, cycle_length_days } = body;

    // Validate input
    if (!last_menstruation_date) {
      return NextResponse.json(
        { error: 'Last menstruation date required' },
        { status: 400 }
      );
    }

    if (!cycle_length_days || cycle_length_days < 21 || cycle_length_days > 35) {
      return NextResponse.json(
        { error: 'Cycle length must be 21-35 days' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if exists
    const existing = await db.get(
      'SELECT id FROM user_cycles WHERE user_id = ?',
      [user.userId]
    );

    const cycleDate = new Date(last_menstruation_date);

    if (existing) {
      // Update
      await db.run(
        `UPDATE user_cycles SET
          last_menstruation_date = ?, cycle_length_days = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [cycleDate, cycle_length_days, user.userId]
      );
    } else {
      // Create
      await db.run(
        `INSERT INTO user_cycles (user_id, last_menstruation_date, cycle_length_days)
         VALUES (?, ?, ?)`,
        [user.userId, cycleDate, cycle_length_days]
      );
    }

    const currentPhase = calculateCurrentPhase({
      last_menstruation_date: cycleDate,
      cycle_length_days,
    });

    return NextResponse.json({
      status: 200,
      data: {
        last_menstruation_date,
        cycle_length_days,
        current_phase: currentPhase,
      },
    });
  } catch (error) {
    console.error('Cycle create error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update cycle' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // PUT is same as POST for updates
  return POST(request);
}
```

- [ ] **Step 4: Create GET /api/users/cycle/phases endpoint**

```typescript
// src/api/users/cycle/phases/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { PHASE_DEFINITIONS } from '@/lib/cycle/constants';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      status: 200,
      data: PHASE_DEFINITIONS,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch phases' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test -- src/__tests__/integration/cycle/cycle-api.test.ts -v
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/api/users/cycle/route.ts src/api/users/cycle/phases/route.ts
git commit -m "feat: add GET/POST /api/users/cycle endpoints"
```

---

### Task 6: Create Phase-on-Date Endpoint

**Files:**
- Create: `src/api/users/cycle/phase-on-date/[date]/route.ts`

- [ ] **Step 1: Create endpoint**

```typescript
// src/api/users/cycle/phase-on-date/[date]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/client';
import { calculatePhaseOnDate } from '@/lib/cycle/calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const cycle = await db.get(
      'SELECT * FROM user_cycles WHERE user_id = ?',
      [user.userId]
    );

    if (!cycle) {
      return NextResponse.json(
        { error: 'Cycle not initialized' },
        { status: 404 }
      );
    }

    const queryDate = new Date(params.date);
    if (isNaN(queryDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const result = calculatePhaseOnDate(
      {
        last_menstruation_date: new Date(cycle.last_menstruation_date),
        cycle_length_days: cycle.cycle_length_days,
      },
      queryDate
    );

    return NextResponse.json({
      status: 200,
      data: {
        date: params.date,
        day_of_cycle: result.day_of_cycle,
        phase: result.phase.name,
      },
    });
  } catch (error) {
    console.error('Phase on date error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate phase' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/users/cycle/phase-on-date/[date]/route.ts
git commit -m "feat: add GET /api/users/cycle/phase-on-date/:date endpoint"
```

---

### Task 7: Create React Components

**Files:**
- Create: `src/components/cycle/CycleForm.tsx`
- Create: `src/components/cycle/CycleInfo.tsx`
- Create: `src/components/cycle/PhaseIndicator.tsx`

- [ ] **Step 1: Create CycleForm**

```typescript
// src/components/cycle/CycleForm.tsx

'use client';

import { useState } from 'react';
import { CurrentPhase } from '@/lib/cycle/types';

interface CycleFormProps {
  onSave?: (data: any) => void;
}

export default function CycleForm({ onSave }: CycleFormProps) {
  const [date, setDate] = useState('');
  const [length, setLength] = useState('28');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_menstruation_date: date,
          cycle_length_days: parseInt(length),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save cycle');
      }

      const data = await response.json();
      onSave?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cycle-form">
      <h2>Track Your Cycle</h2>

      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label htmlFor="last-date">Last Menstruation Date</label>
        <input
          id="last-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cycle-length">Cycle Length (days)</label>
        <input
          id="cycle-length"
          type="number"
          min="21"
          max="35"
          value={length}
          onChange={e => setLength(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Cycle'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create CycleInfo**

```typescript
// src/components/cycle/CycleInfo.tsx

'use client';

import { useEffect, useState } from 'react';
import { CycleInfoResponse } from '@/lib/cycle/types';
import PhaseIndicator from './PhaseIndicator';

export default function CycleInfo() {
  const [cycle, setCycle] = useState<CycleInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCycle();
  }, []);

  const fetchCycle = async () => {
    try {
      const response = await fetch('/api/users/cycle');
      if (response.ok) {
        const data = await response.json();
        setCycle(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cycle:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!cycle) return <div>Cycle not set. Please initialize first.</div>;

  return (
    <div className="cycle-info">
      <h2>Your Cycle</h2>

      <div className="phase-display">
        <PhaseIndicator phase={cycle.current_phase.phase.name} />
      </div>

      <div className="details">
        <p>
          <strong>Day of Cycle:</strong> {cycle.current_phase.day_of_cycle + 1} of{' '}
          {cycle.cycle_length_days}
        </p>
        <p>
          <strong>Phase:</strong> {cycle.current_phase.phase.name}
        </p>
        <p>
          <strong>Progress:</strong>{' '}
          {(cycle.current_phase.cycle_progress * 100).toFixed(0)}%
        </p>
      </div>

      <button onClick={() => fetchCycle()}>Refresh</button>
    </div>
  );
}
```

- [ ] **Step 3: Create PhaseIndicator**

```typescript
// src/components/cycle/PhaseIndicator.tsx

'use client';

interface PhaseIndicatorProps {
  phase: string;
}

const PHASE_EMOJIS: Record<string, string> = {
  'Menstruation': '🔴',
  'Follicular': '🟡',
  'Ovulation': '🩷',
  'Luteal': '🟦',
};

const PHASE_COLORS: Record<string, string> = {
  'Menstruation': '#ff4444',
  'Follicular': '#ffdd00',
  'Ovulation': '#ff69b4',
  'Luteal': '#4444ff',
};

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const emoji = PHASE_EMOJIS[phase] || '●';
  const color = PHASE_COLORS[phase] || '#ccc';

  return (
    <div className="phase-indicator" style={{ color }}>
      <span className="emoji">{emoji}</span>
      <span className="name">{phase}</span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/cycle/
git commit -m "feat: add cycle form and info components"
```

---

### Task 8: Run Tests & Coverage

**Files:**
- Test: All cycle tests

- [ ] **Step 1: Run unit tests**

```bash
npm run test -- src/__tests__/unit/cycle/ -v
```

Expected: PASS

- [ ] **Step 2: Run integration tests**

```bash
npm run test -- src/__tests__/integration/cycle/ -v
```

Expected: PASS

- [ ] **Step 3: Check coverage**

```bash
npm run test:coverage -- src/lib/cycle/
```

Expected: 100% for calculator, 95%+ overall

- [ ] **Step 4: Lint**

```bash
npm run lint -- src/lib/cycle/ src/api/users/cycle/
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: verify cycle module coverage (100%)"
```

---

### Task 9: Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add cycle documentation**

```markdown
### Cycle Tracking Endpoints

**POST /api/users/cycle**
- Initialize or update cycle info
- Auth: Required
- Body: `{ last_menstruation_date: "YYYY-MM-DD", cycle_length_days: number }`
- Response: `{ current_phase, cycle_length_days, last_menstruation_date }`

**GET /api/users/cycle**
- Get user's current cycle and phase
- Auth: Required
- Response: Current cycle info with phase data

**GET /api/users/cycle/phases**
- Get all phase definitions
- Auth: Required
- Response: Array of CyclePhase (4 phases)

**GET /api/users/cycle/phase-on-date/:date**
- Get phase for any specific date
- Auth: Required
- Response: Phase info for that date
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add cycle tracking API documentation"
```

---

## Checklist Summary

- [ ] Task 1: Database migration created
- [ ] Task 2: Type definitions
- [ ] Task 3: Cycle constants and phases
- [ ] Task 4: Phase calculator (100% coverage)
- [ ] Task 5: GET/POST cycle endpoints
- [ ] Task 6: Phase-on-date endpoint
- [ ] Task 7: React components (Form, Info, Indicator)
- [ ] Task 8: Tests and coverage (100%)
- [ ] Task 9: Documentation

**Total Effort**: ~9 tasks, 35-45 minutes

---

## Dependencies

- ✅ None - this is a completely independent sub-project
- ✅ Can be implemented in parallel with Sub-Project 1

**Can start IMMEDIATELY (no blocking dependencies)**

---

**Plan Status**: Ready for execution  
**Recommended Execution**: Subagent-driven (Task-by-task)
