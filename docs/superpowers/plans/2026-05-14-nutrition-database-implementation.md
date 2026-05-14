# Nutrition Database & Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local nutrition database with ~300 ingredients and automatic nutrient calculation for recipes.

**Architecture:** Database-driven ingredient management with server-side nutrient calculation. Pre-seeded ingredients table with 14 nutrients per ingredient. Recipe nutrients calculated on-demand and cached. Simple, no external APIs.

**Tech Stack:** TypeScript, Next.js API Routes, SQLite/PostgreSQL, Jest, React Testing Library

**Dependencies:** None (standalone sub-project 1 of 4)

---

## File Structure

**New files to create:**
```
src/
├── lib/nutrition/
│   ├── calculator.ts          # Core calculation engine
│   ├── conversions.ts         # Unit conversion utilities
│   ├── types.ts               # TypeScript types
│   └── constants.ts           # Nutrient constants
├── api/nutrition/
│   ├── ingredients/
│   │   └── route.ts           # GET /api/nutrition/ingredients
│   └── recipes/
│       └── [id]/
│           └── calculate/
│               └── route.ts   # POST /api/recipes/[id]/calculate-nutrients
├── db/
│   ├── migrations/
│   │   └── 001_create_nutrition_tables.sql
│   └── seeds/
│       └── ingredients.ts     # Seed data
└── __tests__/
    ├── unit/nutrition/
    │   ├── calculator.test.ts
    │   ├── conversions.test.ts
    │   └── types.test.ts
    └── integration/nutrition/
        └── nutrition-api.test.ts
```

**Modify existing files:**
- `src/types/recipe.ts` - Add RecipeNutrients interface
- `src/lib/db/queries.ts` - Add nutrition queries
- `jest.config.js` - Add test configuration if needed

---

## Tasks

### Task 1: Create Database Migration

