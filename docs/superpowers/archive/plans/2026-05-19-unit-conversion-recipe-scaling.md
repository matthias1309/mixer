# Unit Conversion & Recipe Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unit conversion system that handles ml, l, TL, EL, g, kg, Stück, and Prise units with automatic recipe scaling based on servings.

**Architecture:** Three-tier design with database layer (units/conversions/densities), logic layer (UnitConverter/RecipeScaler services), and API layer (scale endpoint + enhanced ingredient validation). Volume-weight conversions use ingredient-specific density lookup.

**Tech Stack:** Next.js, SQLite/PostgreSQL, TypeScript, Jest, React Testing Library

---

## Phase 1: Database Schema & Seed Data

### Task 1: Create Database Migrations

**Files:**
- Create: `db/migrations/001_create_units.sql`
- Create: `db/migrations/002_create_unit_conversions.sql`
- Create: `db/migrations/003_create_ingredient_densities.sql`
- Create: `db/migrations/004_add_normalized_fields.sql`

- [ ] **Step 1: Write migration to create `units` table**

Create file `db/migrations/001_create_units.sql`:

```sql
CREATE TABLE units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  abbreviation TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('volume', 'weight', 'count', 'pinch')),
  base_unit TEXT NOT NULL
);

CREATE INDEX idx_units_abbreviation ON units(abbreviation);
CREATE INDEX idx_units_category ON units(category);
```

- [ ] **Step 2: Write migration to create `unit_conversions` table**

Create file `db/migrations/002_create_unit_conversions.sql`:

```sql
CREATE TABLE unit_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_unit_id INTEGER NOT NULL REFERENCES units(id),
  to_unit_id INTEGER NOT NULL REFERENCES units(id),
  conversion_factor REAL NOT NULL,
  UNIQUE(from_unit_id, to_unit_id)
);

CREATE INDEX idx_unit_conversions_from ON unit_conversions(from_unit_id);
CREATE INDEX idx_unit_conversions_to ON unit_conversions(to_unit_id);
```

- [ ] **Step 3: Write migration to create `ingredient_densities` table**

Create file `db/migrations/003_create_ingredient_densities.sql`:

```sql
CREATE TABLE ingredient_densities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_name TEXT NOT NULL,
  volume_unit_id INTEGER NOT NULL REFERENCES units(id),
  weight_in_grams REAL NOT NULL,
  UNIQUE(ingredient_name, volume_unit_id)
);

CREATE INDEX idx_ingredient_densities_name ON ingredient_densities(ingredient_name);
CREATE INDEX idx_ingredient_densities_unit ON ingredient_densities(volume_unit_id);
```

- [ ] **Step 4: Write migration to add normalized fields to `ingredients` table**

Create file `db/migrations/004_add_normalized_fields.sql`:

```sql
ALTER TABLE ingredients ADD COLUMN normalized_quantity REAL;
ALTER TABLE ingredients ADD COLUMN normalized_unit TEXT;

CREATE INDEX idx_ingredients_normalized ON ingredients(normalized_quantity, normalized_unit);
```

- [ ] **Step 5: Run migrations**

Run: 
```bash
npm run db:migrate
```

Expected: All four migrations execute successfully, no errors

- [ ] **Step 6: Commit**

```bash
git add db/migrations/
git commit -m "db: add units, conversions, and densities tables

Add three new tables for unit management:
- units: reference table for TL, EL, ml, g, kg, Stück, Prise
- unit_conversions: conversion factors between compatible units
- ingredient_densities: density data for volume-weight conversions

Extend ingredients table with normalized_quantity and normalized_unit
for efficient querying.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

### Task 2: Seed Unit Data

**Files:**
- Create: `db/seeds/units.sql`

- [ ] **Step 1: Create units seed file**

Create file `db/seeds/units.sql`:

```sql
-- Volume units
INSERT INTO units (abbreviation, name, category, base_unit) VALUES 
('TL', 'Teelöffel', 'volume', 'ml'),
('EL', 'Esslöffel', 'volume', 'ml'),
('ml', 'Milliliter', 'volume', 'ml'),
('l', 'Liter', 'volume', 'ml');

-- Weight units
INSERT INTO units (abbreviation, name, category, base_unit) VALUES 
('g', 'Gramm', 'weight', 'g'),
('kg', 'Kilogramm', 'weight', 'g');

-- Count/piece units
INSERT INTO units (abbreviation, name, category, base_unit) VALUES 
('Stück', 'Piece', 'count', 'count');

-- Pinch units
INSERT INTO units (abbreviation, name, category, base_unit) VALUES 
('Prise', 'Pinch', 'pinch', 'pinch');

-- Volume conversions
INSERT INTO unit_conversions (from_unit_id, to_unit_id, conversion_factor) VALUES 
(1, 2, 0.333),      -- 1 TL = 0.333 EL
(2, 1, 3.0),        -- 1 EL = 3 TL
(1, 3, 5.0),        -- 1 TL = 5 ml
(2, 3, 15.0),       -- 1 EL = 15 ml
(3, 1, 0.2),        -- 1 ml = 0.2 TL
(3, 2, 0.0667),     -- 1 ml = 0.0667 EL
(3, 4, 0.001),      -- 1 ml = 0.001 l
(4, 3, 1000.0);     -- 1 l = 1000 ml

-- Weight conversions
INSERT INTO unit_conversions (from_unit_id, to_unit_id, conversion_factor) VALUES 
(5, 6, 0.001),      -- 1 g = 0.001 kg
(6, 5, 1000.0);     -- 1 kg = 1000 g

