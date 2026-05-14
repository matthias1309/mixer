# Design Spec: Zyklus-basierte Filterung & Empfehlungen
**Date**: 2026-05-14  
**Status**: Draft  
**Sub-Project**: Phase 2 - Nutrition Features (Sub-Project 4 of 4)

---

## 1. Overview

**Goal**: Filter and recommend recipes based on the user's current menstrual cycle phase and nutritional needs during that phase.

**Scope**:
- Define nutrient priorities for each cycle phase
- Calculate a recommendation score (0-100) for each recipe per phase
- Display recipes with recommendations + phase labels
- Filter recipes by phase
- Show why a recipe is recommended (nutrient breakdown)

**Dependencies**:
- Sub-Project 1 (Nutrition Database & Calculation)
- Sub-Project 3 (Cycle Tracking)

**Not in Scope**:
- Custom nutrient profiles per user
- AI-based recommendations
- Personalized nutrient targets
- Shopping lists
- Meal planning

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1: Phase-Nutrient Mapping**
- Define which nutrients are important for each phase:
  - Menstruation: Iron, Vitamin B12, Zinc
  - Follicular: Vitamin D, Vitamin B6, Magnesium
  - Ovulation: Vitamin E, Zinc, Antioxidants
  - Luteal: Magnesium, Calcium, Vitamin B6

**FR2: Recommendation Scoring**
- Calculate score (0-100) for each recipe based on phase:
  - Higher score = better match for phase nutrients
  - Based on nutrient density compared to standard targets
  - Normalized across recipes for fair comparison

**FR3: Phase-Based Filtering**
- Users can filter recipes by their current phase
- Or view recipes for a different phase
- Show only recipes with score >= threshold (default: 50)

**FR4: Recipe Display with Recommendations**
- Show recipe card with:
  - Name + photo
  - Recommendation score (0-100)
  - Phase label (e.g., "Perfect for Ovulation Phase")
  - Top 3 nutrients matched (e.g., "High in Vitamin E, Zinc")
  - Reason text (e.g., "Excellent source of antioxidants")

**FR5: Detailed Nutrient Breakdown**
- Click recipe → see:
  - All nutrients per portion
  - Which nutrients match phase
  - Nutrient bars showing % of target

### 2.2 Non-Functional Requirements

**NFR1: Performance**
- Scoring calculation: < 100ms for 100 recipes
- Filtering/sorting: < 200ms
- No loading spinner for typical use

**NFR2: Accuracy**
- Scores consistent across recipes
- Normalized fairly (no one nutrient dominates)
- Transparent calculation logic

**NFR3: Usability**
- Intuitive "why recommended" messaging
- Visual indicators (colors, icons) for phase + score

---

## 3. Nutrient Priorities per Phase

### 3.1 Phase Nutrient Mapping

**Menstruation (Days 1-5)**
```
Primary Focus: Blood replenishment, iron absorption
Key Nutrients:
  - Iron (Eisen): 18mg (women 19-50yo) [CRITICAL]
  - Vitamin B12: 2.4mcg [HIGH]
  - Zinc: 8mg [HIGH]
  - Vitamin C: 75mg (aids iron absorption) [MEDIUM]
  - Protein: 46g [MEDIUM]

Reasoning: Blood loss → need iron/B12 for hemoglobin.
Zinc supports immune system (may be low after period).
```

**Follicular (Days 1-13)**
```
Primary Focus: Energy, hormone production, bone health
Key Nutrients:
  - Vitamin D: 15mcg [CRITICAL]
  - Vitamin B6: 1.3mg [HIGH]
  - Magnesium: 310mg [HIGH]
  - Folate: 400mcg [MEDIUM]
  - Protein: 46g [MEDIUM]

Reasoning: Rising estrogen → need Vitamin D for absorption.
B6 supports mood. Magnesium for muscle function.
```