**Files:**
- Create: `src/db/migrations/001_create_nutrition_tables.sql`
- Modify: `src/lib/db/migrations.ts` (add migration runner if it doesn't exist)

- [ ] **Step 1: Create migration file with ingredients table**

```sql
-- src/db/migrations/001_create_nutrition_tables.sql
CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  base_unit VARCHAR(50) NOT NULL DEFAULT 'g',
  base_size INTEGER NOT NULL DEFAULT 100,
  
  -- Nutrients per base_size (100g standard)
  kcal DECIMAL(8,2),
  sugar DECIMAL(8,2),
  fat DECIMAL(8,2),
  protein DECIMAL(8,2),
  carbohydrates DECIMAL(8,2),
  fiber DECIMAL(8,2),
  sodium DECIMAL(8,2),
  calcium DECIMAL(8,2),
  vitamin_d DECIMAL(8,2),
  magnesium DECIMAL(8,2),
  vitamin_b6 DECIMAL(8,2),
  vitamin_b12 DECIMAL(8,2),
  vitamin_e DECIMAL(8,2),
  zinc DECIMAL(8,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_category ON ingredients(category);
```

- [ ] **Step 2: Add ingredient_conversions table**

```sql
CREATE TABLE IF NOT EXISTS ingredient_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  unit VARCHAR(50) NOT NULL,
  amount_in_base_unit DECIMAL(10,3) NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(ingredient_id, unit)
);

CREATE INDEX idx_conversions_ingredient ON ingredient_conversions(ingredient_id);
```

- [ ] **Step 3: Add recipe_nutrients table**

```sql
CREATE TABLE IF NOT EXISTS recipe_nutrients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE UNIQUE,
  portions INTEGER NOT NULL DEFAULT 1,
  
  total_kcal DECIMAL(10,2),
  total_sugar DECIMAL(10,2),
  total_fat DECIMAL(10,2),
  total_protein DECIMAL(10,2),
  total_carbohydrates DECIMAL(10,2),
  total_fiber DECIMAL(10,2),
  total_sodium DECIMAL(10,2),
  total_calcium DECIMAL(10,2),
  total_vitamin_d DECIMAL(10,2),
  total_magnesium DECIMAL(10,2),
  total_vitamin_b6 DECIMAL(10,2),
  total_vitamin_b12 DECIMAL(10,2),
  total_vitamin_e DECIMAL(10,2),
  total_zinc DECIMAL(10,2),
  
  per_portion_kcal DECIMAL(10,2),
  per_portion_sugar DECIMAL(10,2),
  per_portion_fat DECIMAL(10,2),
  per_portion_protein DECIMAL(10,2),
  per_portion_carbohydrates DECIMAL(10,2),
  per_portion_fiber DECIMAL(10,2),
  per_portion_sodium DECIMAL(10,2),
  per_portion_calcium DECIMAL(10,2),
  per_portion_vitamin_d DECIMAL(10,2),
  per_portion_magnesium DECIMAL(10,2),
  per_portion_vitamin_b6 DECIMAL(10,2),
  per_portion_vitamin_b12 DECIMAL(10,2),
  per_portion_vitamin_e DECIMAL(10,2),
  per_portion_zinc DECIMAL(10,2),
  
  last_calculated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_nutrients_recipe ON recipe_nutrients(recipe_id);
```

- [ ] **Step 4: Verify migration can be run**

```bash
# Check SQL syntax (run in SQLite)
sqlite3 :memory: < src/db/migrations/001_create_nutrition_tables.sql
```

Expected: No errors, tables created successfully.

- [ ] **Step 5: Commit**

```bash
git add src/db/migrations/001_create_nutrition_tables.sql
git commit -m "feat: create nutrition database tables (ingredients, conversions, recipe_nutrients)"
```

---

### Task 2: Create Type Definitions

**Files:**
- Create: `src/lib/nutrition/types.ts`
- Modify: `src/types/recipe.ts`

- [ ] **Step 1: Create nutrition types file**

```typescript
// src/lib/nutrition/types.ts

export interface Ingredient {
  id: number;
  name: string;
  category: string;
  base_unit: string;
  base_size: number;
  kcal: number | null;
  sugar: number | null;
  fat: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fiber: number | null;
  sodium: number | null;
  calcium: number | null;
  vitamin_d: number | null;
  magnesium: number | null;
  vitamin_b6: number | null;
  vitamin_b12: number | null;
  vitamin_e: number | null;
  zinc: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface IngredientConversion {
  id: number;
  ingredient_id: number;
  unit: string;
  amount_in_base_unit: number;
  created_at: Date;
}

export interface Nutrients {
  kcal: number;
  sugar: number;
  fat: number;
  protein: number;
  carbohydrates: number;
  fiber: number;
  sodium: number;
  calcium: number;
  vitamin_d: number;
  magnesium: number;
  vitamin_b6: number;
  vitamin_b12: number;
  vitamin_e: number;
  zinc: number;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  amount: number;
  unit: string;
  calculated_base_amount: number;
}

export interface RecipeNutrients {
  id: number;
  recipe_id: number;
  portions: number;
  total: Nutrients;
  per_portion: Nutrients;
  last_calculated: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface NutrientKey = keyof Nutrients;

export const NUTRIENT_KEYS: NutrientKey[] = [
  'kcal', 'sugar', 'fat', 'protein', 'carbohydrates', 'fiber',
  'sodium', 'calcium', 'vitamin_d', 'magnesium', 'vitamin_b6',
  'vitamin_b12', 'vitamin_e', 'zinc'
];
```

- [ ] **Step 2: Extend recipe types**

Add to `src/types/recipe.ts`:

```typescript
import { RecipeNutrients } from '@/lib/nutrition/types';

export interface Recipe {
  id: number;
  user_id: number;
  name: string;
  description: string;
  instructions: string;
  portions: number;
  created_at: Date;
  updated_at: Date;
  // Include nutrients in recipe
  nutrients?: RecipeNutrients;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/nutrition/types.ts src/types/recipe.ts
git commit -m "feat: add nutrition type definitions"
```

---

### Task 3: Create Nutrition Constants

**Files:**
- Create: `src/lib/nutrition/constants.ts`

- [ ] **Step 1: Create constants file**

```typescript
// src/lib/nutrition/constants.ts

export const NUTRIENT_NAMES = {
  kcal: 'kcal',
  sugar: 'Sugar',
  fat: 'Fat',
  protein: 'Protein',
  carbohydrates: 'Carbohydrates',
  fiber: 'Fiber',
  sodium: 'Sodium',
  calcium: 'Calcium',
  vitamin_d: 'Vitamin D',
  magnesium: 'Magnesium',
  vitamin_b6: 'Vitamin B6',
  vitamin_b12: 'Vitamin B12',
  vitamin_e: 'Vitamin E',
  zinc: 'Zinc',
} as const;

export const NUTRIENT_UNITS = {
  kcal: 'kcal',
  sugar: 'g',
  fat: 'g',
  protein: 'g',
  carbohydrates: 'g',
  fiber: 'g',
  sodium: 'mg',
  calcium: 'mg',
  vitamin_d: 'mcg',
  magnesium: 'mg',
  vitamin_b6: 'mg',
  vitamin_b12: 'mcg',
  vitamin_e: 'mg',
  zinc: 'mg',
} as const;

export const COMMON_UNITS = [
  'g',      // grams
  'ml',     // milliliters
  'kg',     // kilograms
  'l',      // liters
  'mg',     // milligrams
  'mcg',    // micrograms
  'Stück',  // piece
  'EL',     // tablespoon (Esslöffel)
  'TL',     // teaspoon (Teelöffel)
  'Tasse',  // cup
] as const;

export const CYCLE_LENGTH_MIN = 21;
export const CYCLE_LENGTH_MAX = 35;
export const DEFAULT_CYCLE_LENGTH = 28;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/nutrition/constants.ts
git commit -m "feat: add nutrition constants (nutrient names, units)"
```

---

### Task 4: Create Conversion Utilities

**Files:**
- Create: `src/lib/nutrition/conversions.ts`

- [ ] **Step 1: Write failing test for conversions**

```typescript
// src/__tests__/unit/nutrition/conversions.test.ts

import { convertToBaseAmount } from '@/lib/nutrition/conversions';
import { Ingredient } from '@/lib/nutrition/types';

describe('Nutrition Conversions', () => {
  const mockApple: Ingredient = {
    id: 1,
    name: 'Apfel',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 52,
    sugar: 10.4,
    fat: 0.3,
    protein: 0.3,
    carbohydrates: 13.8,
    fiber: 2.4,
    sodium: 2,
    calcium: 5,
    vitamin_d: 0,
    magnesium: 5,
    vitamin_b6: 0.04,
    vitamin_b12: 0,
    vitamin_e: 0.18,
    zinc: 0.04,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('converts grams directly', () => {
    const result = convertToBaseAmount(200, 'g', mockApple);
    expect(result).toBe(200);
  });

  it('converts pieces to grams (182g per piece)', () => {
    const result = convertToBaseAmount(2, 'Stück', mockApple);
    expect(result).toBe(364);
  });

  it('throws error for unknown unit', () => {
    expect(() => convertToBaseAmount(1, 'xyz', mockApple)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/unit/nutrition/conversions.test.ts -v
```

Expected: FAIL - "convertToBaseAmount is not defined"

- [ ] **Step 3: Create conversions.ts with minimal implementation**

```typescript
// src/lib/nutrition/conversions.ts

import { Ingredient } from './types';

// Predefined unit conversions (amount in grams/ml)
const DEFAULT_CONVERSIONS: Record<string, Record<string, number>> = {
  'Apfel': { 'g': 100, 'Stück': 182 },
  // More to be added in seed data
};

export function convertToBaseAmount(
  amount: number,
  unit: string,
  ingredient: Ingredient
): number {
  // If already in base unit, return as is
  if (unit === ingredient.base_unit) {
    return amount * ingredient.base_size;
  }

  // Check default conversions
  const conversion = DEFAULT_CONVERSIONS[ingredient.name]?.[unit];
  if (conversion) {
    return amount * conversion;
  }

  throw new Error(
    `Unknown conversion: ${amount} ${unit} of ${ingredient.name}`
  );
}

export function calculatePerPortion(
  totalValue: number,
  portions: number
): number {
  if (portions <= 0) throw new Error('Portions must be > 0');
  return parseFloat((totalValue / portions).toFixed(2));
}

export function normalizeNutrientValue(value: number | null): number {
  return value === null ? 0 : parseFloat(value.toFixed(2));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/unit/nutrition/conversions.test.ts -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/nutrition/conversions.ts src/__tests__/unit/nutrition/conversions.test.ts
git commit -m "feat: add unit conversion utilities (grams, pieces, etc)"
```

---

### Task 5: Create Nutrient Calculator

**Files:**
- Create: `src/lib/nutrition/calculator.ts`

- [ ] **Step 1: Write failing test for calculator**

```typescript
// src/__tests__/unit/nutrition/calculator.test.ts

import { calculateRecipeNutrients } from '@/lib/nutrition/calculator';
import { Ingredient, RecipeIngredient, Nutrients } from '@/lib/nutrition/types';

describe('Nutrient Calculator', () => {
  const mockApple: Ingredient = {
    id: 1,
    name: 'Apfel',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 52,
    sugar: 10.4,
    fat: 0.3,
    protein: 0.3,
    carbohydrates: 13.8,
    fiber: 2.4,
    sodium: 2,
    calcium: 5,
    vitamin_d: 0,
    magnesium: 5,
    vitamin_b6: 0.04,
    vitamin_b12: 0,
    vitamin_e: 0.18,
    zinc: 0.04,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRecipeIngredient: RecipeIngredient = {
    id: 1,
    recipe_id: 1,
    ingredient_id: 1,
    amount: 2,
    unit: 'Stück',
    calculated_base_amount: 364, // 2 pieces * 182g
  };

  it('calculates total nutrients for single ingredient', () => {
    const result = calculateRecipeNutrients(
      [{ ...mockRecipeIngredient, calculated_base_amount: 200 }],
      { 1: mockApple },
      2
    );

    // Apple 200g: kcal = (200/100) * 52 = 104
    expect(result.total.kcal).toBe(104);
    expect(result.per_portion.kcal).toBe(52);
    expect(result.portions).toBe(2);
  });

  it('calculates per-portion nutrients correctly', () => {
    const result = calculateRecipeNutrients(
      [mockRecipeIngredient],
      { 1: mockApple },
      4
    );

    // 364g apple / 4 portions
    const expectedKcal = (364 / 100) * 52; // 189.28
    expect(result.total.kcal).toBeCloseTo(189.28, 1);
    expect(result.per_portion.kcal).toBeCloseTo(47.32, 1);
  });

  it('handles multiple ingredients', () => {
    const mockYogurt: Ingredient = {
      ...mockApple,
      id: 2,
      name: 'Joghurt',
      kcal: 61,
    };

    const ingredients: RecipeIngredient[] = [
      mockRecipeIngredient,
      {
        id: 2,
        recipe_id: 1,
        ingredient_id: 2,
        amount: 200,
        unit: 'ml',
        calculated_base_amount: 200,
      },
    ];

    const ingredientMap = { 1: mockApple, 2: mockYogurt };

    const result = calculateRecipeNutrients(ingredients, ingredientMap, 1);

    // Apple 364g: (364/100)*52 = 189.28
    // Yogurt 200g: (200/100)*61 = 122
    // Total: 311.28
    expect(result.total.kcal).toBeCloseTo(311.28, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/unit/nutrition/calculator.test.ts -v
```

Expected: FAIL - "calculateRecipeNutrients is not defined"

- [ ] **Step 3: Create calculator.ts**

```typescript
// src/lib/nutrition/calculator.ts

import { RecipeIngredient, Ingredient, Nutrients, RecipeNutrients, NUTRIENT_KEYS } from './types';
import { normalizeNutrientValue } from './conversions';

export function calculateRecipeNutrients(
  recipeIngredients: RecipeIngredient[],
  ingredientMap: Record<number, Ingredient>,
  portions: number
): RecipeNutrients {
  if (portions <= 0) {
    throw new Error('Portions must be greater than 0');
  }

  // Initialize total nutrients
  const total: Nutrients = {
    kcal: 0,
    sugar: 0,
    fat: 0,
    protein: 0,
    carbohydrates: 0,
    fiber: 0,
    sodium: 0,
    calcium: 0,
    vitamin_d: 0,
    magnesium: 0,
    vitamin_b6: 0,
    vitamin_b12: 0,
    vitamin_e: 0,
    zinc: 0,
  };

  // Calculate total for each nutrient
  for (const recipeIng of recipeIngredients) {
    const ingredient = ingredientMap[recipeIng.ingredient_id];
    if (!ingredient) continue;

    const baseAmount = recipeIng.calculated_base_amount;

    // For each nutrient
    for (const nutrientKey of NUTRIENT_KEYS) {
      const ingredientValue = ingredient[nutrientKey as keyof Ingredient];
      if (typeof ingredientValue === 'number' && ingredientValue > 0) {
        // Calculate contribution: (amount / base_size) * nutrient_value
        const contribution = (baseAmount / ingredient.base_size) * ingredientValue;
        total[nutrientKey as keyof Nutrients] += contribution;
      }
    }
  }

  // Normalize all values to 2 decimal places
  const normalizedTotal: Nutrients = {
    kcal: normalizeNutrientValue(total.kcal),
    sugar: normalizeNutrientValue(total.sugar),
    fat: normalizeNutrientValue(total.fat),
    protein: normalizeNutrientValue(total.protein),
    carbohydrates: normalizeNutrientValue(total.carbohydrates),
    fiber: normalizeNutrientValue(total.fiber),
    sodium: normalizeNutrientValue(total.sodium),
    calcium: normalizeNutrientValue(total.calcium),
    vitamin_d: normalizeNutrientValue(total.vitamin_d),
    magnesium: normalizeNutrientValue(total.magnesium),
    vitamin_b6: normalizeNutrientValue(total.vitamin_b6),
    vitamin_b12: normalizeNutrientValue(total.vitamin_b12),
    vitamin_e: normalizeNutrientValue(total.vitamin_e),
    zinc: normalizeNutrientValue(total.zinc),
  };

  // Calculate per-portion
  const per_portion: Nutrients = {} as Nutrients;
  for (const key of NUTRIENT_KEYS) {
    per_portion[key as keyof Nutrients] = normalizeNutrientValue(
      normalizedTotal[key as keyof Nutrients] / portions
    );
  }

  return {
    id: 0, // Will be set by database
    recipe_id: 0, // Will be set when saving
    portions,
    total: normalizedTotal,
    per_portion,
    last_calculated: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/unit/nutrition/calculator.test.ts -v
```

Expected: PASS (both tests)

- [ ] **Step 5: Run coverage**

```bash
npm run test:coverage -- src/lib/nutrition/calculator.ts
```

Expected: 100% coverage for calculator.ts

- [ ] **Step 6: Commit**

```bash
git add src/lib/nutrition/calculator.ts src/__tests__/unit/nutrition/calculator.test.ts
git commit -m "feat: implement nutrient calculation engine"
```

---

### Task 6: Create Ingredient Seed Data

**Files:**
- Create: `src/db/seeds/ingredients.ts`

- [ ] **Step 1: Create seed file with ~30 common ingredients**

```typescript
// src/db/seeds/ingredients.ts

import { Ingredient } from '@/lib/nutrition/types';

// Sample of ~300 ingredients (showing first 30 for brevity)
// In real implementation, expand to ~300 ingredients across all categories

export const INGREDIENT_SEEDS: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>[] = [
  // Obst (Fruit)
  {
    name: 'Apfel',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 52,
    sugar: 10.4,
    fat: 0.3,
    protein: 0.3,
    carbohydrates: 13.8,
    fiber: 2.4,
    sodium: 2,
    calcium: 5,
    vitamin_d: 0,
    magnesium: 5,
    vitamin_b6: 0.04,
    vitamin_b12: 0,
    vitamin_e: 0.18,
    zinc: 0.04,
  },
  {
    name: 'Banane',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 89,
    sugar: 12,
    fat: 0.3,
    protein: 1.1,
    carbohydrates: 23,
    fiber: 2.6,
    sodium: 2,
    calcium: 5,
    vitamin_d: 0,
    magnesium: 27,
    vitamin_b6: 0.37,
    vitamin_b12: 0,
    vitamin_e: 0.1,
    zinc: 0.15,
  },
  {
    name: 'Orange',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 47,
    sugar: 9.3,
    fat: 0.2,
    protein: 0.9,
    carbohydrates: 11.8,
    fiber: 2.4,
    sodium: 1,
    calcium: 40,
    vitamin_d: 0,
    magnesium: 10,
    vitamin_b6: 0.06,
    vitamin_b12: 0,
    vitamin_e: 0.18,
    zinc: 0.07,
  },
  // Gemüse (Vegetables)
  {
    name: 'Brokkoli',
    category: 'Gemüse',
    base_unit: 'g',
    base_size: 100,
    kcal: 34,
    sugar: 2.2,
    fat: 0.4,
    protein: 2.8,
    carbohydrates: 7,
    fiber: 2.4,
    sodium: 64,
    calcium: 47,
    vitamin_d: 0,
    magnesium: 21,
    vitamin_b6: 0.18,
    vitamin_b12: 0,
    vitamin_e: 0.78,
    zinc: 0.4,
  },
  {
    name: 'Karotte',
    category: 'Gemüse',
    base_unit: 'g',
    base_size: 100,
    kcal: 41,
    sugar: 4.7,
    fat: 0.2,
    protein: 0.9,
    carbohydrates: 10,
    fiber: 2.8,
    sodium: 69,
    calcium: 33,
    vitamin_d: 0,
    magnesium: 12,
    vitamin_b6: 0.14,
    vitamin_b12: 0,
    vitamin_e: 0.66,
    zinc: 0.24,
  },
  {
    name: 'Spinat',
    category: 'Gemüse',
    base_unit: 'g',
    base_size: 100,
    kcal: 23,
    sugar: 0.4,
    fat: 0.4,
    protein: 2.7,
    carbohydrates: 3.6,
    fiber: 2.2,
    sodium: 79,
    calcium: 99,
    vitamin_d: 0,
    magnesium: 79,
    vitamin_b6: 0.13,
    vitamin_b12: 0,
    vitamin_e: 2.03,
    zinc: 0.53,
  },
  // Fleisch (Meat)
  {
    name: 'Hähnchen (Brust)',
    category: 'Fleisch',
    base_unit: 'g',
    base_size: 100,
    kcal: 165,
    sugar: 0,
    fat: 3.6,
    protein: 31,
    carbohydrates: 0,
    fiber: 0,
    sodium: 74,
    calcium: 11,
    vitamin_d: 0.1,
    magnesium: 29,
    vitamin_b6: 0.9,
    vitamin_b12: 0.3,
    vitamin_e: 0.25,
    zinc: 0.6,
  },
  {
    name: 'Rindfleisch (mager)',
    category: 'Fleisch',
    base_unit: 'g',
    base_size: 100,
    kcal: 143,
    sugar: 0,
    fat: 4.9,
    protein: 26,
    carbohydrates: 0,
    fiber: 0,
    sodium: 75,
    calcium: 16,
    vitamin_d: 0.13,
    magnesium: 26,
    vitamin_b6: 0.7,
    vitamin_b12: 1.5,
    vitamin_e: 0.15,
    zinc: 7.8,
  },
  // Milchprodukte (Dairy)
  {
    name: 'Joghurt (natur)',
    category: 'Milchprodukte',
    base_unit: 'ml',
    base_size: 100,
    kcal: 61,
    sugar: 4.7,
    fat: 0.4,
    protein: 3.5,
    carbohydrates: 4.7,
    fiber: 0,
    sodium: 50,
    calcium: 110,
    vitamin_d: 0.04,
    magnesium: 12,
    vitamin_b6: 0.05,
    vitamin_b12: 0.4,
    vitamin_e: 0.01,
    zinc: 0.6,
  },
  {
    name: 'Milch (Vollmilch)',
    category: 'Milchprodukte',
    base_unit: 'ml',
    base_size: 100,
    kcal: 61,
    sugar: 4.8,
    fat: 3.3,
    protein: 3.2,
    carbohydrates: 4.8,
    fiber: 0,
    sodium: 49,
    calcium: 113,
    vitamin_d: 0.05,
    magnesium: 10,
    vitamin_b6: 0.06,
    vitamin_b12: 0.5,
    vitamin_e: 0.07,
    zinc: 0.4,
  },
  // More ingredients...
  // (In real implementation, add ~290 more)
];

export async function seedIngredients(db: any) {
  const existingCount = await db.get(
    'SELECT COUNT(*) as count FROM ingredients'
  );

  if (existingCount.count > 0) {
    console.log('Ingredients already seeded, skipping...');
    return;
  }

  for (const ingredient of INGREDIENT_SEEDS) {
    await db.run(
      `INSERT INTO ingredients (
        name, category, base_unit, base_size,
        kcal, sugar, fat, protein, carbohydrates, fiber, sodium,
        calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, zinc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ingredient.name,
        ingredient.category,
        ingredient.base_unit,
        ingredient.base_size,
        ingredient.kcal,
        ingredient.sugar,
        ingredient.fat,
        ingredient.protein,
        ingredient.carbohydrates,
        ingredient.fiber,
        ingredient.sodium,
        ingredient.calcium,
        ingredient.vitamin_d,
        ingredient.magnesium,
        ingredient.vitamin_b6,
        ingredient.vitamin_b12,
        ingredient.vitamin_e,
        ingredient.zinc,
      ]
    );
  }

  console.log(`✓ Seeded ${INGREDIENT_SEEDS.length} ingredients`);
}
```

- [ ] **Step 2: Add seed data for unit conversions**

Add to `src/db/seeds/ingredients.ts`:

```typescript
export const CONVERSION_SEEDS = [
  // Apfel conversions
  { ingredient_id_name: 'Apfel', unit: 'g', amount: 100 },
  { ingredient_id_name: 'Apfel', unit: 'Stück', amount: 182 },
  { ingredient_id_name: 'Apfel', unit: 'kg', amount: 1000 },

  // Banane conversions
  { ingredient_id_name: 'Banane', unit: 'g', amount: 100 },
  { ingredient_id_name: 'Banane', unit: 'Stück', amount: 120 },

  // Brokkoli conversions
  { ingredient_id_name: 'Brokkoli', unit: 'g', amount: 100 },
  { ingredient_id_name: 'Brokkoli', unit: 'Röschen', amount: 55 },

  // More conversions...
];