-- Common ingredient densities (in grams per unit)
INSERT INTO ingredient_densities (ingredient_name, volume_unit_id, weight_in_grams) VALUES 
('Mehl', 1, 5.0),           -- 1 TL Mehl = 5g
('Mehl', 2, 15.0),          -- 1 EL Mehl = 15g
('Mehl', 3, 1.0),           -- 1 ml Mehl = 1g
('Zucker', 1, 8.0),         -- 1 TL Zucker = 8g
('Zucker', 2, 25.0),        -- 1 EL Zucker = 25g
('Zucker', 3, 0.8),         -- 1 ml Zucker = 0.8g
('Butter', 1, 5.0),         -- 1 TL Butter = 5g
('Butter', 2, 15.0),        -- 1 EL Butter = 15g
('Butter', 3, 0.9),         -- 1 ml Butter = 0.9g
('Honig', 1, 7.0),          -- 1 TL Honig = 7g
('Honig', 2, 20.0),         -- 1 EL Honig = 20g
('Honig', 3, 1.4),          -- 1 ml Honig = 1.4g
('Salz', 1, 6.0),           -- 1 TL Salz = 6g
('Salz', 2, 18.0),          -- 1 EL Salz = 18g
('Öl', 1, 5.0),             -- 1 TL Öl = 5g
('Öl', 2, 15.0);            -- 1 EL Öl = 15g
```

- [ ] **Step 2: Run seed**

Run:
```bash
sqlite3 .data/app.db < db/seeds/units.sql
```

Expected: All inserts complete successfully, no errors

- [ ] **Step 3: Verify seed data**

Run:
```bash
sqlite3 .data/app.db "SELECT COUNT(*) FROM units;"
```

Expected: Output `8` (8 units created)

- [ ] **Step 4: Commit**

```bash
git add db/seeds/units.sql
git commit -m "db: seed units, conversions, and ingredient densities

Add reference data for:
- 8 units (TL, EL, ml, l, g, kg, Stück, Prise)
- 8 conversion factor pairs
- 15 ingredient density mappings (Mehl, Zucker, Butter, etc.)

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Type Definitions & Error Classes

### Task 3: Create Unit Types and Error Classes

**Files:**
- Create: `src/lib/units/types.ts`

- [ ] **Step 1: Write error class definitions**

Create file `src/lib/units/types.ts`:

```typescript
// Error Types
export class UnknownUnitError extends Error {
  constructor(public unit: string) {
    super(
      `Unknown unit: "${unit}". Supported units: TL, EL, ml, l, g, kg, Stück, Prise`
    );
    this.name = 'UnknownUnitError';
  }
}

export class ImpossibleConversionError extends Error {
  constructor(
    public fromUnit: string,
    public toUnit: string,
    public ingredient?: string
  ) {
    const msg =
      `Cannot convert from "${fromUnit}" to "${toUnit}"` +
      (ingredient ? ` for ingredient "${ingredient}" (no density data)` : '');
    super(msg);
    this.name = 'ImpossibleConversionError';
  }
}

export class MissingDensityError extends Error {
  constructor(public ingredient: string) {
    super(
      `Density data missing for "${ingredient}". Please specify weight or add to database.`
    );
    this.name = 'MissingDensityError';
  }
}

export class OutOfRangeError extends Error {
  constructor(public value: number, public min: number, public max: number) {
    super(`Value ${value} is outside valid range [${min}, ${max}]`);
    this.name = 'OutOfRangeError';
  }
}

// Data Interfaces
export interface Unit {
  id: number;
  abbreviation: string;
  name: string;
  category: 'volume' | 'weight' | 'count' | 'pinch';
  base_unit: string;
}

export interface UnitConversion {
  id: number;
  from_unit_id: number;
  to_unit_id: number;
  conversion_factor: number;
}

export interface IngredientDensity {
  id: number;
  ingredient_name: string;
  volume_unit_id: number;
  weight_in_grams: number;
}

export interface ConversionResult {
  quantity: number;
  unit: string;
}

export interface ScaledIngredient {
  id: number;
  recipe_id: number;
  name: string;
  quantity: number;
  unit: string | null;
  normalized_quantity?: number;
  normalized_unit?: string;
}
```

- [ ] **Step 2: Run type check**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/units/types.ts
git commit -m "types: add unit conversion error and data types

Define error classes for conversion failures:
- UnknownUnitError: unit not in database
- ImpossibleConversionError: no conversion path exists
- MissingDensityError: volume-weight without density
- OutOfRangeError: invalid scaling range

Define interfaces for units, conversions, and densities.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

### Task 4: Create Unit Constants

**Files:**
- Create: `src/lib/units/constants.ts`

- [ ] **Step 1: Write constants file**

Create file `src/lib/units/constants.ts`:

```typescript
export const UNIT_CATEGORIES = {
  VOLUME: 'volume',
  WEIGHT: 'weight',
  COUNT: 'count',
  PINCH: 'pinch',
} as const;

export const BASE_UNITS = {
  VOLUME: 'ml',
  WEIGHT: 'g',
  COUNT: 'count',
  PINCH: 'pinch',
} as const;

export const SUPPORTED_UNITS = {
  TL: { abbreviation: 'TL', category: UNIT_CATEGORIES.VOLUME },
  EL: { abbreviation: 'EL', category: UNIT_CATEGORIES.VOLUME },
  ml: { abbreviation: 'ml', category: UNIT_CATEGORIES.VOLUME },
  l: { abbreviation: 'l', category: UNIT_CATEGORIES.VOLUME },
  g: { abbreviation: 'g', category: UNIT_CATEGORIES.WEIGHT },
  kg: { abbreviation: 'kg', category: UNIT_CATEGORIES.WEIGHT },
  Stück: { abbreviation: 'Stück', category: UNIT_CATEGORIES.COUNT },
  Prise: { abbreviation: 'Prise', category: UNIT_CATEGORIES.PINCH },
} as const;

// Unit promotion thresholds (when to convert to larger unit)
export const UNIT_PROMOTION_RULES = {
  TL: { threshold: 3, promoteToUnit: 'EL' },
  EL: { threshold: 16, promoteToUnit: 'ml' },
  ml: { threshold: 1000, promoteToUnit: 'l' },
} as const;

// Rounding precision rules
export const ROUNDING_RULES = {
  weight_large: { threshold: 50, precision: 5 },    // Round to nearest 5g for >50g
  weight_small: { threshold: 50, precision: 1 },    // Round to nearest 1g for <50g
  volume_large: { threshold: 100, precision: 5 },   // Round to nearest 5ml for >100ml
  volume_small: { threshold: 100, precision: 0.5 }, // Round to nearest 0.5ml for <100ml
} as const;

// Validation bounds
export const VALIDATION_BOUNDS = {
  MIN_QUANTITY: 0.001,
  MAX_QUANTITY: 999999,
  MAX_SERVINGS: 100,
  MIN_SERVINGS: 1,
} as const;
```

