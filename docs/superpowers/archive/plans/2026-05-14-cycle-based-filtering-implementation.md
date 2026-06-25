# Cycle-Based Filtering & Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Score recipes by phase-specific nutrients and recommend recipes based on user's current menstrual cycle phase.

**Architecture:** Database-driven nutrient targets per phase. Server-side scoring engine calculates recommendation score (0-100) for each recipe based on how well nutrients match phase needs. Caching for performance. Transparent scoring (show matched nutrients + reason).

**Tech Stack:** TypeScript, Next.js API Routes, SQLite/PostgreSQL, Jest

**Dependencies:** 
- Sub-Project 1 (Nutrition Database) - for recipe nutrients
- Sub-Project 3 (Cycle Tracking) - for user's current phase

**Blocking Requirements**: Plan 1 + Plan 3 must be complete before starting

---

## File Structure

**New files to create:**
```
src/
├── lib/cycle-recommendations/
│   ├── scorer.ts              # Score calculation
│   ├── targets.ts             # Phase nutrient targets
│   ├── types.ts               # Recommendation types
│   └── constants.ts           # Target values per phase
├── api/recipes/
│   ├── filtered/
│   │   └── route.ts           # GET /api/recipes/filtered
│   ├── recommended/
│   │   └── route.ts           # GET /api/recipes/recommended
│   └── [id]/
│       └── phase-scores/
│           └── route.ts       # GET /api/recipes/:id/phase-scores
├── components/recipe/
│   ├── PhaseFilter.tsx
│   ├── RecipeCard.tsx         # Enhanced with score
│   ├── ScoreIndicator.tsx
│   ├── PhaseLabel.tsx
│   └── NutrientBreakdown.tsx
└── __tests__/
    ├── unit/cycle-recommendations/
    │   ├── scorer.test.ts
    │   └── targets.test.ts
    └── integration/cycle-recommendations/
        └── filtering-api.test.ts
```

**Modify existing files:**
- `src/api/recipes/route.ts` - Add nutrition fields to recipe list

---

## Tasks

### Task 1: Create Database Schema for Phase Targets

**Files:**
- Create: `src/db/migrations/003_create_phase_targets.sql`

- [ ] **Step 1: Create phase_nutrient_targets table**

```sql
-- src/db/migrations/003_create_phase_targets.sql
CREATE TABLE IF NOT EXISTS phase_nutrient_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_name VARCHAR(50) NOT NULL,
  nutrient_name VARCHAR(100) NOT NULL,
  daily_value_amount DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  priority VARCHAR(20) NOT NULL,  -- CRITICAL, HIGH, MEDIUM
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(phase_name, nutrient_name)
);

CREATE INDEX idx_phase_targets_phase ON phase_nutrient_targets(phase_name);
```

- [ ] **Step 2: Create recipe_phase_scores cache table**

```sql
CREATE TABLE IF NOT EXISTS recipe_phase_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  phase_name VARCHAR(50) NOT NULL,
  score DECIMAL(5,2),
  matched_nutrients VARCHAR(500),  -- JSON array
  reason TEXT,
  
  last_calculated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(recipe_id, phase_name)
);

CREATE INDEX idx_recipe_scores_recipe ON recipe_phase_scores(recipe_id);
CREATE INDEX idx_recipe_scores_phase ON recipe_phase_scores(phase_name);
```

- [ ] **Step 3: Verify migration**

```bash
sqlite3 :memory: < src/db/migrations/003_create_phase_targets.sql
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/db/migrations/003_create_phase_targets.sql
git commit -m "feat: create phase nutrient targets and recipe scoring tables"
```

---

### Task 2: Create Recommendation Type Definitions

**Files:**
- Create: `src/lib/cycle-recommendations/types.ts`

- [ ] **Step 1: Create types**

