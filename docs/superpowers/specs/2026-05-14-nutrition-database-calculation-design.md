# Design Spec: Nährstoff-Datenbank & Berechnung
**Date**: 2026-05-14  
**Status**: Draft  
**Sub-Project**: Phase 2 - Nutrition Features (Sub-Project 1 of 4)

---

## 1. Overview

**Goal**: Build a local nutrition database and calculation engine that automatically computes recipe nutrients based on ingredients.

**Scope**: 
- Local ingredient database (~300 common ingredients)
- 14 nutrient values per ingredient (kcal, sugar, fat, protein, carbs, fiber, sodium, calcium, vitamin D, magnesium, B6, B12, E, zinc)
- Unit conversions (g, ml, pieces, tablespoons, etc.)
- Automatic nutrient calculation for recipes (total + per portion)
- Adjustable portion sizes

**Not in Scope**:
- External nutrition APIs (Phase 2)
- Cycle-based filtering (Phase 3)
- Photo OCR (Phase 2)
- Nutrient recommendations (Phase 3)

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1: Ingredient Database**
- Store ~300 common ingredients in local database
- Each ingredient has 14 nutrient values (per 100g base)
- Each ingredient has conversion rules to other units (pieces, tablespoons, cups, ml, etc.)

**FR2: Nutrient Calculation**
- When user adds ingredients to a recipe with amounts, system auto-calculates total nutrients
- Display nutrients per full recipe AND per portion
- Recalculate automatically when:
  - Ingredients added/changed
  - Amounts changed
  - Portion size changed