- [ ] **Step 2: Run type check**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/units/constants.ts
git commit -m "constants: add unit categories, promotion rules, rounding rules

Define supported units and their categories, promotion thresholds,
rounding precision for different quantity ranges, and validation bounds.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Unit Converter Service

### Task 5: Implement UnitConverter Service (Converter Logic)

**Files:**
- Create: `src/lib/units/converter.ts`

- [ ] **Step 1: Write failing test for same-category conversion**

Create file `src/__tests__/lib/units/converter.test.ts`:

```typescript
import { UnitConverter } from '@/lib/units/converter';
import {
  UnknownUnitError,
  ImpossibleConversionError,
  MissingDensityError,
} from '@/lib/units/types';

describe('UnitConverter', () => {
  let converter: UnitConverter;

  beforeAll(async () => {
    converter = new UnitConverter();
    await converter.initialize();
  });

  describe('convert - same category', () => {
    it('converts TL to EL', async () => {
      const result = await converter.convert(3, 'TL', 'EL');
      expect(result).toBeCloseTo(1, 1);
    });

    it('converts EL to TL', async () => {
      const result = await converter.convert(1, 'EL', 'TL');
      expect(result).toBeCloseTo(3, 1);
    });

    it('converts TL to ml', async () => {
      const result = await converter.convert(1, 'TL', 'ml');
      expect(result).toBeCloseTo(5, 1);
    });

    it('converts ml to l', async () => {
      const result = await converter.convert(1000, 'ml', 'l');
      expect(result).toBeCloseTo(1, 1);
    });

    it('converts g to kg', async () => {
      const result = await converter.convert(1000, 'g', 'kg');
      expect(result).toBeCloseTo(1, 1);
    });

    it('throws UnknownUnitError for unknown unit', async () => {
      await expect(converter.convert(1, 'unknown', 'ml')).rejects.toThrow(
        UnknownUnitError
      );
    });

    it('throws ImpossibleConversionError for incompatible units', async () => {
      await expect(converter.convert(1, 'TL', 'g')).rejects.toThrow(
        ImpossibleConversionError
      );
    });
  });

  describe('convert - cross-category with density', () => {
    it('converts TL Mehl to g', async () => {
      const result = await converter.convert(1, 'TL', 'g', 'Mehl');
      expect(result).toBeCloseTo(5, 1);
    });

    it('converts EL Zucker to g', async () => {
      const result = await converter.convert(1, 'EL', 'g', 'Zucker');
      expect(result).toBeCloseTo(25, 1);
    });

    it('throws MissingDensityError when density not found', async () => {
      await expect(
        converter.convert(1, 'TL', 'g', 'UnknownIngredient')
      ).rejects.toThrow(MissingDensityError);
    });
  });

  describe('normalizeToBaseUnit', () => {
    it('normalizes TL to ml', async () => {
      const result = await converter.normalizeToBaseUnit(1, 'TL');
      expect(result).toEqual({ quantity: 5, unit: 'ml' });
    });

    it('normalizes g to g', async () => {
      const result = await converter.normalizeToBaseUnit(500, 'g');
      expect(result).toEqual({ quantity: 500, unit: 'g' });
    });

    it('normalizes ml Mehl to g via density', async () => {
      const result = await converter.normalizeToBaseUnit(5, 'ml', 'Mehl');
      expect(result.unit).toBe('g');
      expect(result.quantity).toBeCloseTo(5, 1);
    });
  });

  describe('getConversionFactor', () => {
    it('returns correct factor for TL to ml', async () => {
      const factor = await converter.getConversionFactor('TL', 'ml');
      expect(factor).toBeCloseTo(5, 1);
    });

    it('throws for unknown unit', async () => {
      await expect(converter.getConversionFactor('unknown', 'ml')).rejects.toThrow(
        UnknownUnitError
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test -- src/__tests__/lib/units/converter.test.ts
```

Expected: FAIL - "UnitConverter is not defined"

- [ ] **Step 3: Write UnitConverter implementation**

Create file `src/lib/units/converter.ts`:

```typescript
import { db } from '@/lib/db';
import {
  Unit,
  UnitConversion,
  IngredientDensity,
  ConversionResult,
  UnknownUnitError,
  ImpossibleConversionError,
  MissingDensityError,
} from './types';
import { UNIT_CATEGORIES, BASE_UNITS } from './constants';

export class UnitConverter {
  private units: Map<string, Unit> = new Map();
  private conversions: Map<string, number> = new Map();
  private densities: Map<string, IngredientDensity[]> = new Map();

  async initialize(): Promise<void> {
    // Load units from database
    const unitRows = await db.all('SELECT * FROM units');
    unitRows.forEach((unit: Unit) => {
      this.units.set(unit.abbreviation, unit);
    });

    // Load conversions from database
    const conversionRows = await db.all(
      `SELECT u1.abbreviation as from_unit, u2.abbreviation as to_unit, uc.conversion_factor
       FROM unit_conversions uc
       JOIN units u1 ON uc.from_unit_id = u1.id
       JOIN units u2 ON uc.to_unit_id = u2.id`
    );
    conversionRows.forEach(
      (conv: { from_unit: string; to_unit: string; conversion_factor: number }) => {
        const key = `${conv.from_unit}->${conv.to_unit}`;
        this.conversions.set(key, conv.conversion_factor);
      }
    );

    // Load densities from database
    const densityRows = await db.all('SELECT * FROM ingredient_densities');
    densityRows.forEach((density: IngredientDensity) => {
      const key = density.ingredient_name.toLowerCase();
      if (!this.densities.has(key)) {
        this.densities.set(key, []);
      }
      this.densities.get(key)!.push(density);
    });
  }

  async convert(
    quantity: number,
    fromUnit: string,
    toUnit: string,
    ingredientName?: string
  ): Promise<number> {
    // Validate units exist
    if (!this.units.has(fromUnit)) {
      throw new UnknownUnitError(fromUnit);
    }
    if (!this.units.has(toUnit)) {
      throw new UnknownUnitError(toUnit);
    }

    const from = this.units.get(fromUnit)!;
    const to = this.units.get(toUnit)!;

    // Same category conversion
    if (from.category === to.category) {
      return this.convertSameCategory(quantity, fromUnit, toUnit);
    }

    // Cross-category conversion requires ingredient and density
    if (!ingredientName) {
      throw new ImpossibleConversionError(fromUnit, toUnit);
    }

    return this.convertCrossCategory(quantity, fromUnit, toUnit, ingredientName);
  }

  private convertSameCategory(
    quantity: number,
    fromUnit: string,
    toUnit: string
  ): number {
    const conversionKey = `${fromUnit}->${toUnit}`;
    const factor = this.conversions.get(conversionKey);

    if (factor === undefined) {
      throw new ImpossibleConversionError(fromUnit, toUnit);
    }

    return quantity * factor;
  }

  private async convertCrossCategory(
    quantity: number,
    fromUnit: string,
    toUnit: string,
    ingredientName: string
  ): Promise<number> {
    const from = this.units.get(fromUnit)!;
    const to = this.units.get(toUnit)!;

    // Only support volume → weight or weight → volume
    const isVolumeToWeight =
      from.category === UNIT_CATEGORIES.VOLUME && to.category === UNIT_CATEGORIES.WEIGHT;
    const isWeightToVolume =
      from.category === UNIT_CATEGORIES.WEIGHT && to.category === UNIT_CATEGORIES.VOLUME;

    if (!isVolumeToWeight && !isWeightToVolume) {
      throw new ImpossibleConversionError(fromUnit, toUnit, ingredientName);
    }

    // Get ingredient density
    const densityKey = ingredientName.toLowerCase();
    const densities = this.densities.get(densityKey);

    if (!densities || densities.length === 0) {
      throw new MissingDensityError(ingredientName);
    }

    if (isVolumeToWeight) {
      return this.volumeToWeight(quantity, fromUnit, ingredientName, densities);
    } else {
      return this.weightToVolume(quantity, fromUnit, ingredientName, densities);
    }
  }

  private volumeToWeight(
    quantity: number,
    volumeUnit: string,
    ingredientName: string,
    densities: IngredientDensity[]
  ): number {
    // Find density for this volume unit
    const density = densities.find((d) => {
      const unit = this.units.get(volumeUnit);
      return unit && d.volume_unit_id === unit.id;
    });

    if (!density) {
      throw new MissingDensityError(ingredientName);
    }

    return quantity * density.weight_in_grams;
  }

  private async weightToVolume(
    quantity: number,
    weightUnit: string,
    ingredientName: string,
    densities: IngredientDensity[]
  ): Promise<number> {
    // Get base unit density (usually per ml)
    const mlDensity = densities.find((d) => {
      const unit = this.units.get('ml');
      return unit && d.volume_unit_id === unit.id;
    });

    if (!mlDensity) {
      throw new MissingDensityError(ingredientName);
    }

    // Convert weight to grams first if needed
    let weightInGrams = quantity;
    if (weightUnit === 'kg') {
      weightInGrams = quantity * 1000;
    }

    // Convert grams to ml using density
    return weightInGrams / mlDensity.weight_in_grams;
  }

  async normalizeToBaseUnit(
    quantity: number,
    unit: string,
    ingredientName?: string
  ): Promise<ConversionResult> {
    if (!this.units.has(unit)) {
      throw new UnknownUnitError(unit);
    }

    const unitData = this.units.get(unit)!;
    const baseUnit = unitData.base_unit;

    if (unit === baseUnit) {
      return { quantity, unit };
    }

    const normalizedQuantity = await this.convert(quantity, unit, baseUnit, ingredientName);
    return { quantity: normalizedQuantity, unit: baseUnit };
  }

  async getConversionFactor(fromUnit: string, toUnit: string): Promise<number> {
    if (!this.units.has(fromUnit)) {
      throw new UnknownUnitError(fromUnit);
    }
    if (!this.units.has(toUnit)) {
      throw new UnknownUnitError(toUnit);
    }

    const conversionKey = `${fromUnit}->${toUnit}`;
    const factor = this.conversions.get(conversionKey);

    if (factor === undefined) {
      throw new ImpossibleConversionError(fromUnit, toUnit);
    }

    return factor;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npm test -- src/__tests__/lib/units/converter.test.ts
```

Expected: PASS - all tests passing

- [ ] **Step 5: Check type safety**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/units/converter.ts src/__tests__/lib/units/converter.test.ts
git commit -m "feat: implement UnitConverter service