```typescript
// src/lib/cycle-recommendations/types.ts

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  CRITICAL: 1.0,
  HIGH: 0.75,
  MEDIUM: 0.5,
};

export interface PhaseNutrientTarget {
  nutrient_name: string;
  daily_value: number;
  unit: string;
  priority: Priority;
  weight: number;
}

export interface RecipePhaseScore {
  recipe_id: number;
  phase_name: string;
  score: number; // 0-100
  matched_nutrients: string[]; // top 3
  reason: string;
  last_calculated: Date;
}

export interface RecipeScoredForPhase {
  recipe_id: number;
  name: string;
  score: number;
  phase: string;
  matched_nutrients: string[];
  reason: string;
  per_portion?: Record<string, number>;
}

export interface FilterOptions {
  phase: string;
  min_score?: number;
  sort_by?: 'score' | 'name' | 'kcal';
  limit?: number;
}

export interface NutrientMap {
  [key: string]: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cycle-recommendations/types.ts
git commit -m "feat: add cycle recommendation type definitions"
```

---

### Task 3: Create Phase Nutrient Targets

**Files:**
- Create: `src/lib/cycle-recommendations/targets.ts`
- Create: `src/lib/cycle-recommendations/constants.ts`

- [ ] **Step 1: Create constants file**

```typescript
// src/lib/cycle-recommendations/constants.ts

export const PHASE_NUTRIENT_TARGETS = {
  Menstruation: {
    Iron: { daily_value: 18, unit: 'mg', priority: 'CRITICAL' },
    vitamin_b12: { daily_value: 2.4, unit: 'mcg', priority: 'HIGH' },
    zinc: { daily_value: 8, unit: 'mg', priority: 'HIGH' },
    vitamin_c: { daily_value: 75, unit: 'mg', priority: 'MEDIUM' },
    protein: { daily_value: 46, unit: 'g', priority: 'MEDIUM' },
  },
  Follicular: {
    vitamin_d: { daily_value: 15, unit: 'mcg', priority: 'CRITICAL' },
    vitamin_b6: { daily_value: 1.3, unit: 'mg', priority: 'HIGH' },
    magnesium: { daily_value: 310, unit: 'mg', priority: 'HIGH' },
    folate: { daily_value: 400, unit: 'mcg', priority: 'MEDIUM' },
    protein: { daily_value: 46, unit: 'g', priority: 'MEDIUM' },
  },
  Ovulation: {
    vitamin_e: { daily_value: 15, unit: 'mg', priority: 'CRITICAL' },
    zinc: { daily_value: 8, unit: 'mg', priority: 'CRITICAL' },
    selenium: { daily_value: 55, unit: 'mcg', priority: 'HIGH' },
    vitamin_c: { daily_value: 75, unit: 'mg', priority: 'HIGH' },
    protein: { daily_value: 46, unit: 'g', priority: 'MEDIUM' },
  },
  Luteal: {
    magnesium: { daily_value: 310, unit: 'mg', priority: 'CRITICAL' },
    calcium: { daily_value: 1000, unit: 'mg', priority: 'CRITICAL' },
    vitamin_b6: { daily_value: 1.3, unit: 'mg', priority: 'HIGH' },
    iron: { daily_value: 18, unit: 'mg', priority: 'MEDIUM' },
  },
} as const;

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  VERY_GOOD: 60,
  GOOD: 50,
  DECENT: 40,
  DEFAULT_MIN: 50,
} as const;

export const REASON_TEMPLATES = {
  Menstruation: {
    matched: [
      `Excellent source of iron and B12`,
      `Good source of iron for blood replenishment`,
      `Supports energy recovery with protein`,
    ],
  },
  Follicular: {
    matched: [
      `Good source of vitamin D and B vitamins`,
      `Supports energy with B6 and magnesium`,
      `Aids nutrient absorption`,
    ],
  },
  Ovulation: {
    matched: [
      `Perfect for peak fertility with antioxidants`,
      `High in antioxidants (Vitamin E, Zinc)`,
      `Excellent source of selenium and zinc`,
    ],
  },
  Luteal: {
    matched: [
      `Perfect for luteal phase - high in magnesium and calcium`,
      `Supports mood regulation with magnesium`,
      `Helps with PMS prevention (Mg + Ca)`,
    ],
  },
} as const;
```