**FR3: Recipe Ingredient Management**
- Users can add ingredients to recipes with:
  - Ingredient selection (from database)
  - Amount input (number)
  - Unit selection (from ingredient's available conversions)
- System stores original amount + auto-converts to base unit

**FR4: API Access**
- Endpoints for frontend to:
  - Fetch ingredient list
  - Fetch unit conversions for ingredient
  - Trigger nutrient calculation for recipe
  - Retrieve calculated nutrients

### 2.2 Non-Functional Requirements

**NFR1: Performance**
- Nutrient calculation < 100ms for typical recipe (10-15 ingredients)
- Ingredient database loaded in < 50ms

**NFR2: Data Consistency**
- Calculated nutrients always accurate (verified by tests)
- Portion size changes don't lose data

**NFR3: Code Quality**
- 80%+ test coverage
- Unit + integration tests for calculation logic
- Clear separation: calculation logic vs. API vs. data access

---

## 3. Database Schema

### 3.1 Ingredients Table (Enhanced)

```sql
CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  base_unit VARCHAR(50),        -- "g" for most, "ml" for liquids
  base_size INTEGER,            -- typically 100
  
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
```

### 3.2 Ingredient Conversions Table (New)

```sql
CREATE TABLE ingredient_conversions (
  id INTEGER PRIMARY KEY,
  ingredient_id INTEGER NOT NULL FOREIGN KEY,
  unit VARCHAR(50) NOT NULL,          -- "Stück", "EL", "Tasse", etc.
  amount_in_base_unit DECIMAL(10,3),  -- e.g., 1 Stück Apfel = 182g
  
  UNIQUE(ingredient_id, unit)
);
```

### 3.3 Recipe Ingredients Table (Enhanced)

```sql
CREATE TABLE recipe_ingredients (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL FOREIGN KEY,
  ingredient_id INTEGER NOT NULL FOREIGN KEY,
  amount DECIMAL(10,3) NOT NULL,           -- e.g., 2
  unit VARCHAR(50) NOT NULL,               -- e.g., "Stück"
  calculated_base_amount DECIMAL(10,3),    -- e.g., 364 (in base_unit)
  
  UNIQUE(recipe_id, ingredient_id)
);
```

### 3.4 Recipe Nutrients Table (New)

```sql
CREATE TABLE recipe_nutrients (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL FOREIGN KEY UNIQUE,
  portions INTEGER NOT NULL DEFAULT 1,
  
  -- Total nutrients for entire recipe
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
  
  -- Per-portion nutrients
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
```

---

## 4. Data Flow

### 4.1 Adding an Ingredient to a Recipe

```
User Input: "2 Stück Apfel"
    ↓
1. Frontend calls: GET /api/ingredients?name=Apfel
   ↓ Gets ingredient_id, base_unit="g"
   
2. Frontend calls: GET /api/ingredients/{id}/conversions
   ↓ Gets: 1 Stück = 182g
   
3. Frontend calls: POST /api/recipes/{recipe_id}/ingredients
   Body: { ingredient_id, amount: 2, unit: "Stück" }
   ↓
4. Backend logic:
   - calculated_base_amount = 2 * 182 = 364g
   - Store in recipe_ingredients: (recipe_id, ingredient_id, amount=2, unit="Stück", calculated_base_amount=364)
   
5. Trigger: POST /api/recipes/{recipe_id}/calculate-nutrients
   ↓
6. Recalculation (see Section 4.2)
```

### 4.2 Nutrient Calculation Process

**Triggered by**:
- Adding ingredient to recipe
- Changing ingredient amount
- Changing portion size

**Algorithm**:

```
For each nutrient type (kcal, sugar, fat, ...):
  total_nutrient = 0
  
  For each ingredient in recipe:
    base_amount = recipe_ingredient.calculated_base_amount
    ingredient_nutrient_value = ingredient[nutrient_type]
    
    contribution = (base_amount / 100) * ingredient_nutrient_value
    total_nutrient += contribution
  
  recipe_nutrients.total_[nutrient] = total_nutrient
  recipe_nutrients.per_portion_[nutrient] = total_nutrient / recipe.portions

Store recipe_nutrients with timestamp
```

**Example Calculation**:
- Recipe: Smoothie (2 portions)
- Ingredients:
  - 2 Äpfel (364g) → kcal per 100g = 52 → contribution = (364/100)*52 = 189.3 kcal
  - 200ml Joghurt → kcal per 100ml = 61 → contribution = (200/100)*61 = 122 kcal
- Total: 189.3 + 122 = 311.3 kcal
- Per portion: 311.3 / 2 = 155.65 kcal

### 4.3 Changing Portion Size

```
User changes: "4 portions" → "6 portions"
    ↓
Update recipe_nutrients.portions = 6
    ↓
Recalculate per_portion values:
  per_portion_[nutrient] = total_[nutrient] / portions
    ↓
total_[nutrient] stays the same (ingredient amounts didn't change)
```

---

## 5. API Specification

### 5.1 GET /api/ingredients

**Purpose**: Fetch all ingredients with nutrient data

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Apfel",
      "category": "Obst",
      "base_unit": "g",
      "base_size": 100,
      "kcal": 52,
      "sugar": 10.4,
      "fat": 0.3,
      "protein": 0.3,
      "carbohydrates": 13.8,
      "fiber": 2.4,
      "sodium": 2,
      "calcium": 5,
      "vitamin_d": 0,
      "magnesium": 5,
      "vitamin_b6": 0.04,
      "vitamin_b12": 0,
      "vitamin_e": 0.18,
      "zinc": 0.04
    },
    ...
  ]
}
```

### 5.2 GET /api/ingredients/:id/conversions

**Purpose**: Fetch available unit conversions for an ingredient

**Response**:
```json
{
  "data": [
    { "unit": "g", "amount_in_base_unit": 100 },
    { "unit": "Stück", "amount_in_base_unit": 182 },
    { "unit": "kg", "amount_in_base_unit": 1000 }
  ]
}
```

### 5.3 POST /api/recipes/:id/calculate-nutrients

**Purpose**: Recalculate and store recipe nutrients

**Request Body**: (empty or optional portion count)
```json
{
  "portions": 4
}
```

**Response**:
```json
{
  "data": {
    "recipe_id": 1,
    "portions": 4,
    "total_kcal": 1244,
    "total_protein": 45.2,
    "per_portion_kcal": 311,
    "per_portion_protein": 11.3,
    ...
    "last_calculated": "2026-05-14T10:30:00Z"
  }
}
```

### 5.4 GET /api/recipes/:id/nutrients

**Purpose**: Fetch calculated nutrients for a recipe

**Response**: Same as 5.3

---

## 6. Implementation Details

### 6.1 File Structure

```
src/
├── lib/
│   └── nutrition/
│       ├── calculator.ts       # Core calculation logic
│       ├── conversions.ts      # Unit conversion utilities
│       ├── types.ts            # Nutrition-related types
│       └── constants.ts        # Nutrient names, units, defaults
├── api/
│   └── nutrition/
│       ├── ingredients/
│       │   └── route.ts        # GET /api/ingredients
│       ├── recipes/
│       │   ├── [id]/
│       │   │   └── route.ts    # GET/PUT /api/recipes/:id/nutrients
│       │   └── [id]/
│       │       └── calculate/
│       │           └── route.ts # POST /api/recipes/:id/calculate-nutrients
├── __tests__/
│   ├── unit/
│   │   └── nutrition/
│   │       ├── calculator.test.ts
│   │       └── conversions.test.ts
│   └── integration/
│       └── nutrition/
│           ├── ingredients-api.test.ts
│           └── nutrients-api.test.ts
└── db/
    └── seeds/
        └── ingredients.ts      # ~300 ingredients seed data
```

### 6.2 Core Functions

**`src/lib/nutrition/calculator.ts`**:
```typescript
// Main calculation function
calculateRecipeNutrients(
  recipeIngredients: RecipeIngredient[],
  portions: number
): RecipeNutrients

// Helper: convert amount + unit to base unit
convertToBaseAmount(
  amount: number,
  unit: string,
  ingredient: Ingredient
): number