**Ovulation (Days 12-16)**
```
Primary Focus: Antioxidants, fertility, energy peak
Key Nutrients:
  - Vitamin E (Alpha-tocopherol): 15mg [CRITICAL]
  - Zinc: 8mg [CRITICAL]
  - Selenium: 55mcg [HIGH]
  - Vitamin C: 75mg [HIGH]
  - Protein: 46g [MEDIUM]

Reasoning: Peak energy & fertility. High antioxidant needs.
Zinc supports fertility. Selenium protects cells.
```

**Luteal (Days 15-28)**
```
Primary Focus: Mood, cravings, PMS support, metabolism
Key Nutrients:
  - Magnesium: 310mg [CRITICAL]
  - Calcium: 1000mg [CRITICAL]
  - Vitamin B6: 1.3mg [HIGH]
  - Serotonin precursors (carbs, tryptophan) [HIGH]
  - Iron: 18mg [MEDIUM]

Reasoning: Progesterone rises → metabolism ↑, calorie needs ↑.
Magnesium/Calcium prevent PMS symptoms.
B6 supports mood. Carbs boost serotonin.
```

### 3.2 Weighting System

**Priority Levels**:
- CRITICAL (weight: 1.0): Must-have nutrient for phase
- HIGH (weight: 0.75): Important nutrient for phase
- MEDIUM (weight: 0.5): Beneficial nutrient for phase

**Scoring Logic**:
```
For each nutrient in phase_priorities:
  normalized_amount = recipe_per_portion_amount / recommended_daily_value
  contribution = normalized_amount * priority_weight
  total_score += contribution

// Normalize to 0-100 scale
final_score = min(total_score / max_possible, 1.0) * 100
```

---

## 4. Recommendation Scoring Algorithm

### 4.1 Score Calculation

```typescript
interface PhaseNutrientTarget {
  name: string;
  daily_value: number;
  unit: string;
  weight: number; // 1.0 (CRITICAL), 0.75 (HIGH), 0.5 (MEDIUM)
}

interface RecipeScore {
  recipe_id: number;
  phase: string;
  score: number;  // 0-100
  matched_nutrients: string[]; // top 3
  reason: string; // "High in Magnesium and Calcium"
}

function calculateRecipeScore(
  recipe: Recipe,
  phase: CyclePhase,
  phaseTargets: PhaseNutrientTarget[]
): RecipeScore {
  
  let total_weighted_contribution = 0;
  let matched_nutrients = [];
  let nutrient_contributions = [];
  
  for (const target of phaseTargets) {
    const recipe_amount = recipe.per_portion[target.name];
    
    if (!recipe_amount) continue; // nutrient not in database
    
    // Normalize: how much of daily target does this recipe provide?
    const normalized = recipe_amount / target.daily_value;
    
    // Cap at 1.0 (100% of daily value is enough)
    const capped = min(normalized, 1.0);
    
    // Apply phase priority weight
    const contribution = capped * target.weight;
    
    total_weighted_contribution += contribution;
    nutrient_contributions.push({
      nutrient: target.name,
      contribution: contribution
    });
  }
  
  // Top 3 nutrients (by contribution)
  matched_nutrients = nutrient_contributions
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map(n => n.nutrient);
  
  // Normalize to 0-100 scale
  // Max possible = sum of all weights
  const max_possible = phaseTargets.reduce((sum, t) => sum + t.weight, 0);
  const score = (total_weighted_contribution / max_possible) * 100;
  
  // Generate reason text
  const reason = generateReasonText(matched_nutrients, phase);
  
  return {
    recipe_id: recipe.id,
    phase: phase.name,
    score: round(score, 1),
    matched_nutrients: matched_nutrients,
    reason: reason
  };
}
```

### 4.2 Example Calculation

**Recipe: Grüne Smoothie-Schüssel (1 Portion)**
- Calcium: 250mg
- Magnesium: 80mg
- Vitamin E: 8mg
- Vitamin B6: 0.5mg
- Zinc: 2mg

**Phase: Luteal (Magnesium + Calcium critical)**