- [ ] **Step 2: Create targets file**

```typescript
// src/lib/cycle-recommendations/targets.ts

import { PHASE_NUTRIENT_TARGETS } from './constants';
import { PhaseNutrientTarget, PRIORITY_WEIGHTS } from './types';

export function getPhaseTargets(phase: string): PhaseNutrientTarget[] {
  const targets = PHASE_NUTRIENT_TARGETS[phase as keyof typeof PHASE_NUTRIENT_TARGETS];

  if (!targets) {
    throw new Error(`Unknown phase: ${phase}`);
  }

  return Object.entries(targets).map(([nutrient_name, target]) => ({
    nutrient_name,
    daily_value: target.daily_value,
    unit: target.unit,
    priority: target.priority,
    weight: PRIORITY_WEIGHTS[target.priority],
  }));
}

export function getAllPhaseTargets(): Record<string, PhaseNutrientTarget[]> {
  const phases = Object.keys(PHASE_NUTRIENT_TARGETS);
  const result: Record<string, PhaseNutrientTarget[]> = {};

  for (const phase of phases) {
    result[phase] = getPhaseTargets(phase);
  }

  return result;
}

export function validateTargets(): boolean {
  try {
    const phases = Object.keys(PHASE_NUTRIENT_TARGETS);
    for (const phase of phases) {
      getPhaseTargets(phase);
    }
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cycle-recommendations/constants.ts src/lib/cycle-recommendations/targets.ts
git commit -m "feat: add phase nutrient targets and reason templates"
```

---

### Task 4: Create Scoring Engine

**Files:**
- Create: `src/lib/cycle-recommendations/scorer.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/unit/cycle-recommendations/scorer.test.ts

import { calculateRecipeScore } from '@/lib/cycle-recommendations/scorer';
import { Nutrients } from '@/lib/nutrition/types';
import { getPhaseTargets } from '@/lib/cycle-recommendations/targets';

describe('Recipe Scorer', () => {
  const mockRecipeNutrients: Nutrients = {
    kcal: 320,
    sugar: 12,
    fat: 8,
    protein: 18,
    carbohydrates: 45,
    fiber: 6,
    sodium: 400,
    calcium: 250,
    vitamin_d: 8,
    magnesium: 80,
    vitamin_b6: 0.5,
    vitamin_b12: 0.8,
    vitamin_e: 8,
    zinc: 2,
  };

  it('scores recipe based on phase nutrients', () => {
    const targets = getPhaseTargets('Luteal');
    const score = calculateRecipeScore(
      mockRecipeNutrients,
      'Luteal',
      targets
    );

    expect(score.score).toBeGreaterThan(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.matched_nutrients.length).toBeGreaterThan(0);
  });

  it('scores higher for phase-matching nutrients', () => {
    const targets = getPhaseTargets('Menstruation');
    const menstruationScore = calculateRecipeScore(
      mockRecipeNutrients,
      'Menstruation',
      targets
    );

    const ovulationTargets = getPhaseTargets('Ovulation');
    const ovulationScore = calculateRecipeScore(
      mockRecipeNutrients,
      'Ovulation',
      ovulationTargets
    );

    // Same nutrients, different phase priorities
    // Score should vary
    expect(menstruationScore.score).not.toBe(ovulationScore.score);
  });

  it('returns top 3 matched nutrients', () => {
    const targets = getPhaseTargets('Ovulation');
    const score = calculateRecipeScore(
      mockRecipeNutrients,
      'Ovulation',
      targets
    );

    expect(score.matched_nutrients.length).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/unit/cycle-recommendations/scorer.test.ts -v
```

Expected: FAIL

- [ ] **Step 3: Implement scorer**

