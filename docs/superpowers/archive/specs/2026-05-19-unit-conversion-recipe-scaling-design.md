# Unit Conversion & Recipe Scaling System – Design Document

**Date:** 2026-05-19  
**Status:** Approved  
**Version:** 1.0

---

## Executive Summary

Implement a comprehensive unit conversion and recipe scaling system that allows users to work with multiple measurement units (ml, l, TL, EL, g, kg, Stück, Prise) and automatically scale recipes based on serving sizes. The system uses ingredient-specific density data to enable conversions between volume and weight measurements.

---

## Problem Statement

Currently, the recipe manager stores ingredient quantities and units but lacks:
- Conversion between different measurement units (e.g., TL ↔ EL ↔ ml)
- Conversion between volume and weight (e.g., ml ↔ g) using ingredient-specific densities
- Automatic recipe scaling when users adjust serving sizes
- Standardization for consistent unit handling across the application

This makes it difficult for users to adapt recipes to their needs or understand ingredient quantities in different measurement systems.

---

## Design Overview

### Architecture

The system consists of three layers:

1. **Data Layer:** Unit definitions, conversion factors, and ingredient densities stored in database
2. **Logic Layer:** `UnitConverter` service for conversions and `RecipeScaler` service for recipe scaling
3. **API Layer:** New endpoints for recipe scaling and ingredient management with validation

---

## Database Schema

### New Tables

#### `units`
Central reference table for all supported measurement units.

```sql
CREATE TABLE units (
  id INTEGER PRIMARY KEY,
  abbreviation TEXT NOT NULL UNIQUE,    -- TL, EL, ml, g, kg, l, etc.
  name TEXT NOT NULL,                   -- Teelöffel, Esslöffel, etc.
  category TEXT NOT NULL,               -- volume, weight, count, pinch
  base_unit TEXT NOT NULL               -- ml, g, count, pinch
);
```

**Seed Data Example:**
```
(1, 'TL', 'Teelöffel', 'volume', 'ml')
(2, 'EL', 'Esslöffel', 'volume', 'ml')
(3, 'ml', 'Milliliter', 'volume', 'ml')
(4, 'l', 'Liter', 'volume', 'ml')
(5, 'g', 'Gramm', 'weight', 'g')
(6, 'kg', 'Kilogramm', 'weight', 'g')
(7, 'Stück', 'Piece', 'count', 'count')
(8, 'Prise', 'Pinch', 'pinch', 'pinch')
```

#### `unit_conversions`
Conversion factors between units.

```sql
CREATE TABLE unit_conversions (
  id INTEGER PRIMARY KEY,
  from_unit_id INTEGER NOT NULL,  -- FK to units.id
  to_unit_id INTEGER NOT NULL,    -- FK to units.id
  conversion_factor REAL NOT NULL, -- multiply from_quantity by this to get to_quantity
  FOREIGN KEY (from_unit_id) REFERENCES units(id),
  FOREIGN KEY (to_unit_id) REFERENCES units(id),
  UNIQUE(from_unit_id, to_unit_id)
);
```

**Seed Data Example:**
```
(1, TL, EL, 0.333)        -- 1 TL = 1/3 EL
(2, EL, TL, 3.0)          -- 1 EL = 3 TL
(3, TL, ml, 5.0)          -- 1 TL = 5 ml
(4, EL, ml, 15.0)         -- 1 EL = 15 ml
(5, ml, l, 0.001)         -- 1 ml = 0.001 l
(6, g, kg, 0.001)         -- 1 g = 0.001 kg
```

#### `ingredient_densities`
Volume-to-weight conversion data for specific ingredients.

```sql
CREATE TABLE ingredient_densities (
  id INTEGER PRIMARY KEY,
  ingredient_name TEXT NOT NULL,  -- Mehl, Zucker, Butter, etc.
  volume_unit_id INTEGER NOT NULL, -- TL, EL, ml, l
  weight_in_grams REAL NOT NULL,   -- grams per volume_unit (e.g., 1 TL Mehl = 5g)
  FOREIGN KEY (volume_unit_id) REFERENCES units(id),
  UNIQUE(ingredient_name, volume_unit_id)
);
```

**Seed Data Example:**
```
(1, 'Mehl', ml, 0.5)         -- 1 ml Mehl = 0.5g
(2, 'Zucker', ml, 0.8)       -- 1 ml Zucker = 0.8g
(3, 'Butter', ml, 0.9)       -- 1 ml Butter = 0.9g
(4, 'Mehl', TL, 5.0)         -- 1 TL Mehl = 5g
(5, 'Zucker', TL, 8.0)       -- 1 TL Zucker = 8g
```