Add UnitConverter class with methods:
- convert(): convert quantity between units (same or cross-category)
- normalizeToBaseUnit(): convert to ml or g
- getConversionFactor(): fetch raw conversion factor

Supports volume-weight conversions via ingredient-specific densities.
Throws appropriate errors for unknown units or impossible conversions.

Includes comprehensive test coverage for all conversion types.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Recipe Scaler Service

### Task 6: Implement RecipeScaler Service

**Files:**
- Create: `src/lib/units/scaler.ts`
- Modify: `src/__tests__/lib/units/converter.test.ts` (add scaler tests)

- [ ] **Step 1: Write failing tests for recipe scaling**

Add to `src/__tests__/lib/units/converter.test.ts`:

```typescript
import { RecipeScaler } from '@/lib/units/scaler';

describe('RecipeScaler', () => {
  let scaler: RecipeScaler;
  let converter: UnitConverter;

  beforeAll(async () => {
    converter = new UnitConverter();
    await converter.initialize();
    scaler = new RecipeScaler(converter);
  });

  describe('scaleIngredient', () => {
    it('scales ingredient quantity by factor', () => {
      const ingredient = {
        id: 1,
        recipe_id: 1,
        name: 'Mehl',
        quantity: 500,
        unit: 'g',
      };

      const scaled = scaler.scaleIngredient(ingredient, 2);
      expect(scaled.quantity).toBe(1000);
      expect(scaled.unit).toBe('g');
    });

    it('promotes units when appropriate', () => {
      const ingredient = {
        id: 1,
        recipe_id: 1,
        name: 'Wasser',
        quantity: 3,
        unit: 'TL',
      };

      const scaled = scaler.scaleIngredient(ingredient, 2);
      // 3 TL * 2 = 6 TL = 2 EL
      expect(scaled.unit).toBe('EL');
      expect(scaled.quantity).toBeCloseTo(2, 1);
    });

    it('preserves non-scalable units', () => {
      const ingredient = {
        id: 1,
        recipe_id: 1,
        name: 'Eier',
        quantity: 2,
        unit: 'Stück',
      };

      const scaled = scaler.scaleIngredient(ingredient, 3);
      expect(scaled.quantity).toBe(6);
      expect(scaled.unit).toBe('Stück');
    });

    it('rounds weights appropriately', () => {
      const ingredient = {
        id: 1,
        recipe_id: 1,
        name: 'Butter',
        quantity: 25,
        unit: 'g',
      };

      const scaled = scaler.scaleIngredient(ingredient, 3);
      // 25g * 3 = 75g, should round to nearest 5 = 75
      expect(scaled.quantity).toBe(75);
    });
  });

  describe('promoteUnit', () => {
    it('promotes TL to EL when >=3', () => {
      const result = scaler.promoteUnit(3, 'TL');
      expect(result.unit).toBe('EL');
      expect(result.quantity).toBeCloseTo(1, 1);
    });

    it('keeps TL when <3', () => {
      const result = scaler.promoteUnit(2, 'TL');
      expect(result.unit).toBe('TL');
      expect(result.quantity).toBe(2);
    });

    it('does not promote Stück', () => {
      const result = scaler.promoteUnit(100, 'Stück');
      expect(result.unit).toBe('Stück');
      expect(result.quantity).toBe(100);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npm test -- src/__tests__/lib/units/converter.test.ts
```

Expected: FAIL - "RecipeScaler is not defined"

- [ ] **Step 3: Write RecipeScaler implementation**

Create file `src/lib/units/scaler.ts`:

```typescript
import { UnitConverter } from './converter';
import { ScaledIngredient } from './types';
import { UNIT_PROMOTION_RULES, ROUNDING_RULES, VALIDATION_BOUNDS } from './constants';

export class RecipeScaler {
  constructor(private converter: UnitConverter) {}

  scaleIngredient(ingredient: ScaledIngredient, scaleFactor: number): ScaledIngredient {
    if (scaleFactor <= 0) {
      throw new Error('Scale factor must be positive');
    }

    const newQuantity = ingredient.quantity * scaleFactor;
    const { quantity, unit } = this.promoteUnit(newQuantity, ingredient.unit || 'g');

    return {
      ...ingredient,
      quantity: this.roundQuantity(quantity, unit),
      unit,
    };
  }

  promoteUnit(quantity: number, unit: string): { quantity: number; unit: string } {
    // Non-promotable units
    if (unit === 'Stück' || unit === 'Prise' || unit === 'count' || unit === 'pinch') {
      return { quantity: Math.round(quantity), unit };
    }

    // Check promotion rules
    const rule = UNIT_PROMOTION_RULES[unit as keyof typeof UNIT_PROMOTION_RULES];
    if (rule && quantity >= rule.threshold) {
      const conversionFactor =
        unit === 'TL' && rule.promoteToUnit === 'EL'
          ? 1 / 3
          : unit === 'EL' && rule.promoteToUnit === 'ml'
            ? 1 / 15
            : unit === 'ml' && rule.promoteToUnit === 'l'
              ? 1 / 1000
              : 1;

      return {
        quantity: quantity * conversionFactor,
        unit: rule.promoteToUnit,
      };
    }

    return { quantity, unit };
  }

  private roundQuantity(quantity: number, unit: string): number {
    // Non-metric units (Stück, Prise)
    if (unit === 'Stück' || unit === 'Prise') {
      return Math.round(quantity);
    }

    // Weight rounding
    if (unit === 'g') {
      const rule =
        quantity >= ROUNDING_RULES.weight_large.threshold
          ? ROUNDING_RULES.weight_large
          : ROUNDING_RULES.weight_small;
      return Math.round(quantity / rule.precision) * rule.precision;
    }

    if (unit === 'kg') {
      return Math.round(quantity * 100) / 100; // Round to 0.01kg
    }

    // Volume rounding
    if (unit === 'ml') {
      const rule =
        quantity >= ROUNDING_RULES.volume_large.threshold
          ? ROUNDING_RULES.volume_large
          : ROUNDING_RULES.volume_small;
      return Math.round(quantity / rule.precision) * rule.precision;
    }

    if (unit === 'l') {
      return Math.round(quantity * 100) / 100; // Round to 0.01l
    }

    // TL, EL - common fractions
    if (unit === 'TL' || unit === 'EL') {
      // Allow fractions: 0.25, 0.5, 0.75, 1, 1.5, etc.
      return Math.round(quantity * 4) / 4;
    }

    return quantity;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
npm test -- src/__tests__/lib/units/converter.test.ts
```