```typescript
// src/lib/cycle-recommendations/scorer.ts

import { Nutrients } from '@/lib/nutrition/types';
import { PhaseNutrientTarget, RecipePhaseScore, NutrientMap } from './types';
import { REASON_TEMPLATES } from './constants';

interface ScoreResult {
  score: number;
  matched_nutrients: string[];
  reason: string;
  contributions: Array<{ nutrient: string; contribution: number }>;
}

export function calculateRecipeScore(
  recipeNutrients: Nutrients,
  phase: string,
  targets: PhaseNutrientTarget[]
): ScoreResult {
  let total_weighted_contribution = 0;
  const contributions: Array<{ nutrient: string; contribution: number }> = [];

  // Calculate contribution for each target nutrient
  for (const target of targets) {
    const recipe_amount = (recipeNutrients as any)[target.nutrient_name];

    if (typeof recipe_amount !== 'number' || recipe_amount === 0) {
      continue;
    }

    // Normalize: how much of daily value does this provide?
    const normalized = recipe_amount / target.daily_value;

    // Cap at 1.0 (100% of daily value is sufficient)
    const capped = Math.min(normalized, 1.0);

    // Apply phase priority weight
    const contribution = capped * target.weight;

    total_weighted_contribution += contribution;
    contributions.push({
      nutrient: target.nutrient_name,
      contribution,
    });
  }

  // Top 3 nutrients by contribution
  const topNutrients = contributions
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map(c => c.nutrient);

  // Normalize to 0-100 scale
  const max_possible = targets.reduce((sum, t) => sum + t.weight, 0);
  const score = (total_weighted_contribution / max_possible) * 100;

  // Generate reason text
  const reason = generateReasonText(topNutrients, phase);

  return {
    score: parseFloat(score.toFixed(1)),
    matched_nutrients: topNutrients,
    reason,
    contributions,
  };
}

function generateReasonText(nutrients: string[], phase: string): string {
  if (nutrients.length === 0) {
    return 'Minimal phase-specific nutrients';
  }

  const templates = REASON_TEMPLATES[phase as keyof typeof REASON_TEMPLATES]?.matched || [];
  if (templates.length === 0) {
    return `Contains ${nutrients.slice(0, 2).join(', ')}`;
  }

  // Pick a template randomly
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template;
}

export function scoreRecipes(
  recipesWithNutrients: Array<{ id: number; per_portion: Nutrients }>,
  phase: string,
  targets: PhaseNutrientTarget[]
): Array<{ recipe_id: number; score: number }> {
  return recipesWithNutrients.map(recipe => {
    const result = calculateRecipeScore(recipe.per_portion, phase, targets);
    return {
      recipe_id: recipe.id,
      score: result.score,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/unit/cycle-recommendations/scorer.test.ts -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/cycle-recommendations/scorer.ts src/__tests__/unit/cycle-recommendations/scorer.test.ts
git commit -m "feat: implement recipe scoring engine for phase-specific nutrients"
```

---

### Task 5: Create Filtered Recipes API

**Files:**
- Create: `src/api/recipes/filtered/route.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/integration/cycle-recommendations/filtering-api.test.ts

import { GET as getFiltered } from '@/api/recipes/filtered/route';

describe('GET /api/recipes/filtered', () => {
  it('returns recipes filtered by phase', async () => {
    const request = new Request(
      'http://localhost/api/recipes/filtered?phase=menstruation&min_score=50',
      { headers: { 'Authorization': 'Bearer token' } }
    );

    const response = await getFiltered(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data[0]).toHaveProperty('score');
    expect(data.data[0]).toHaveProperty('matched_nutrients');
  });

  it('filters by minimum score', async () => {
    const request = new Request(
      'http://localhost/api/recipes/filtered?phase=ovulation&min_score=70',
      { headers: { 'Authorization': 'Bearer token' } }
    );

    const response = await getFiltered(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.data.forEach((recipe: any) => {
      expect(recipe.score).toBeGreaterThanOrEqual(70);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/integration/cycle-recommendations/filtering-api.test.ts -v
```

Expected: FAIL

- [ ] **Step 3: Create endpoint**