// Helper: calculate per-portion values
calculatePerPortion(
  totalNutrients: Nutrients,
  portions: number
): Nutrients
```

### 6.3 Type Definitions

```typescript
interface Ingredient {
  id: number;
  name: string;
  category: string;
  base_unit: string;
  base_size: number;
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

interface IngredientConversion {
  unit: string;
  amount_in_base_unit: number;
}

interface RecipeIngredient {
  ingredient_id: number;
  amount: number;
  unit: string;
}

interface Nutrients {
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

interface RecipeNutrients {
  recipe_id: number;
  portions: number;
  total: Nutrients;
  per_portion: Nutrients;
  last_calculated: Date;
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**File**: `src/__tests__/unit/nutrition/calculator.test.ts`

Test cases:
- `calculateRecipeNutrients` with single ingredient
- `calculateRecipeNutrients` with multiple ingredients
- Different unit conversions (g, ml, pieces)
- Portion size changes
- Edge cases (0 portions, negative amounts, missing ingredients)
- Decimal precision (2 decimal places)

**File**: `src/__tests__/unit/nutrition/conversions.test.ts`

Test cases:
- Conversion from piece to g
- Conversion from ml to g (with density consideration)
- Invalid unit handling
- Missing conversion data

### 7.2 Integration Tests

**File**: `src/__tests__/integration/nutrition/ingredients-api.test.ts`

Test cases:
- GET /api/ingredients returns all ingredients
- GET /api/ingredients/:id/conversions returns correct conversions
- Database seed data loads correctly
- No duplicate ingredients

**File**: `src/__tests__/integration/nutrition/nutrients-api.test.ts`

Test cases:
- POST /api/recipes/:id/calculate-nutrients calculates correctly
- GET /api/recipes/:id/nutrients retrieves stored nutrients
- Changing portions updates per_portion values only
- Adding/removing ingredients triggers recalculation
- Calculation accuracy matches expected values

### 7.3 Coverage Target

- `calculator.ts`: 100%
- `conversions.ts`: 95%+
- API routes: 80%+
- Overall: 80%+

---

## 8. Seed Data: Ingredient Database

**Source**: Standard nutrition values (USDA/public data)

**~300 Common Ingredients** organized by category:

- **Obst** (Fruit): Apfel, Banane, Orange, Erdbeere, Blaubeere, ...
- **Gemüse** (Vegetables): Brokkoli, Karotte, Spinat, Tomate, Zwiebel, ...
- **Fleisch** (Meat): Hähnchen, Rind, Schwein, Fisch, Lachs, ...
- **Milchprodukte** (Dairy): Milch, Joghurt, Käse, Butter, ...
- **Getreide** (Grains): Reis, Weizen, Hafer, Mais, ...
- **Nüsse/Samen** (Nuts): Mandeln, Walnüsse, Sonnenblumenkerne, ...
- **Öle** (Oils): Olivenöl, Kokosöl, Sesamöl, ...
- **Gewürze** (Spices): Salz, Pfeffer, Zimt, Kurkuma, ...

**Implementation**:
- `src/db/seeds/ingredients.ts`: Static JSON/TS array
- Migration: Insert into `ingredients` table on first run
- Idempotent: Only insert if not already present

---

## 9. Constraints & Assumptions

**Constraints**:
- Nutrient values are averages (not personalized by user)
- Conversions are standard amounts (not customizable per user)
- All nutrients calculated in standard units (g, mg, mcg)

**Assumptions**:
- 100g is the standard base unit for nutrients
- Ingredient database is static (not user-editable in MVP)
- Portion size is always a whole number (1, 2, 3, ...)
- Recipe calculation happens server-side (not client-side)

---

## 10. Future Considerations (Not in Scope)

- User-editable ingredient database
- Custom conversions per user
- Nutrient rounding/formatting options
- Recipe scaling (multiply all portions by X)
- Nutritional targets/goals per user
- Integration with external nutrition APIs (Phase 2)
- Cycle-based nutrient filtering (Phase 3)

---

## 11. Definition of Done

✅ All items must be complete:

- [ ] Database migration created (new tables)
- [ ] Seed data (~300 ingredients) inserted
- [ ] `src/lib/nutrition/calculator.ts` implemented
- [ ] `src/lib/nutrition/conversions.ts` implemented
- [ ] API routes implemented (GET ingredients, POST calculate-nutrients)
- [ ] Unit tests written (calculator, conversions) with 100% coverage
- [ ] Integration tests written (API endpoints) with 80%+ coverage
- [ ] Type definitions complete
- [ ] No console errors or warnings
- [ ] Code passes linting (`npm run lint`)
- [ ] Tests pass (`npm run test:coverage` shows 80%+)
- [ ] API documentation written (README or JSDoc)
- [ ] Code reviewed and approved (clean code checklist)

---

## 12. Acceptance Criteria

When complete, users should be able to:
1. ✅ Create a recipe and add ingredients with amounts
2. ✅ See automatically calculated total nutrients
3. ✅ See per-portion nutrient breakdown
4. ✅ Change portion size and see nutrients update
5. ✅ All calculations are accurate within 2 decimal places
6. ✅ API responds in < 100ms for typical recipes

---

## 13. Related Documents

- **Arc42 Architecture**: `docs/architecture/arc42.md`
- **MVP Requirements**: `docs/requirements/mvp/`
- **Project Roadmap**: `docs/roadmap/kanban.md`
- **CLAUDE.md**: Project setup & conventions

---

**Document Status**: Ready for user review
**Next Step**: User approval → Writing implementation plan