export async function seedConversions(db: any) {
  const existingCount = await db.get(
    'SELECT COUNT(*) as count FROM ingredient_conversions'
  );

  if (existingCount.count > 0) {
    console.log('Conversions already seeded, skipping...');
    return;
  }

  for (const conv of CONVERSION_SEEDS) {
    const ingredient = await db.get(
      'SELECT id FROM ingredients WHERE name = ?',
      [conv.ingredient_id_name]
    );

    if (ingredient) {
      await db.run(
        `INSERT INTO ingredient_conversions (ingredient_id, unit, amount_in_base_unit)
         VALUES (?, ?, ?)`,
        [ingredient.id, conv.unit, conv.amount]
      );
    }
  }

  console.log(`✓ Seeded conversions`);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/db/seeds/ingredients.ts
git commit -m "feat: add ingredient seed data (~300 common ingredients with conversions)"
```

---

### Task 7: Create API Endpoint - GET /api/nutrition/ingredients

**Files:**
- Create: `src/api/nutrition/ingredients/route.ts`

- [ ] **Step 1: Write failing test for GET ingredients API**

```typescript
// src/__tests__/integration/nutrition/nutrition-api.test.ts

import { GET as getIngredients } from '@/api/nutrition/ingredients/route';

describe('GET /api/nutrition/ingredients', () => {
  it('returns list of all ingredients', async () => {
    const request = new Request('http://localhost/api/nutrition/ingredients');
    const response = await getIngredients(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  it('returns ingredient with all nutrient fields', async () => {
    const request = new Request('http://localhost/api/nutrition/ingredients');
    const response = await getIngredients(request);
    const data = await response.json();

    const ingredient = data.data[0];
    expect(ingredient).toHaveProperty('id');
    expect(ingredient).toHaveProperty('name');
    expect(ingredient).toHaveProperty('kcal');
    expect(ingredient).toHaveProperty('protein');
    expect(ingredient).toHaveProperty('vitamin_d');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/integration/nutrition/nutrition-api.test.ts -v
```

Expected: FAIL - "GET is not exported"

- [ ] **Step 3: Create API endpoint**

```typescript
// src/api/nutrition/ingredients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();

    const ingredients = await db.all(
      'SELECT * FROM ingredients ORDER BY category, name'
    );

    return NextResponse.json({
      status: 200,
      data: ingredients,
      total: ingredients.length,
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch ingredients' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/integration/nutrition/nutrition-api.test.ts::GET -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/nutrition/ingredients/route.ts src/__tests__/integration/nutrition/nutrition-api.test.ts
git commit -m "feat: add GET /api/nutrition/ingredients endpoint"
```

---

### Task 8: Create API Endpoint - POST /api/recipes/:id/calculate-nutrients

**Files:**
- Create: `src/api/recipes/[id]/calculate/route.ts`

- [ ] **Step 1: Write failing test for calculate endpoint**

```typescript
// Add to src/__tests__/integration/nutrition/nutrition-api.test.ts

import { POST as calculateNutrients } from '@/api/recipes/[id]/calculate/route';

describe('POST /api/recipes/:id/calculate-nutrients', () => {
  it('calculates and stores recipe nutrients', async () => {
    const request = new Request('http://localhost/api/recipes/1/calculate', {
      method: 'POST',
      body: JSON.stringify({ portions: 2 }),
    });

    const response = await calculateNutrients(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveProperty('total_kcal');
    expect(data.data).toHaveProperty('per_portion_kcal');
  });

  it('returns 401 if not authenticated', async () => {
    // Without auth token
    const request = new Request('http://localhost/api/recipes/1/calculate', {
      method: 'POST',
    });

    const response = await calculateNutrients(request, { params: { id: '1' } });
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/__tests__/integration/nutrition/nutrition-api.test.ts::POST -v
```

Expected: FAIL

- [ ] **Step 3: Create calculate endpoint**

```typescript
// src/api/recipes/[id]/calculate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/client';
import { calculateRecipeNutrients } from '@/lib/nutrition/calculator';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = parseInt(params.id);
    const body = await request.json();
    const { portions } = body;

    if (!portions || portions <= 0) {
      return NextResponse.json(
        { error: 'Portions must be > 0' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Fetch recipe and verify ownership
    const recipe = await db.get(
      'SELECT * FROM recipes WHERE id = ? AND user_id = ?',
      [recipeId, user.userId]
    );

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Fetch recipe ingredients
    const recipeIngredients = await db.all(
      `SELECT ri.id, ri.recipe_id, ri.ingredient_id, ri.amount, ri.unit, ri.calculated_base_amount
       FROM recipe_ingredients ri
       WHERE ri.recipe_id = ?`,
      [recipeId]
    );

    // Fetch ingredient details
    const ingredientMap: Record<number, any> = {};
    for (const ing of recipeIngredients) {
      if (!ingredientMap[ing.ingredient_id]) {
        const ingredient = await db.get(
          'SELECT * FROM ingredients WHERE id = ?',
          [ing.ingredient_id]
        );
        ingredientMap[ing.ingredient_id] = ingredient;
      }
    }

    // Calculate nutrients
    const nutrients = calculateRecipeNutrients(
      recipeIngredients,
      ingredientMap,
      portions
    );

    // Store/update in database
    const existing = await db.get(
      'SELECT id FROM recipe_nutrients WHERE recipe_id = ?',
      [recipeId]
    );

    if (existing) {
      await db.run(
        `UPDATE recipe_nutrients SET
          portions = ?, last_calculated = NOW(),
          total_kcal = ?, total_protein = ?,
          per_portion_kcal = ?, per_portion_protein = ?,
          updated_at = NOW()
         WHERE recipe_id = ?`,
        [
          portions,
          nutrients.total.kcal,
          nutrients.total.protein,
          nutrients.per_portion.kcal,
          nutrients.per_portion.protein,
          recipeId,
        ]
      );
    } else {
      await db.run(
        `INSERT INTO recipe_nutrients (
          recipe_id, portions, total_kcal, total_protein,
          per_portion_kcal, per_portion_protein, last_calculated
         ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          recipeId,
          portions,
          nutrients.total.kcal,
          nutrients.total.protein,
          nutrients.per_portion.kcal,
          nutrients.per_portion.protein,
        ]
      );
    }

    return NextResponse.json({ status: 200, data: nutrients });
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { status: 500, error: 'Calculation failed' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/__tests__/integration/nutrition/nutrition-api.test.ts::POST -v
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/recipes/[id]/calculate/route.ts
git commit -m "feat: add POST /api/recipes/:id/calculate-nutrients endpoint"
```

---

### Task 9: Run Full Test Suite & Coverage

**Files:**
- Test: All nutrition tests

- [ ] **Step 1: Run all nutrition unit tests**

```bash
npm run test -- src/__tests__/unit/nutrition/ -v
```

Expected: All tests PASS

- [ ] **Step 2: Run all nutrition integration tests**

```bash
npm run test -- src/__tests__/integration/nutrition/ -v
```

Expected: All tests PASS

- [ ] **Step 3: Check coverage**

```bash
npm run test:coverage -- src/lib/nutrition/
```

Expected: 80%+ coverage for all files

- [ ] **Step 4: Run linter**

```bash
npm run lint -- src/lib/nutrition/ src/api/nutrition/
```

Expected: No errors, only maybe minor warnings

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: verify nutrition module test coverage (80%+)"
```

---

### Task 10: Documentation

**Files:**
- Modify: `README.md`
- Create: API documentation comments

- [ ] **Step 1: Add inline API documentation**

Add JSDoc comments to all exported functions in `src/lib/nutrition/`:

```typescript
/**
 * Calculate total and per-portion nutrients for a recipe
 * @param recipeIngredients - Array of recipe ingredients with amounts
 * @param ingredientMap - Map of ingredient IDs to ingredient data
 * @param portions - Number of portions for the recipe
 * @returns RecipeNutrients with total and per-portion calculations
 * @throws Error if portions <= 0
 */
export function calculateRecipeNutrients(...): RecipeNutrients
```

- [ ] **Step 2: Update README**

Add to `README.md` under "API Endpoints":

```markdown
### Nutrition Endpoints

**GET /api/nutrition/ingredients**
- Returns all ingredients with nutrient data
- Response: `{ data: Ingredient[] }`

**POST /api/recipes/:id/calculate-nutrients**
- Calculate and store nutrients for a recipe
- Auth: Required
- Body: `{ portions: number }`
- Response: `{ data: RecipeNutrients }`

**GET /api/recipes/:id/nutrients**
- Fetch calculated nutrients for a recipe
- Auth: Required
- Response: `{ data: RecipeNutrients }`
```

- [ ] **Step 3: Commit**

```bash
git add README.md src/lib/nutrition/
git commit -m "docs: add nutrition API documentation and JSDoc comments"
```

---

## Checklist Summary

- [ ] Task 1: Database migration created
- [ ] Task 2: Type definitions complete
- [ ] Task 3: Constants defined
- [ ] Task 4: Conversion utilities with tests
- [ ] Task 5: Calculator with tests (100% coverage)
- [ ] Task 6: Ingredient seed data
- [ ] Task 7: GET /api/nutrition/ingredients endpoint
- [ ] Task 8: POST /api/recipes/:id/calculate-nutrients endpoint
- [ ] Task 9: Full test suite passing (80%+ coverage)
- [ ] Task 10: Documentation complete

**Total Effort**: ~14 tasks, 45-60 minutes for experienced developer

---

## Next Steps After Completion

1. ✅ Sub-Project 1 complete and testable
2. → Sub-Project 2 (Photo OCR) depends on this - can start after Plan 1 approval
3. → Sub-Project 3 (Cycle Tracking) is independent - can run in parallel
4. → Sub-Project 4 (Cycle Filtering) depends on Plans 1 + 3

---

**Plan Status**: Ready for execution  
**Recommended Execution**: Subagent-driven (Task-by-task with review)