```typescript
// src/api/recipes/filtered/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/client';
import { calculateRecipeScore } from '@/lib/cycle-recommendations/scorer';
import { getPhaseTargets } from '@/lib/cycle-recommendations/targets';
import { SCORE_THRESHOLDS } from '@/lib/cycle-recommendations/constants';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const phase = searchParams.get('phase') || 'menstruation';
    const min_score = parseInt(searchParams.get('min_score') || '50');
    const sort_by = searchParams.get('sort_by') || 'score';
    const limit = parseInt(searchParams.get('limit') || '20');

    const db = await getDatabase();

    // Fetch recipes with nutrients for this user
    const recipes = await db.all(
      `SELECT r.id, r.name, rn.per_portion_kcal as kcal
       FROM recipes r
       LEFT JOIN recipe_nutrients rn ON r.id = rn.recipe_id
       WHERE r.user_id = ?
       LIMIT ?`,
      [user.userId, limit * 2] // Fetch extra for filtering
    );

    // Get phase targets
    const targets = getPhaseTargets(phase);

    // Score each recipe
    const scored = recipes
      .map(recipe => {
        // Fetch full nutrient data
        const nutrientsRow = db.prepare(
          `SELECT * FROM recipe_nutrients WHERE recipe_id = ?`
        ).get(recipe.id);

        if (!nutrientsRow) {
          return null;
        }

        const recipeNutrients = {
          kcal: nutrientsRow.per_portion_kcal,
          sugar: nutrientsRow.per_portion_sugar,
          fat: nutrientsRow.per_portion_fat,
          protein: nutrientsRow.per_portion_protein,
          carbohydrates: nutrientsRow.per_portion_carbohydrates,
          fiber: nutrientsRow.per_portion_fiber,
          sodium: nutrientsRow.per_portion_sodium,
          calcium: nutrientsRow.per_portion_calcium,
          vitamin_d: nutrientsRow.per_portion_vitamin_d,
          magnesium: nutrientsRow.per_portion_magnesium,
          vitamin_b6: nutrientsRow.per_portion_vitamin_b6,
          vitamin_b12: nutrientsRow.per_portion_vitamin_b12,
          vitamin_e: nutrientsRow.per_portion_vitamin_e,
          zinc: nutrientsRow.per_portion_zinc,
        };

        const scoreResult = calculateRecipeScore(
          recipeNutrients,
          phase,
          targets
        );

        return {
          recipe_id: recipe.id,
          name: recipe.name,
          score: scoreResult.score,
          matched_nutrients: scoreResult.matched_nutrients,
          reason: scoreResult.reason,
          phase,
        };
      })
      .filter(r => r !== null && r.score >= min_score)
      .sort((a, b) => {
        if (sort_by === 'score') return b.score - a.score;
        if (sort_by === 'name') return a.name.localeCompare(b.name);
        return 0;
      })
      .slice(0, limit);

    return NextResponse.json({
      status: 200,
      data: scored,
      total_count: scored.length,
      average_score: scored.length > 0
        ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(1)
        : 0,
    });
  } catch (error) {
    console.error('Filter error:', error);
    return NextResponse.json(
      { error: 'Filtering failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/integration/cycle-recommendations/filtering-api.test.ts -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/recipes/filtered/route.ts
git commit -m "feat: add GET /api/recipes/filtered endpoint with phase-based scoring"
```

---

### Task 6: Create Recommended Recipes Endpoint

**Files:**
- Create: `src/api/recipes/recommended/route.ts`

- [ ] **Step 1: Create endpoint**

```typescript
// src/api/recipes/recommended/route.ts

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

    // Get user's current cycle
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

    // Calculate current phase
    const currentPhase = calculateCurrentPhase({
      last_menstruation_date: new Date(cycle.last_menstruation_date),
      cycle_length_days: cycle.cycle_length_days,
    });

    // Redirect to filtered endpoint with current phase
    const url = new URL(request.url);
    url.pathname = '/api/recipes/filtered';
    url.searchParams.set('phase', currentPhase.phase.name.toLowerCase());

    const filteredRequest = new Request(url, request);
    const response = await fetch(filteredRequest);

    return response;
  } catch (error) {
    console.error('Recommended recipes error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/recipes/recommended/route.ts
git commit -m "feat: add GET /api/recipes/recommended endpoint for current phase"
```