Expected: PASS - all scaler tests passing

- [ ] **Step 5: Check type safety**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/units/scaler.ts src/__tests__/lib/units/scaler.test.ts
git commit -m "feat: implement RecipeScaler service

Add RecipeScaler class with methods:
- scaleIngredient(): scale single ingredient by factor
- promoteUnit(): convert 3 TL → 1 EL, etc. when appropriate

Handles rounding based on unit type (5g for large weights, 0.5ml for small volumes).
Preserves non-scalable units (Stück, Prise).

Includes comprehensive test coverage.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 5: API Endpoints

### Task 7: Create Recipe Scale Endpoint

**Files:**
- Create: `src/app/api/recipes/[id]/scale/route.ts`

- [ ] **Step 1: Write integration test for scale endpoint**

Create file `tests/api/recipes-scale.test.ts`:

```typescript
import { POST } from '@/app/api/recipes/[id]/scale/route';

describe('POST /api/recipes/[id]/scale', () => {
  it('scales all recipe ingredients', async () => {
    const request = new Request('http://localhost:3000/api/recipes/1/scale', {
      method: 'POST',
      body: JSON.stringify({ newServings: 8 }),
    });

    const response = await POST(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recipe).toBeDefined();
    expect(data.recipe.ingredients).toBeDefined();
    expect(data.recipe.ingredients.length).toBeGreaterThan(0);
  });

  it('returns 400 for invalid servings', async () => {
    const request = new Request('http://localhost:3000/api/recipes/1/scale', {
      method: 'POST',
      body: JSON.stringify({ newServings: 0 }),
    });

    const response = await POST(request, { params: { id: '1' } });
    expect(response.status).toBe(400);
  });

  it('returns 404 for non-existent recipe', async () => {
    const request = new Request('http://localhost:3000/api/recipes/999/scale', {
      method: 'POST',
      body: JSON.stringify({ newServings: 4 }),
    });

    const response = await POST(request, { params: { id: '999' } });
    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Write the scale endpoint**

Create file `src/app/api/recipes/[id]/scale/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UnitConverter } from '@/lib/units/converter';
import { RecipeScaler } from '@/lib/units/scaler';
import { VALIDATION_BOUNDS } from '@/lib/units/constants';
import { RecipeWithIngredients } from '@/types/recipe';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = parseInt(params.id, 10);
    const { newServings } = await request.json();

    // Validate input
    if (!Number.isInteger(newServings) || newServings < VALIDATION_BOUNDS.MIN_SERVINGS) {
      return NextResponse.json(
        {
          error: 'Invalid serving size. Must be a positive integer.',
        },
        { status: 400 }
      );
    }

    if (newServings > VALIDATION_BOUNDS.MAX_SERVINGS) {
      return NextResponse.json(
        {
          error: `Serving size exceeds maximum of ${VALIDATION_BOUNDS.MAX_SERVINGS}`,
        },
        { status: 400 }
      );
    }

    // Get recipe with ingredients
    const recipe = await db.get<RecipeWithIngredients>(
      `SELECT r.*, GROUP_CONCAT(i.id || ',' || i.name || ',' || i.quantity || ',' || i.unit) as ingredients_json
       FROM recipes r
       LEFT JOIN ingredients i ON r.id = i.recipe_id
       WHERE r.id = ?`,
      [recipeId]
    );

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (recipe.servings === 0 || !recipe.servings) {
      return NextResponse.json(
        { error: 'Recipe must have servings defined' },
        { status: 400 }
      );
    }

    // Initialize converter and scaler
    const converter = new UnitConverter();
    await converter.initialize();
    const scaler = new RecipeScaler(converter);

    // Calculate scale factor
    const scaleFactor = newServings / recipe.servings;

    // Get ingredients with full data
    const ingredients = await db.all(
      `SELECT id, recipe_id, name, quantity, unit
       FROM ingredients
       WHERE recipe_id = ?`,
      [recipeId]
    );

    // Scale ingredients
    const scaledIngredients = ingredients.map((ing) =>
      scaler.scaleIngredient(ing, scaleFactor)
    );

    // Return scaled recipe
    return NextResponse.json({
      recipe: {
        ...recipe,
        servings: newServings,
        ingredients: scaledIngredients,
      },
    });
  } catch (error) {
    console.error('Scale recipe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run integration tests**

Run:
```bash
npm test -- tests/api/recipes-scale.test.ts
```

Expected: PASS - all tests passing

- [ ] **Step 4: Manual API test**

Run dev server:
```bash
npm run dev
```

Test with curl:
```bash
curl -X POST http://localhost:3000/api/recipes/1/scale \
  -H "Content-Type: application/json" \
  -d '{"newServings": 8}'
```

Expected: 200 response with scaled recipe

- [ ] **Step 5: Commit**

```bash
git add src/app/api/recipes/[id]/scale/route.ts tests/api/recipes-scale.test.ts
git commit -m "feat: add recipe scale API endpoint

Implement POST /api/recipes/{id}/scale endpoint:
- Validates newServings (1-100)
- Loads recipe with ingredients from database
- Applies RecipeScaler to all ingredients
- Returns recipe with scaled quantities and promoted units

Includes integration tests for success and error cases.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

### Task 8: Update Ingredient Creation with Unit Normalization

**Files:**
- Modify: `src/app/api/recipes/[id]/ingredients/route.ts`

- [ ] **Step 1: Write failing test for ingredient normalization**

Create file `tests/api/ingredients-normalize.test.ts`:

```typescript
import { POST } from '@/app/api/recipes/[id]/ingredients/route';

describe('POST /api/recipes/[id]/ingredients (normalization)', () => {
  it('normalizes volume unit to ml', async () => {
    const request = new Request('http://localhost:3000/api/recipes/1/ingredients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Wasser',
        quantity: 250,
        unit: 'ml',
      }),
    });

    const response = await POST(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.ingredient.normalized_unit).toBe('ml');
    expect(data.ingredient.normalized_quantity).toBe(250);
  });

  it('normalizes weight unit to g', async () => {
    const request = new Request('http://localhost:3000/api/recipes/1/ingredients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Mehl',
        quantity: 1,
        unit: 'kg',
      }),
    });

    const response = await POST(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.ingredient.normalized_unit).toBe('g');
    expect(data.ingredient.normalized_quantity).toBe(1000);
  });

  it('rejects unknown unit', async () => {
    const request = new Request('http://localhost:3000/api/recipes/1/ingredients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Zucker',
        quantity: 100,
        unit: 'tbsp',
      }),
    });

    const response = await POST(request, { params: { id: '1' } });
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Update ingredient creation endpoint**