```
Magnesium: 80 / 310 * 1.0 (CRITICAL) = 0.258
Calcium: 250 / 1000 * 1.0 (CRITICAL) = 0.250
Vitamin B6: 0.5 / 1.3 * 0.75 (HIGH) = 0.289
Zinc: 2 / 8 * 0.5 (MEDIUM) = 0.125

Total = 0.922
Max possible = 1.0 + 1.0 + 0.75 + 0.5 = 3.25
Score = (0.922 / 3.25) * 100 = 28.4/100

Matched nutrients: [Magnesium, Calcium, Vitamin B6]
Reason: "Good source of Magnesium, Calcium, and Vitamin B6"
```

### 4.3 Score Interpretation

- **80-100**: Excellent for phase (top nutrient match)
- **60-79**: Very good for phase (strong match)
- **50-59**: Good for phase (acceptable match)
- **40-49**: Decent for phase (some match)
- **< 40**: Not ideal for phase (poor match)

**Default threshold**: Show recipes with score >= 50

---

## 5. Database Schema

### 5.1 Phase Nutrient Targets Table

```sql
CREATE TABLE phase_nutrient_targets (
  id INTEGER PRIMARY KEY,
  phase_name VARCHAR(50) NOT NULL,
  nutrient_name VARCHAR(100) NOT NULL,
  daily_value_amount DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  priority VARCHAR(20) NOT NULL,  -- CRITICAL, HIGH, MEDIUM
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(phase_name, nutrient_name)
);
```

**Seed data** (for all 4 phases × nutrients):
```
Menstruation:
  - Iron, 18, mg, CRITICAL
  - Vitamin B12, 2.4, mcg, HIGH
  - Zinc, 8, mg, HIGH
  - Vitamin C, 75, mg, MEDIUM
  - Protein, 46, g, MEDIUM

Follicular:
  - Vitamin D, 15, mcg, CRITICAL
  - Vitamin B6, 1.3, mg, HIGH
  - Magnesium, 310, mg, HIGH
  - Folate, 400, mcg, MEDIUM
  - Protein, 46, g, MEDIUM

Ovulation:
  - Vitamin E, 15, mg, CRITICAL
  - Zinc, 8, mg, CRITICAL
  - Selenium, 55, mcg, HIGH
  - Vitamin C, 75, mg, HIGH
  - Protein, 46, g, MEDIUM

Luteal:
  - Magnesium, 310, mg, CRITICAL
  - Calcium, 1000, mg, CRITICAL
  - Vitamin B6, 1.3, mg, HIGH
  - Iron, 18, mg, MEDIUM
  - (Note: "Carbs for serotonin" is macro, not micro - use carbohydrates total)
```

### 5.2 Recipe Phase Scores Table (Cached)

```sql
CREATE TABLE recipe_phase_scores (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL FOREIGN KEY,
  phase_name VARCHAR(50) NOT NULL,
  score DECIMAL(5,2),
  matched_nutrients VARCHAR(500),  -- JSON: ["Magnesium", "Calcium"]
  reason TEXT,
  
  last_calculated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(recipe_id, phase_name)
);
```

**Purpose**: Cache scores for faster filtering. Recalculate when:
- Recipe nutrients change
- Phase targets change
- Manual refresh triggered

---

## 6. API Specification

### 6.1 GET /api/recipes/filtered?phase=menstruation

**Purpose**: Get recipes filtered + scored for a phase

**Query Parameters**:
- `phase`: phase name (menstruation, follicular, ovulation, luteal)
- `min_score`: minimum score (default: 50)
- `sort_by`: score, name, kcal (default: score descending)
- `limit`: max results (default: 20)