### Modified Table

#### `ingredients` (Extended)

```typescript
interface Ingredient {
  id: number;
  recipe_id: number;
  name: string;
  quantity: number;           // Original input quantity
  unit: string | null;        // Original unit (TL, EL, g, etc.)
  normalized_quantity?: number; // Stored in base unit (ml or g)
  normalized_unit?: string;   // Base unit (ml or g)
}
```

**Rationale for `normalized_*` fields:**
- Enable efficient database queries ("find recipes with <100g sugar")
- Support filtering operations without runtime conversion
- Preserve original display values for UX

---

## Service Layer

### UnitConverter Service

**Location:** `src/lib/units/converter.ts`

#### Core Methods

```typescript
class UnitConverter {
  // Convert quantity from one unit to another
  convert(
    quantity: number,
    fromUnit: string,
    toUnit: string,
    ingredientName?: string
  ): number
  // Throws: UnknownUnitError, ImpossibleConversionError, MissingDensityError

  // Normalize any unit to its base unit (ml for volume, g for weight)
  normalizeToBaseUnit(
    quantity: number,
    unit: string,
    ingredientName?: string
  ): { quantity: number; unit: string }
  // Throws: UnknownUnitError, ImpossibleConversionError

  // Get conversion factor between two units
  getConversionFactor(fromUnit: string, toUnit: string): number
  // Throws: UnknownUnitError, ImpossibleConversionError
}
```

#### Conversion Logic

**Same Category (volume-to-volume, weight-to-weight):**
1. Look up conversion factor from `unit_conversions` table
2. Multiply quantity by conversion factor
3. Return result

**Different Categories (volume-to-weight, weight-to-volume):**
1. Verify ingredient exists in `ingredient_densities`
2. Convert volume to weight using density data
3. Return result
4. If ingredient not found: throw `MissingDensityError`

**Error Handling:**
- `UnknownUnitError`: Unit not found in `units` table
- `ImpossibleConversionError`: No conversion path exists (e.g., Stück → ml)
- `MissingDensityError`: Volume-weight conversion attempted without density data

### RecipeScaler Service

**Location:** `src/lib/units/scaler.ts`

#### Core Methods

```typescript
class RecipeScaler {
  // Scale all ingredients in a recipe by serving size ratio
  scaleRecipe(
    recipe: RecipeWithIngredients,
    newServings: number
  ): RecipeWithIngredients
  // Throws: OutOfRangeError, conversion errors from UnitConverter

  // Scale a single ingredient
  scaleIngredient(
    ingredient: Ingredient,
    scaleFactor: number
  ): Ingredient
  // Returns ingredient with scaled quantity and optimized unit

  // Promote units to more practical scales (3 TL → 1 EL)
  promoteUnit(quantity: number, unit: string): { quantity: number; unit: string }
}
```

#### Scaling Logic

1. Calculate scale factor: `newServings / originalServings`
2. For each ingredient:
   - Multiply quantity by scale factor
   - Apply unit promotion if appropriate
   - Round to practical precision (e.g., 0.5 increments)
3. Return updated recipe with scaled ingredients

**Unit Promotion Rules:**
- 3+ TL → Convert to EL (3 TL ≈ 1 EL)
- 16+ EL → Convert to cups (if using volume)
- Very small quantities → Keep original unit but round

**Rounding Rules:**
- Weight: Round to nearest 5g for large quantities (>50g), 1g for small
- Volume: Round to nearest 0.5 ml for small quantities, 5 ml for large
- Quantities <1: Show as decimals (0.5, 0.25, etc.)

---

## API Endpoints

### Scale Recipe

**Endpoint:** `POST /api/recipes/{id}/scale`

**Request:**
```json
{
  "newServings": number
}
```

**Response:** `RecipeWithIngredients` with all ingredients scaled

**Validation:**
- `newServings` must be > 0 and < 100
- Recipe must exist and user must have permission

**Error Responses:**
```
400 Bad Request: Invalid newServings value
404 Not Found: Recipe not found
403 Forbidden: User doesn't have permission
500 Internal Server Error: Conversion error
```

### Create/Update Ingredient

**Endpoint:** `POST /api/recipes/{id}/ingredients`  
**Method:** PUT `/api/recipes/{id}/ingredients/{ingredientId}`

**Request:**
```json
{
  "name": "string",
  "quantity": number,
  "unit": "string"  // TL, EL, ml, g, etc.
}
```