---

### Task 7: Create Recipe Phase Scores Endpoint

**Files:**
- Create: `src/api/recipes/[id]/phase-scores/route.ts`

- [ ] **Step 1: Create endpoint**

```typescript
// src/api/recipes/[id]/phase-scores/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/client';
import { calculateRecipeScore } from '@/lib/cycle-recommendations/scorer';
import { getAllPhaseTargets } from '@/lib/cycle-recommendations/targets';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = parseInt(params.id);
    const db = await getDatabase();

    // Verify ownership
    const recipe = await db.get(
      'SELECT * FROM recipes WHERE id = ? AND user_id = ?',
      [recipeId, user.userId]
    );

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Get recipe nutrients
    const nutrients = await db.get(
      'SELECT * FROM recipe_nutrients WHERE recipe_id = ?',
      [recipeId]
    );

    if (!nutrients) {
      return NextResponse.json(
        { error: 'Recipe nutrients not calculated' },
        { status: 404 }
      );
    }

    const recipeNutrients = {
      kcal: nutrients.per_portion_kcal,
      sugar: nutrients.per_portion_sugar,
      fat: nutrients.per_portion_fat,
      protein: nutrients.per_portion_protein,
      carbohydrates: nutrients.per_portion_carbohydrates,
      fiber: nutrients.per_portion_fiber,
      sodium: nutrients.per_portion_sodium,
      calcium: nutrients.per_portion_calcium,
      vitamin_d: nutrients.per_portion_vitamin_d,
      magnesium: nutrients.per_portion_magnesium,
      vitamin_b6: nutrients.per_portion_vitamin_b6,
      vitamin_b12: nutrients.per_portion_vitamin_b12,
      vitamin_e: nutrients.per_portion_vitamin_e,
      zinc: nutrients.per_portion_zinc,
    };

    // Score for all phases
    const allTargets = getAllPhaseTargets();
    const scores = Object.entries(allTargets).map(([phase, targets]) => {
      const result = calculateRecipeScore(recipeNutrients, phase, targets);
      return {
        phase,
        score: result.score,
        matched_nutrients: result.matched_nutrients,
        reason: result.reason,
      };
    });

    return NextResponse.json({
      status: 200,
      data: {
        recipe_id: recipeId,
        scores,
      },
    });
  } catch (error) {
    console.error('Phase scores error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate phase scores' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/recipes/[id]/phase-scores/route.ts
git commit -m "feat: add GET /api/recipes/:id/phase-scores endpoint"
```

---

### Task 8: Create React Components

**Files:**
- Create: `src/components/recipe/PhaseFilter.tsx`
- Create: `src/components/recipe/ScoreIndicator.tsx`
- Create: `src/components/recipe/PhaseLabel.tsx`
- Modify: `src/components/recipe/RecipeCard.tsx`

- [ ] **Step 1: Create PhaseFilter**

```typescript
// src/components/recipe/PhaseFilter.tsx

'use client';

import { useState } from 'react';

const PHASES = ['menstruation', 'follicular', 'ovulation', 'luteal'];
const PHASE_LABELS: Record<string, string> = {
  menstruation: 'Menstruation 🔴',
  follicular: 'Follicular 🟡',
  ovulation: 'Ovulation 🩷',
  luteal: 'Luteal 🟦',
};

interface PhaseFilterProps {
  onFilterChange: (phase: string, minScore: number) => void;
  currentPhase?: string;
}

export default function PhaseFilter({ onFilterChange, currentPhase }: PhaseFilterProps) {
  const [selectedPhase, setSelectedPhase] = useState(currentPhase || 'menstruation');
  const [minScore, setMinScore] = useState(50);

  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    onFilterChange(phase, minScore);
  };

  const handleScoreChange = (score: number) => {
    setMinScore(score);
    onFilterChange(selectedPhase, score);
  };

  return (
    <div className="phase-filter">
      <div className="phase-buttons">
        {PHASES.map(phase => (
          <button
            key={phase}
            className={`phase-btn ${selectedPhase === phase ? 'active' : ''}`}
            onClick={() => handlePhaseChange(phase)}
          >
            {PHASE_LABELS[phase]}
          </button>
        ))}
      </div>

      <div className="score-slider">
        <label>Min Score: {minScore}</label>
        <input
          type="range"
          min="0"
          max="100"
          value={minScore}
          onChange={e => handleScoreChange(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ScoreIndicator**

```typescript
// src/components/recipe/ScoreIndicator.tsx

