/**
 * Database seed coordinator
 * Orchestrates seeding of all tables in the correct order
 */

import { seedUnits, seedUnitConversions, seedUnitDensities } from './units';

export type DbClient = any; // better-sqlite3.Database or pg.Pool

/**
 * Seed SQLite database (synchronous)
 * Seeds essential data like units, conversions, and densities
 * Other seed data (ingredients, recipes) is seeded via API during initial setup
 */
export function seedDatabase(db: DbClient): void {
  // eslint-disable-next-line no-console
  console.log('Starting database seed...');

  // Units, conversions, and densities are required for the app to function
  seedUnits(db);
  seedUnitConversions(db);
  seedUnitDensities(db);

  // eslint-disable-next-line no-console
  console.log('✓ Database seed complete');
}

/**
 * Seed PostgreSQL database (async)
 * For future use when async seed functions are implemented
 */
export async function seedDatabaseAsync(db: DbClient): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Starting database seed (async)...');

  // TODO: Implement async versions of seed functions for PostgreSQL
  // seedUnitsAsync, seedUnitConversionsAsync, etc.

  // eslint-disable-next-line no-console
  console.log('✓ Database seed complete');
}
