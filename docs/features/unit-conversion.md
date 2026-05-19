# Unit Conversion & Recipe Scaling

## Overview

The unit conversion system allows recipes to be scaled to different serving sizes while automatically promoting units to practical scales (3 TL → 1 EL).

## Supported Units

| Unit | Name | Category |
|------|------|----------|
| TL | Teelöffel | Volume |
| EL | Esslöffel | Volume |
| ml | Milliliter | Volume |
| l | Liter | Volume |
| g | Gramm | Weight |
| kg | Kilogramm | Weight |
| Stück | Piece | Count |
| Prise | Pinch | Pinch |

## API

### Scale Recipe

```
POST /api/recipes/{id}/scale
Content-Type: application/json

{ "newServings": 8 }
```

Returns the recipe with all ingredients scaled. Does not modify the database.

### Create Ingredient (with normalization)

```
POST /api/recipes/{id}/ingredients
Content-Type: application/json

{ "name": "Mehl", "quantity": 250, "unit": "g" }
```

Automatically normalizes the quantity to base unit (ml for volume, g for weight) and stores both values.

## Unit Promotion Rules

When scaling, quantities are automatically promoted to larger units:
- 3+ TL → EL (1 TL ≈ 1/3 EL)
- 16+ EL → ml
- 1000+ ml → l

## Rounding Rules

| Context | Threshold | Precision |
|---------|-----------|-----------|
| Weight (large) | > 50g | 5g |
| Weight (small) | ≤ 50g | 1g |
| Volume (large) | > 100ml | 5ml |
| Volume (small) | ≤ 100ml | 0.5ml |
| TL / EL | — | 0.25 |
| Stück / Prise | — | 1 (integer) |

## Architecture

### UnitConverter (`src/lib/units/converter.ts`)

Loads unit data from DB at startup, then performs in-memory conversions.

```typescript
const converter = new UnitConverter();
await converter.initialize();

// Volume → Volume
const ml = await converter.convert(1, 'TL', 'ml'); // 5

// Volume → Weight (ingredient density required)
const g = await converter.convert(1, 'TL', 'g', 'Mehl'); // 5

// Normalize to base unit
const base = await converter.normalizeToBaseUnit(1, 'EL'); // { quantity: 15, unit: 'ml' }
```

### RecipeScaler (`src/lib/units/scaler.ts`)

Pure in-memory scaling with unit promotion.

```typescript
const scaler = new RecipeScaler();
const scaled = scaler.scaleIngredient(ingredient, 2); // double all quantities
```

### Adding New Ingredient Densities

Run SQL against the database:

```sql
INSERT OR IGNORE INTO ingredient_densities (ingredient_name, volume_unit_id, weight_in_grams)
SELECT 'Äpfel', id, 0.25 FROM units WHERE abbreviation = 'ml';
```

## Error Types

| Error | When thrown |
|-------|-------------|
| `UnknownUnitError` | Unit not in database |
| `ImpossibleConversionError` | No conversion path (e.g. Stück → ml) |
| `MissingDensityError` | Volume↔weight conversion for ingredient without density data |
| `OutOfRangeError` | Value outside valid range |
