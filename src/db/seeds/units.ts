/**
 * Seed data for units, conversions, and ingredient densities
 *
 * This module provides seed data for:
 * - 8 units (TL, EL, ml, l, g, kg, Stück, Prise)
 * - 8 conversion factor pairs
 * - 15 ingredient density mappings
 */

export interface UnitSeed {
  abbreviation: string;
  name: string;
  category: 'volume' | 'weight' | 'count' | 'pinch';
  base_unit: string;
}

export interface ConversionSeed {
  from_abbreviation: string;
  to_abbreviation: string;
  conversion_factor: number;
}

export interface DensitySeed {
  ingredient_name: string;
  volume_unit_abbreviation: string;
  weight_in_grams: number;
}

export const UNIT_SEEDS: UnitSeed[] = [
  // Volume units
  { abbreviation: 'TL', name: 'Teelöffel', category: 'volume', base_unit: 'ml' },
  { abbreviation: 'EL', name: 'Esslöffel', category: 'volume', base_unit: 'ml' },
  { abbreviation: 'ml', name: 'Milliliter', category: 'volume', base_unit: 'ml' },
  { abbreviation: 'l', name: 'Liter', category: 'volume', base_unit: 'ml' },

  // Weight units
  { abbreviation: 'g', name: 'Gramm', category: 'weight', base_unit: 'g' },
  { abbreviation: 'kg', name: 'Kilogramm', category: 'weight', base_unit: 'g' },

  // Count/piece units
  { abbreviation: 'Stück', name: 'Piece', category: 'count', base_unit: 'count' },

  // Pinch units
  { abbreviation: 'Prise', name: 'Pinch', category: 'pinch', base_unit: 'pinch' },
];

// Volume conversions using abbreviations
export const CONVERSION_SEEDS: ConversionSeed[] = [
  { from_abbreviation: 'TL', to_abbreviation: 'EL', conversion_factor: 0.333 },
  { from_abbreviation: 'EL', to_abbreviation: 'TL', conversion_factor: 3.0 },
  { from_abbreviation: 'TL', to_abbreviation: 'ml', conversion_factor: 5.0 },
  { from_abbreviation: 'EL', to_abbreviation: 'ml', conversion_factor: 15.0 },
  { from_abbreviation: 'ml', to_abbreviation: 'TL', conversion_factor: 0.2 },
  { from_abbreviation: 'ml', to_abbreviation: 'EL', conversion_factor: 0.0667 },
  { from_abbreviation: 'ml', to_abbreviation: 'l', conversion_factor: 0.001 },
  { from_abbreviation: 'l', to_abbreviation: 'ml', conversion_factor: 1000.0 },

  // Weight conversions
  { from_abbreviation: 'g', to_abbreviation: 'kg', conversion_factor: 0.001 },
  { from_abbreviation: 'kg', to_abbreviation: 'g', conversion_factor: 1000.0 },
];

// Common ingredient densities (in grams per unit)
export const DENSITY_SEEDS: DensitySeed[] = [
  // Mehl (Flour)
  { ingredient_name: 'Mehl', volume_unit_abbreviation: 'TL', weight_in_grams: 5.0 },
  { ingredient_name: 'Mehl', volume_unit_abbreviation: 'EL', weight_in_grams: 15.0 },
  { ingredient_name: 'Mehl', volume_unit_abbreviation: 'ml', weight_in_grams: 1.0 },

  // Zucker (Sugar)
  { ingredient_name: 'Zucker', volume_unit_abbreviation: 'TL', weight_in_grams: 8.0 },
  { ingredient_name: 'Zucker', volume_unit_abbreviation: 'EL', weight_in_grams: 25.0 },
  { ingredient_name: 'Zucker', volume_unit_abbreviation: 'ml', weight_in_grams: 0.8 },

  // Butter
  { ingredient_name: 'Butter', volume_unit_abbreviation: 'TL', weight_in_grams: 5.0 },
  { ingredient_name: 'Butter', volume_unit_abbreviation: 'EL', weight_in_grams: 15.0 },
  { ingredient_name: 'Butter', volume_unit_abbreviation: 'ml', weight_in_grams: 0.9 },

  // Honig (Honey)
  { ingredient_name: 'Honig', volume_unit_abbreviation: 'TL', weight_in_grams: 7.0 },
  { ingredient_name: 'Honig', volume_unit_abbreviation: 'EL', weight_in_grams: 20.0 },
  { ingredient_name: 'Honig', volume_unit_abbreviation: 'ml', weight_in_grams: 1.4 },

  // Salz (Salt)
  { ingredient_name: 'Salz', volume_unit_abbreviation: 'TL', weight_in_grams: 6.0 },
  { ingredient_name: 'Salz', volume_unit_abbreviation: 'EL', weight_in_grams: 18.0 },

  // Öl (Oil)
  { ingredient_name: 'Öl', volume_unit_abbreviation: 'TL', weight_in_grams: 5.0 },
  { ingredient_name: 'Öl', volume_unit_abbreviation: 'EL', weight_in_grams: 15.0 },
];