**Processing:**
1. Validate unit exists in `units` table
2. Validate quantity > 0
3. Normalize to base unit using `UnitConverter`
4. Store both original and normalized values
5. Return created/updated ingredient

**Error Responses:**
```
400 Bad Request: Invalid unit or quantity
404 Not Found: Recipe or ingredient not found
403 Forbidden: User permission denied
```

---

## Error Handling

### Error Types

```typescript
class UnknownUnitError extends Error {
  constructor(public unit: string) {
    super(`Unknown unit: ${unit}. Supported units: TL, EL, ml, l, g, kg, Stück, Prise`);
  }
}

class ImpossibleConversionError extends Error {
  constructor(public fromUnit: string, public toUnit: string, public ingredient?: string) {
    super(
      `Cannot convert from ${fromUnit} to ${toUnit}` +
      (ingredient ? ` for ingredient "${ingredient}" (no density data)` : '')
    );
  }
}

class MissingDensityError extends Error {
  constructor(public ingredient: string) {
    super(`Density data missing for "${ingredient}". Please specify weight or add to database.`);
  }
}

class OutOfRangeError extends Error {
  constructor(public value: number, public min: number, public max: number) {
    super(`Value ${value} is outside valid range [${min}, ${max}]`);
  }
}
```

### Validation Rules

**Ingredient Input:**
- Unit must exist in `units` table
- Quantity must be > 0
- Quantity must be ≤ 999,999 (practical limit)

**Recipe Scaling:**
- `newServings` must be > 0
- `newServings` must be ≤ 100 (warn on >50)
- Original recipe must have `servings` field > 0

**Unit Conversion:**
- Cannot convert between incompatible categories (e.g., Stück → ml)
- Volume-weight conversion requires ingredient density

---

## Testing Strategy

### Unit Tests (`src/__tests__/lib/units/`)

#### `converter.test.ts`
- Volume ↔ Volume conversions (TL, EL, ml, l)
- Weight ↔ Weight conversions (g, kg)
- Volume → Weight conversions (with ingredient densities)
- Weight → Volume conversions (with ingredient densities)
- Error cases (unknown units, impossible conversions, missing densities)
- Edge cases (very small quantities, very large quantities)

#### `scaler.test.ts`
- Recipe scaling with correct factor application
- Unit promotion logic (3 TL → 1 EL)
- Rounding behavior
- Handling of non-scalable units (Stück, Prise)
- Error propagation from converter

### Integration Tests (`tests/api/`)

- `POST /recipes/{id}/scale` scales all ingredients correctly
- Scaled quantities stored in DB with normalized values
- `POST /recipes/{id}/ingredients` validates and normalizes units
- Ingredient densities loaded correctly from DB
- Permission checks enforced

### E2E Tests (`tests/e2e/`)

- User creates recipe with mixed units (TL, EL, g)
- User adjusts servings → all quantities scale appropriately
- User converts ingredient unit via UI
- User views recipe and sees optimized units (3 TL → 1 EL)

### Coverage Target

Minimum 85% coverage for converter and scaler logic; 70% for API layers.

---

## Data Migration

### For Existing Recipes

1. Backfill `normalized_quantity` and `normalized_unit` for all ingredients
2. Use current `unit` field to populate normalized fields
3. Handle unknown units gracefully (log warnings, manual review required)

### Rollout Strategy

- Feature flag: `enableUnitConversion` (disabled by default)
- Seed `units`, `unit_conversions`, and `ingredient_densities` with common values
- Allow admin/user to extend densities via admin panel (future phase)

---

## Future Considerations

### Phase 2 (After MVP)
- User-customizable density overrides per recipe
- Photo-based ingredient weight estimation (OCR integration)
- Nutritional information scaled with recipe
- Import conversions from USDA FoodData Central

### Phase 3+
- Recipe import from external sources with automatic unit standardization
- Meal planning with ingredient aggregation across recipes
- Shopping list generation with consolidated units

---

## Acceptance Criteria

- [x] Database schema implemented with `units`, `unit_conversions`, `ingredient_densities`
- [x] `UnitConverter` service handles same-category and cross-category conversions
- [x] `RecipeScaler` service scales recipes with unit promotion
- [x] `POST /recipes/{id}/scale` endpoint works with validation
- [x] `POST /recipes/{id}/ingredients` validates and normalizes units
- [x] All error types defined and thrown appropriately
- [x] Unit tests for converter (85%+ coverage)
- [x] Unit tests for scaler (85%+ coverage)
- [x] Integration tests for API endpoints
- [x] E2E tests for scaling workflow
- [x] Backward compatibility maintained for existing ingredients
- [x] Documentation updated in README