'use client';

interface ScoreIndicatorProps {
  score: number;
}

export default function ScoreIndicator({ score }: ScoreIndicatorProps) {
  const getColor = (s: number) => {
    if (s >= 80) return '#4CAF50'; // Green
    if (s >= 60) return '#FFC107'; // Amber
    if (s >= 40) return '#FF9800'; // Orange
    return '#ccc'; // Gray
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Very Good';
    if (s >= 40) return 'Good';
    return 'Fair';
  };

  return (
    <div className="score-indicator">
      <div
        className="score-circle"
        style={{
          background: getColor(score),
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        {score.toFixed(0)}
      </div>
      <p className="score-label">{getLabel(score)}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create PhaseLabel**

```typescript
// src/components/recipe/PhaseLabel.tsx

'use client';

const PHASE_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  Menstruation: { emoji: '🔴', label: 'Menstruation', color: '#ff4444' },
  Follicular: { emoji: '🟡', label: 'Follicular', color: '#ffdd00' },
  Ovulation: { emoji: '🩷', label: 'Ovulation', color: '#ff69b4' },
  Luteal: { emoji: '🟦', label: 'Luteal', color: '#4444ff' },
};

interface PhaseLabelProps {
  phase: string;
}

export default function PhaseLabel({ phase }: PhaseLabelProps) {
  const info = PHASE_INFO[phase];
  if (!info) return null;

  return (
    <span className="phase-label" style={{ color: info.color }}>
      {info.emoji} Perfect for {info.label} Phase
    </span>
  );
}
```

- [ ] **Step 4: Update RecipeCard (enhance with score)**

```typescript
// Add to src/components/recipe/RecipeCard.tsx (modify existing if present)

'use client';

import ScoreIndicator from './ScoreIndicator';
import PhaseLabel from './PhaseLabel';

interface RecipeCardProps {
  recipe_id: number;
  name: string;
  score?: number;
  phase?: string;
  matched_nutrients?: string[];
  reason?: string;
}

export default function RecipeCard({
  recipe_id,
  name,
  score = 0,
  phase,
  matched_nutrients = [],
  reason,
}: RecipeCardProps) {
  return (
    <div className="recipe-card">
      <div className="recipe-header">
        <h3>{name}</h3>
        {score !== undefined && <ScoreIndicator score={score} />}
      </div>

      {phase && <PhaseLabel phase={phase} />}

      {reason && <p className="reason">{reason}</p>}

      {matched_nutrients.length > 0 && (
        <div className="nutrients">
          <p className="label">Rich in:</p>
          <ul>
            {matched_nutrients.map(nut => (
              <li key={nut}>{nut}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/recipe/
git commit -m "feat: add cycle-based filtering UI components (PhaseFilter, ScoreIndicator, PhaseLabel)"
```

---

### Task 9: Run Tests & Coverage

**Files:**
- Test: All recommendation tests

- [ ] **Step 1: Run unit tests**

```bash
npm run test -- src/__tests__/unit/cycle-recommendations/ -v
```

Expected: PASS

- [ ] **Step 2: Run integration tests**

```bash
npm run test -- src/__tests__/integration/cycle-recommendations/ -v
```

Expected: PASS

- [ ] **Step 3: Check coverage**

```bash
npm run test:coverage -- src/lib/cycle-recommendations/
```

Expected: 90%+ coverage

- [ ] **Step 4: Lint**

```bash
npm run lint -- src/lib/cycle-recommendations/ src/api/recipes/
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: verify cycle recommendation coverage (90%+)"
```

---

### Task 10: Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add API documentation**

```markdown
### Cycle-Based Recommendation Endpoints

**GET /api/recipes/filtered**
- Filter recipes by phase with recommendation scores
- Auth: Required
- Query Params:
  - `phase`: menstruation|follicular|ovulation|luteal
  - `min_score`: 0-100 (default: 50)
  - `sort_by`: score|name|kcal (default: score)
  - `limit`: max results (default: 20)
- Response: `{ data: RecipeScoredForPhase[], average_score }`

**GET /api/recipes/recommended**
- Get recommendations for user's current cycle phase
- Auth: Required
- Response: Same as /filtered, auto-filtered for current phase

**GET /api/recipes/:id/phase-scores**
- Get scores for a recipe across all 4 phases
- Auth: Required
- Response: `{ recipe_id, scores: [{ phase, score, matched_nutrients, reason }] }`
```

- [ ] **Step 2: Add recommendation scoring explanation**

```markdown
### How Recommendation Scoring Works

Each recipe is scored (0-100) based on phase-specific nutrients:

**Scoring Algorithm:**
1. For each nutrient important for the phase
2. Calculate: (recipe_amount / daily_value) * phase_priority_weight
3. Sum all contributions
4. Normalize to 0-100 scale

**Score Interpretation:**
- 80-100: Excellent for phase (top nutrient match)
- 60-79: Very good for phase
- 50-59: Good for phase
- < 50: Not ideal for phase

**Example: Ovulation Phase**
- Needs: Vitamin E (CRITICAL), Zinc (CRITICAL), Antioxidants
- Score 90: "Perfect for Ovulation - high in Vitamin E and Zinc"
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add cycle-based recommendation API documentation"
```

---

## Checklist Summary

- [ ] Task 1: Database schema (phase targets + scores table)
- [ ] Task 2: Type definitions for recommendations
- [ ] Task 3: Phase nutrient targets and constants
- [ ] Task 4: Scoring engine with tests
- [ ] Task 5: GET /api/recipes/filtered endpoint
- [ ] Task 6: GET /api/recipes/recommended endpoint
- [ ] Task 7: GET /api/recipes/:id/phase-scores endpoint
- [ ] Task 8: React components (PhaseFilter, ScoreIndicator, PhaseLabel)
- [ ] Task 9: Tests and coverage (90%+)
- [ ] Task 10: Documentation

**Total Effort**: ~10 tasks, 45-60 minutes for experienced developer

---

## Dependencies

- ✅ **BLOCKING**: Sub-Project 1 (Nutrition Database) must be complete
- ✅ **BLOCKING**: Sub-Project 3 (Cycle Tracking) must be complete

**Can start ONLY AFTER Plans 1 + 3 are complete**

---

**Plan Status**: Ready for execution  
**Recommended Execution**: Subagent-driven (Task-by-task with review)

---

## Complete Feature Summary

**After all 4 sub-projects are implemented:**

**User Journey:**
1. Initialize cycle (Plan 3) → set start date + cycle length
2. Create recipe manually OR upload photo (Plans 1 + 2) → ingredients extracted, nutrients calculated
3. View recipe recommendations (Plan 4) → filtered by current cycle phase, scored 0-100
4. Browse all phases → see which recipes are best for each phase

**Tech Stack:**
- Nutrition: SQLite table (300 ingredients), calculation engine
- OCR: Tesseract.js, fuzzy matching, hybrid parsing
- Cycle: Phase calculation (modulo math), API endpoints
- Recommendations: Phase-specific nutrient scoring, caching, filtering

**Key Metrics:**
- ~500 total lines of business logic (calculator, scorer, parser)
- ~600 lines of API endpoints
- ~400 lines of React components
- ~800 lines of tests
- 80%+ test coverage across all modules

---

**All 4 Plans Complete!** ✅