/**
 * Seed units table
 * @param db - Database instance (better-sqlite3 Database or pg Pool)
 */
export function seedUnits(db: any) {
  // Check if we're using SQLite or PostgreSQL
  const isPostgres = db.query !== undefined;

  if (isPostgres) {
    // PostgreSQL - use async/await pattern (handled by caller)
    // This function would need to be async for PostgreSQL
    throw new Error('Use seedUnitsAsync for PostgreSQL');
  }

  // SQLite - synchronous
  const existingCount = db.prepare(
    'SELECT COUNT(*) as count FROM units'
  ).get() as { count: number };

  // Check for expected count to ensure idempotency (8 units expected)
  if (existingCount.count >= 8) {
    // eslint-disable-next-line no-console
    console.log('Units already seeded, skipping...');
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO units (abbreviation, name, category, base_unit)
    VALUES (?, ?, ?, ?)
  `);

  for (const unit of UNIT_SEEDS) {
    stmt.run(unit.abbreviation, unit.name, unit.category, unit.base_unit);
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Seeded ${UNIT_SEEDS.length} units`);
}

/**
 * Seed unit conversions table
 * Requires units to be seeded first
 * @param db - Database instance (better-sqlite3 Database)
 */
export function seedUnitConversions(db: any) {
  // Check if we're using SQLite or PostgreSQL
  const isPostgres = db.query !== undefined;

  if (isPostgres) {
    // PostgreSQL - use async/await pattern
    throw new Error('Use seedUnitConversionsAsync for PostgreSQL');
  }

  // SQLite - synchronous
  const existingCount = db.prepare(
    'SELECT COUNT(*) as count FROM unit_conversions'
  ).get() as { count: number };

  // Check for expected count to ensure idempotency (10 conversions expected)
  if (existingCount.count >= 10) {
    // eslint-disable-next-line no-console
    console.log('Conversions already seeded, skipping...');
    return;
  }

  const getUnitIdStmt = db.prepare('SELECT id FROM units WHERE abbreviation = ?');
  const convStmt = db.prepare(`
    INSERT INTO unit_conversions (from_unit_id, to_unit_id, conversion_factor)
    VALUES (?, ?, ?)
  `);

  for (const conv of CONVERSION_SEEDS) {
    const fromUnit = getUnitIdStmt.get(conv.from_abbreviation) as { id: number } | undefined;
    const toUnit = getUnitIdStmt.get(conv.to_abbreviation) as { id: number } | undefined;

    if (fromUnit && toUnit) {
      convStmt.run(fromUnit.id, toUnit.id, conv.conversion_factor);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Seeded ${CONVERSION_SEEDS.length} conversions`);
}

/**
 * Seed ingredient densities table
 * Requires units to be seeded first
 * @param db - Database instance (better-sqlite3 Database)
 */
export function seedUnitDensities(db: any) {
  // Check if we're using SQLite or PostgreSQL
  const isPostgres = db.query !== undefined;

  if (isPostgres) {
    // PostgreSQL - use async/await pattern
    throw new Error('Use seedUnitDensitiesAsync for PostgreSQL');
  }

  // SQLite - synchronous
  const existingCount = db.prepare(
    'SELECT COUNT(*) as count FROM ingredient_densities'
  ).get() as { count: number };

  // Check for expected count to ensure idempotency (16 densities expected)
  if (existingCount.count >= 16) {
    // eslint-disable-next-line no-console
    console.log('Densities already seeded, skipping...');
    return;
  }

  const getUnitIdStmt = db.prepare('SELECT id FROM units WHERE abbreviation = ?');
  const densityStmt = db.prepare(`
    INSERT INTO ingredient_densities (ingredient_name, volume_unit_id, weight_in_grams)
    VALUES (?, ?, ?)
  `);

  for (const density of DENSITY_SEEDS) {
    const unit = getUnitIdStmt.get(density.volume_unit_abbreviation) as { id: number } | undefined;

    if (unit) {
      densityStmt.run(density.ingredient_name, unit.id, density.weight_in_grams);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Seeded ${DENSITY_SEEDS.length} densities`);
}