**Response**:
```json
{
  "data": [
    {
      "recipe_id": 5,
      "name": "Rote Bete Salat mit Feta",
      "score": 87,
      "phase": "Menstruation",
      "matched_nutrients": ["Iron", "Vitamin B12", "Zinc"],
      "reason": "Excellent source of iron and B12 for blood replenishment",
      "per_portion": {
        "kcal": 320,
        "iron": 6.2,
        ...
      }
    },
    {
      "recipe_id": 12,
      "name": "Spinat Smoothie",
      "score": 72,
      "phase": "Menstruation",
      "matched_nutrients": ["Iron", "Magnesium", "Zinc"],
      "reason": "Good source of iron and minerals"
    }
  ],
  "total_count": 42,
  "average_score": 65.3
}
```

### 6.2 GET /api/recipes/:id/phase-scores

**Purpose**: Get scores for a recipe across all phases

**Response**:
```json
{
  "data": {
    "recipe_id": 5,
    "scores": [
      {
        "phase": "Menstruation",
        "score": 87,
        "matched_nutrients": ["Iron", "Vitamin B12", "Zinc"],
        "reason": "Excellent source of iron and B12"
      },
      {
        "phase": "Follicular",
        "score": 45,
        "matched_nutrients": ["Vitamin D", "Magnesium"],
        "reason": "Some vitamin D"
      },
      {
        "phase": "Ovulation",
        "score": 62,
        "matched_nutrients": ["Vitamin E", "Zinc"],
        "reason": "Good source of antioxidants"
      },
      {
        "phase": "Luteal",
        "score": 91,
        "matched_nutrients": ["Magnesium", "Calcium", "Iron"],
        "reason": "Perfect for luteal phase - high in magnesium and calcium"
      }
    ]
  }
}
```

### 6.3 GET /api/recipes/recommended?phase=current

**Purpose**: Get recommendations for user's current phase