Modify `src/app/api/recipes/[id]/ingredients/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UnitConverter } from '@/lib/units/converter';
import { UnknownUnitError, ImpossibleConversionError, MissingDensityError } from '@/lib/units/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = parseInt(params.id, 10);
    const { name, quantity, unit } = await request.json();

    // Validate inputs
    if (!name || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit is required' },
        { status: 400 }
      );
    }

    // Initialize converter
    const converter = new UnitConverter();
    await converter.initialize();

    // Normalize quantity to base unit
    let normalized_quantity: number | null = null;
    let normalized_unit: string | null = null;

    try {
      const normalization = await converter.normalizeToBaseUnit(quantity, unit, name);
      normalized_quantity = normalization.quantity;
      normalized_unit = normalization.unit;
    } catch (error) {
      if (error instanceof UnknownUnitError) {
        return NextResponse.json(
          { error: `Unknown unit: ${unit}` },
          { status: 400 }
        );
      }
      // For impossible conversions (e.g., Stück), allow with null normalized values
      if (!(error instanceof ImpossibleConversionError && error.ingredient)) {
        throw error;
      }
    }

    // Insert ingredient
    const result = await db.run(
      `INSERT INTO ingredients (recipe_id, name, quantity, unit, normalized_quantity, normalized_unit)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recipeId, name, quantity, unit, normalized_quantity, normalized_unit]
    );

    const ingredient = {
      id: result.lastID,
      recipe_id: recipeId,
      name,
      quantity,
      unit,
      normalized_quantity,
      normalized_unit,
    };

    return NextResponse.json({ ingredient }, { status: 201 });
  } catch (error) {
    console.error('Create ingredient error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test -- tests/api/ingredients-normalize.test.ts
```

Expected: PASS - all tests passing

- [ ] **Step 4: Commit**

```bash
git add src/app/api/recipes/[id]/ingredients/route.ts tests/api/ingredients-normalize.test.ts
git commit -m "feat: add unit normalization to ingredient creation

Update POST /recipes/{id}/ingredients endpoint:
- Validates unit using UnitConverter
- Normalizes quantity to base unit (ml for volume, g for weight)
- Stores both original and normalized values
- Rejects unknown units with 400 error

Includes tests for normalization and error cases.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 6: Module Exports & Integration

### Task 9: Create Unit Module Exports

**Files:**
- Create: `src/lib/units/index.ts`

- [ ] **Step 1: Write module exports**

Create file `src/lib/units/index.ts`:

```typescript
export { UnitConverter } from './converter';
export { RecipeScaler } from './scaler';
export {
  UnknownUnitError,
  ImpossibleConversionError,
  MissingDensityError,
  OutOfRangeError,
  Unit,
  UnitConversion,
  IngredientDensity,
  ConversionResult,
  ScaledIngredient,
} from './types';
export {
  UNIT_CATEGORIES,
  BASE_UNITS,
  SUPPORTED_UNITS,
  UNIT_PROMOTION_RULES,
  ROUNDING_RULES,
  VALIDATION_BOUNDS,
} from './constants';
```

- [ ] **Step 2: Run type check**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Verify exports work**

Run:
```bash
node -e "const units = require('./src/lib/units/index.ts'); console.log(Object.keys(units));"
```

Expected: All exports listed

- [ ] **Step 4: Commit**

```bash
git add src/lib/units/index.ts
git commit -m "export: expose unit conversion module

Create barrel export for units module making it importable as:
import { UnitConverter, RecipeScaler } from '@/lib/units'

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 7: Documentation & Testing

### Task 10: Write Unit System Documentation

**Files:**
- Create: `docs/features/unit-conversion.md`

- [ ] **Step 1: Write documentation**

Create file `docs/features/unit-conversion.md`:

```markdown
# Unit Conversion & Recipe Scaling

## Overview

The unit conversion system allows recipes to be scaled to different serving sizes while automatically promoting units to practical scales (3 TL → 1 EL).

## Supported Units

- **Volume:** TL (Teelöffel), EL (Esslöffel), ml, l
- **Weight:** g, kg
- **Count:** Stück (pieces)
- **Pinch:** Prise

## Features

### Recipe Scaling

Scale a recipe to a different number of servings via the API:

```
POST /api/recipes/{id}/scale
Content-Type: application/json

{
  "newServings": 8
}
```

Response includes the recipe with all ingredients scaled and units promoted as appropriate.

### Unit Conversion

The `UnitConverter` service handles all conversions:

```typescript
import { UnitConverter } from '@/lib/units';

const converter = new UnitConverter();
await converter.initialize();

// Convert between same category
const ml = await converter.convert(1, 'TL', 'ml');  // Returns 5

// Convert between categories using ingredient density
const grams = await converter.convert(1, 'TL', 'g', 'Mehl');  // Returns 5
```

### Ingredient Creation

When creating ingredients, quantities are automatically normalized to base units (ml for volume, g for weight):

```
POST /api/recipes/{id}/ingredients
Content-Type: application/json

{
  "name": "Mehl",
  "quantity": 250,
  "unit": "g"
}
```

Stores both original values and normalized values in database.

## Architecture

### UnitConverter Service

Handles unit conversions between compatible units. Supports:
- Same-category conversions (TL → EL → ml)
- Cross-category conversions using ingredient-specific densities (TL Mehl → g)

```typescript
convert(quantity, fromUnit, toUnit, ingredientName?)
normalizeToBaseUnit(quantity, unit, ingredientName?)
getConversionFactor(fromUnit, toUnit)
```

### RecipeScaler Service

Scales recipe ingredients while promoting units appropriately.

```typescript
scaleIngredient(ingredient, scaleFactor)
promoteUnit(quantity, unit)
```

### Ingredient Densities

Ingredient-specific density data enables volume-weight conversions. Default densities are seeded in database but can be extended.

Common examples:
- Mehl (flour): 1 TL = 5g, 1 EL = 15g
- Zucker (sugar): 1 TL = 8g, 1 EL = 25g
- Butter: 1 TL = 5g, 1 EL = 15g

### Rounding Rules

Quantities are rounded based on unit and magnitude:
- Large weights (>50g): round to nearest 5g
- Small weights (<50g): round to nearest 1g
- Large volumes (>100ml): round to nearest 5ml
- Small volumes (<100ml): round to nearest 0.5ml
- Pieces/pinches: round to nearest integer

## Error Handling

### UnknownUnitError
Thrown when a unit is not recognized. Check `SUPPORTED_UNITS` for valid options.

### ImpossibleConversionError
Thrown when no conversion path exists between units (e.g., Stück → ml).

### MissingDensityError
Thrown when attempting volume-weight conversion for an ingredient without density data.

### OutOfRangeError
Thrown when scaling to invalid serving sizes (≤0 or >100).

## Adding New Ingredient Densities

Add to `db/seeds/units.sql`:

```sql
INSERT INTO ingredient_densities (ingredient_name, volume_unit_id, weight_in_grams)
VALUES ('Äpfel', 3, 0.25);  -- 1 ml grated apple ≈ 0.25g
```

Then reseed:
```bash
sqlite3 .data/app.db < db/seeds/units.sql
```

## Testing

- Unit tests: `npm test -- src/__tests__/lib/units/`
- Integration tests: `npm test -- tests/api/`
- Coverage: Minimum 85% for converter and scaler logic

## Future Enhancements

- User-customizable ingredient densities per recipe
- Photo-based ingredient weight estimation
- Nutritional information scaling
- Shopping list generation with consolidated units
```

- [ ] **Step 2: Commit**

```bash
git add docs/features/unit-conversion.md
git commit -m "docs: add unit conversion and recipe scaling documentation

Document unit system features, supported units, API endpoints,
architecture, error handling, and density management.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

### Task 11: Final Testing & Coverage Check

**Files:**
- (Verification only, no new files)

- [ ] **Step 1: Run all unit tests**

Run:
```bash
npm test -- src/__tests__/lib/units/
```

Expected: All tests pass, coverage ≥85%

- [ ] **Step 2: Run all API integration tests**

Run:
```bash
npm test -- tests/api/recipes-scale.test.ts tests/api/ingredients-normalize.test.ts
```

Expected: All tests pass

- [ ] **Step 3: Run full test suite with coverage**

Run:
```bash
npm run test:coverage
```

Expected: Coverage ≥85% for `src/lib/units/`

- [ ] **Step 4: Type check entire project**

Run:
```bash
npx tsc --noEmit
```

Expected: No type errors

- [ ] **Step 5: Lint check**

Run:
```bash
npm run lint
```

Expected: No linting errors in modified files

- [ ] **Step 6: Manual smoke test**

1. Start dev server: `npm run dev`
2. Create a recipe with mixed units (TL, EL, ml, g, kg)
3. Call POST /api/recipes/{id}/scale with newServings=8
4. Verify all units promoted and quantities scaled correctly
5. Create ingredient with unit=TL, verify normalized_unit=ml in response

Expected: All operations succeed without errors

- [ ] **Step 7: Commit test results**

```bash
git add -A
git commit -m "test: verify unit conversion system coverage and functionality

- All unit tests passing (85%+ coverage)
- All integration tests passing
- Manual smoke tests successful
- Type checking clean
- Linting clean

System ready for review and deployment.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Summary

This plan implements a complete unit conversion and recipe scaling system with:

✅ **Database Layer:** 3 new tables (units, conversions, densities) + normalized fields  
✅ **Logic Layer:** UnitConverter service + RecipeScaler service  
✅ **API Layer:** Scale endpoint + ingredient normalization  
✅ **Testing:** 85%+ coverage with unit + integration tests  
✅ **Documentation:** Feature guide + error handling reference  

**Total Tasks:** 11  
**Total Steps:** 47  
**Key Commits:** 11  
**Estimated Implementation Time:** 2-3 hours for experienced developer
