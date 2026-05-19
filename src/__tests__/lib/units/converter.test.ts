/** @jest-environment node */
import { UnitConverter } from '@/lib/units/converter';
import {
  UnknownUnitError,
  ImpossibleConversionError,
  MissingDensityError,
} from '@/lib/units/types';
import { initializeDatabase, closeDatabase, getDb } from '@/lib/db/init';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  UNIT_SEEDS,
  CONVERSION_SEEDS,
  DENSITY_SEEDS,
} from '@/db/seeds/units';

describe('UnitConverter', () => {
  let converter: UnitConverter;
  let dbPath: string;

  beforeAll(async () => {
    dbPath = mkdtempSync(join(tmpdir(), 'units-test-'));
    process.env.DATABASE_URL = `file:${join(dbPath, 'test.db')}`;
    (global as any).db = undefined;
    await initializeDatabase();

    // Seed units, conversions, and densities
    const db = getDb() as Database.Database;

    const unitStmt = db.prepare(
      'INSERT INTO units (abbreviation, name, category, base_unit) VALUES (?, ?, ?, ?)'
    );
    for (const unit of UNIT_SEEDS) {
      unitStmt.run(unit.abbreviation, unit.name, unit.category, unit.base_unit);
    }

    const getUnitId = db.prepare('SELECT id FROM units WHERE abbreviation = ?');
    const convStmt = db.prepare(
      'INSERT INTO unit_conversions (from_unit_id, to_unit_id, conversion_factor) VALUES (?, ?, ?)'
    );
    for (const conv of CONVERSION_SEEDS) {
      const from = getUnitId.get(conv.from_abbreviation) as { id: number };
      const to = getUnitId.get(conv.to_abbreviation) as { id: number };
      if (from && to) {
        convStmt.run(from.id, to.id, conv.conversion_factor);
      }
    }

    const densityStmt = db.prepare(
      'INSERT INTO ingredient_densities (ingredient_name, volume_unit_id, weight_in_grams) VALUES (?, ?, ?)'
    );
    for (const density of DENSITY_SEEDS) {
      const unit = getUnitId.get(density.volume_unit_abbreviation) as { id: number };
      if (unit) {
        densityStmt.run(density.ingredient_name, unit.id, density.weight_in_grams);
      }
    }

    converter = new UnitConverter();
    await converter.initialize();
  });

  afterAll(() => {
    closeDatabase();
    rmSync(dbPath, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
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

    it('normalizes g to g (already base)', async () => {
      const result = await converter.normalizeToBaseUnit(500, 'g');
      expect(result).toEqual({ quantity: 500, unit: 'g' });
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