**Query Parameters**:
- `phase`: "current" (default, uses user's cycle), or phase name

**Response**: Same as 6.1 (filtered by user's phase)

### 6.4 GET /api/cycles/nutrient-targets

**Purpose**: Get all nutrient targets by phase (for UI display)

**Response**:
```json
{
  "data": {
    "menstruation": [
      {
        "nutrient": "Iron",
        "daily_value": 18,
        "unit": "mg",
        "priority": "CRITICAL"
      },
      ...
    ],
    "follicular": [...],
    "ovulation": [...],
    "luteal": [...]
  }
}
```

---

## 7. Implementation Details

### 7.1 File Structure

```
src/
├── lib/
│   └── cycle-recommendations/
│       ├── scorer.ts           # Score calculation logic
│       ├── targets.ts          # Nutrient targets per phase
│       ├── types.ts            # Recommendation types
│       └── constants.ts        # Phase nutrient mappings
├── api/
│   └── recipes/
│       ├── filtered/
│       │   └── route.ts        # GET /api/recipes/filtered
│       ├── recommended/
│       │   └── route.ts        # GET /api/recipes/recommended
│       └── [id]/
│           └── phase-scores/
│               └── route.ts    # GET /api/recipes/:id/phase-scores
│       └── cycles/
│           └── nutrient-targets/
│               └── route.ts    # GET /api/cycles/nutrient-targets
├── components/
│   └── recipe/
│       ├── RecipeCard.tsx      # Shows recipe + score + reason
│       ├── PhaseFilter.tsx     # Filter UI
│       ├── ScoreIndicator.tsx  # Visual score (0-100 bar)
│       ├── PhaseLabel.tsx      # "Perfect for Ovulation"
│       └── NutrientBreakdown.tsx # Detailed nutrients
├── __tests__/
│   ├── unit/
│   │   └── cycle-recommendations/
│   │       ├── scorer.test.ts
│   │       └── targets.test.ts
│   └── integration/
│       └── cycle-recommendations/
│           └── filtering-api.test.ts
└── db/
    └── seeds/
        └── phase-nutrient-targets.ts
```

### 7.2 Core Functions

**`src/lib/cycle-recommendations/scorer.ts`**:
```typescript
interface RecipeWithScore {
  recipe_id: number;
  score: number;
  matched_nutrients: string[];
  reason: string;
}

function calculateRecipeScore(
  recipe: Recipe,
  phase: string,
  targets: PhaseNutrientTarget[]
): RecipeWithScore

function calculateAllPhaseScores(
  recipe: Recipe,
  allTargets: Map<string, PhaseNutrientTarget[]>
): Map<string, RecipeWithScore>

function generateReasonText(
  nutrients: string[],
  phase: string
): string

function scoreRecipes(
  recipes: Recipe[],
  phase: string
): RecipeWithScore[]
```

### 7.3 Type Definitions

```typescript
interface PhaseNutrientTarget {
  nutrient_name: string;
  daily_value: number;
  unit: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  weight: number; // 1.0, 0.75, 0.5
}

interface RecipePhaseScore {
  recipe_id: number;
  phase_name: string;
  score: number; // 0-100
  matched_nutrients: string[];
  reason: string;
  last_calculated: Date;
}

interface FilterOptions {
  phase: string;
  min_score: number;
  sort_by: "score" | "name" | "kcal";
  limit: number;
}
```

---

## 8. User Interface Components

### 8.1 PhaseFilter.tsx

- Phase selector (buttons or dropdown):
  - "My Current Phase" (shows current)
  - "Menstruation"
  - "Follicular"
  - "Ovulation"
  - "Luteal"
- Min score slider (0-100, default 50)
- Sort dropdown (score, name, kcal)
- Apply filter button

### 8.2 RecipeCard.tsx (Enhanced)

Display per recipe:
- Recipe name + photo
- **Score badge** (circular, 0-100 with color):
  - Green (80+): Excellent
  - Yellow (60-79): Very good
  - Orange (40-59): Good
  - Gray (< 40): Not ideal
- **Phase label**: "Perfect for Ovulation Phase"
- **Matched nutrients**: "High in Vitamin E, Zinc, Selenium"
- **Reason**: "Peak fertility phase - excellent antioxidant support"
- Click for details

### 8.3 ScoreIndicator.tsx

- Circular progress indicator (0-100%)
- Color gradient based on score
- Optional: Text "87/100"

### 8.4 PhaseLabel.tsx

- Badge with phase name + icon/color
- Example: 🔴 "Menstruation" or 💚 "Ovulation"

### 8.5 NutrientBreakdown.tsx (Detail View)

- Recipe name + nutrients per portion
- For each nutrient:
  - Nutrient name
  - Amount per portion
  - Daily value bar (shows % of daily target)
  - Highlight if matched for phase (color)
- Summary: "3 of 5 critical phase nutrients covered"

---

## 9. Testing Strategy

### 9.1 Unit Tests

**File**: `src/__tests__/unit/cycle-recommendations/scorer.test.ts`

Test cases:
- Score calculation accuracy (known recipe × phase)
- Normalized to 0-100 scale
- Different nutrients for different phases
- Priority weights (CRITICAL vs MEDIUM)
- Top 3 nutrients ranking
- Edge cases (missing nutrients, zero amounts)
- Multiple recipes comparison (consistency)

**File**: `src/__tests__/unit/cycle-recommendations/targets.test.ts`

Test cases:
- All 4 phases have targets
- All critical nutrients present
- Weight values correct (1.0, 0.75, 0.5)
- No duplicate nutrients per phase

### 9.2 Integration Tests

**File**: `src/__tests__/integration/cycle-recommendations/filtering-api.test.ts`

Test cases:
- GET /api/recipes/filtered?phase=menstruation works
- Recipes sorted by score (descending)
- Min score filter works (only >= threshold)
- All phases work (menstruation, follicular, ovulation, luteal)
- GET /api/recipes/recommended uses current user phase
- GET /api/recipes/:id/phase-scores returns all 4 phases
- Scores consistent across calls
- Empty result handling (no recipes match phase)

### 9.3 Coverage Target

- `scorer.ts`: 100%
- `targets.ts`: 95%+
- API routes: 85%+
- Overall: 80%+

---

## 10. Performance Optimization

### 10.1 Score Caching

**Strategy**:
- Pre-calculate scores for all recipes × phases
- Store in `recipe_phase_scores` table
- Recalculate only when:
  - Recipe nutrients update
  - Nutrient targets change
  - Manual refresh

**Benefit**: Filtering is O(n) instead of O(n*m)

### 10.2 Filtering Query

```sql
SELECT r.id, r.name, rps.score, rps.matched_nutrients, rps.reason
FROM recipes r
JOIN recipe_phase_scores rps ON r.id = rps.recipe_id
WHERE rps.phase_name = ? AND rps.score >= ?
ORDER BY rps.score DESC
LIMIT ?
```

**Time complexity**: < 200ms for 1000 recipes

---

## 11. Transparency & Explainability

**Design Principle**: Users should understand WHY a recipe is recommended.

**Implementation**:
- Always show top 3 matched nutrients
- Show reason in plain language (not algorithm jargon)
- Show nutrient breakdown on detail view
- Show daily value targets (so user can see the math)
- Allow users to see phase targets (GET /api/cycles/nutrient-targets)

**Example Explanations**:
- Menstruation: "Excellent source of iron and B12 for blood replenishment"
- Follicular: "Good source of vitamin D and B vitamins for energy"
- Ovulation: "Perfect for peak fertility - high in antioxidants"
- Luteal: "Perfect for luteal phase - supports mood and metabolism"

---

## 12. Future Enhancements (Not in Scope)

- Machine learning to predict nutrient needs
- Custom nutrient targets per user
- Integration with other nutrition trackers
- Mobile push notifications (recipe of the day)
- Recipe categories (breakfasts, snacks, etc.)
- Difficulty level filtering
- Time-to-cook filtering
- User-generated recommendations/reviews

---

## 13. Constraints & Assumptions

**Constraints**:
- Phase-nutrient mapping is static (not customizable)
- Targets are based on US RDA for women 19-50yo
- Scores are recipe-based (not user-specific calorie goals)

**Assumptions**:
- All nutrients from Sub-Project 1 are available
- Cycle data is from Sub-Project 3
- Recipes have calculated nutrients before scoring
- Users are women 19-50 yo (MVP scope)

---

## 14. Dependencies & Integration

**Depends On**:
- Sub-Project 1: Nutrient data + calculation
- Sub-Project 3: User cycle info
- Recipe database (from MVP)
- User authentication (from MVP)

**Integrates With**:
- Recipe discovery/browsing
- Meal planning (future)
- Shopping lists (future)

---

## 15. Definition of Done

✅ All items must be complete:

- [ ] Phase nutrient targets table created + seeded
- [ ] Recipe phase scores table created
- [ ] Score calculation logic implemented (scorer.ts)
- [ ] All API endpoints implemented (filtering, recommended, scores)
- [ ] Score caching strategy implemented
- [ ] PhaseFilter component built
- [ ] RecipeCard enhanced with score + reason
- [ ] ScoreIndicator component built
- [ ] PhaseLabel component built
- [ ] NutrientBreakdown component built
- [ ] Reason text generation working
- [ ] Unit tests (scorer, targets) with 100% coverage
- [ ] Integration tests (API) with 85%+ coverage
- [ ] All scores within 0-100 range
- [ ] Sorting by score working
- [ ] Min score filtering working
- [ ] No console errors
- [ ] Linting passes
- [ ] Tests pass with 80%+ coverage
- [ ] Code reviewed and approved

---

## 16. Acceptance Criteria

When complete, users should be able to:
1. ✅ See recipes filtered/sorted by their current cycle phase
2. ✅ See recommendation scores (0-100) per recipe
3. ✅ Understand WHY a recipe is recommended (matched nutrients + reason)
4. ✅ Switch to different phase view (see all phase recommendations)
5. ✅ Adjust min score filter (threshold)
6. ✅ Click recipe to see detailed nutrient breakdown
7. ✅ All scores calculated consistently and transparently

---

**Document Status**: Ready for user review
**Next Step**: User approval → Creating comprehensive implementation plan for all 4 sub-projects
