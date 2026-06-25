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
import { UNIT_SEEDS, CONVERSION_SEEDS, DENSITY_SEEDS } from '@/db/seeds/units';

describe('UnitConverter', () => {
  let converter: UnitConverter;
  let dbPath: string;

  beforeAll(async () => {
    dbPath = mkdtempSync(join(tmpdir(), 'units-test-'));
    process.env.DATABASE_URL = `file:${join(dbPath, 'test.db')}`;
    await initializeDatabase();

    // Database is already seeded with units, conversions, and densities
    // during initializeDatabase() call above, so we can skip manual seeding

    converter = new UnitConverter();
    await converter.initialize();
  });

  afterAll(() => {
    closeDatabase();
    rmSync(dbPath, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  // TC-013-01
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

    // TC-013-02
    it('throws UnknownUnitError for unknown unit', async () => {
      await expect(converter.convert(1, 'unknown', 'ml')).rejects.toThrow(UnknownUnitError);
    });

    // TC-013-02
    it('throws ImpossibleConversionError for incompatible units', async () => {
      await expect(converter.convert(1, 'TL', 'g')).rejects.toThrow(ImpossibleConversionError);
    });
  });

  // TC-013-03
  describe('convert - cross-category with density', () => {
    it('converts TL Mehl to g', async () => {
      const result = await converter.convert(1, 'TL', 'g', 'Mehl');
      expect(result).toBeCloseTo(5, 1);
    });

    it('converts EL Zucker to g', async () => {
      const result = await converter.convert(1, 'EL', 'g', 'Zucker');
      expect(result).toBeCloseTo(25, 1);
    });

    // TC-013-04
    it('throws MissingDensityError when density not found', async () => {
      await expect(converter.convert(1, 'TL', 'g', 'UnknownIngredient')).rejects.toThrow(
        MissingDensityError
      );
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

    it('throws ImpossibleConversionError for units without conversion', async () => {
      await expect(converter.getConversionFactor('TL', 'g')).rejects.toThrow(
        ImpossibleConversionError
      );
    });
  });

  describe('convert - same unit (identity conversion)', () => {
    it('throws ImpossibleConversionError for ml to ml (no conversion factor)', async () => {
      await expect(converter.convert(100, 'ml', 'ml')).rejects.toThrow(ImpossibleConversionError);
    });

    it('throws ImpossibleConversionError for g to g (no conversion factor)', async () => {
      await expect(converter.convert(250, 'g', 'g')).rejects.toThrow(ImpossibleConversionError);
    });
  });

  describe('weightToVolume conversion', () => {
    it('converts g Mehl to ml', async () => {
      // Mehl has 1.0 g/ml density
      const result = await converter.convert(10, 'g', 'ml', 'Mehl');
      expect(result).toBeCloseTo(10, 1);
    });

    it('converts kg Zucker to ml', async () => {
      // Zucker has 0.8 g/ml density, so 1000g = 1250ml
      const result = await converter.convert(1, 'kg', 'ml', 'Zucker');
      expect(result).toBeCloseTo(1250, 0);
    });

    it('throws MissingDensityError when ml density not available for weightToVolume', async () => {
      // Salz only has TL and EL densities, no ml density
      await expect(converter.convert(100, 'g', 'ml', 'Salz')).rejects.toThrow(MissingDensityError);
    });
  });

  describe('cross-category impossible conversions', () => {
    it('throws ImpossibleConversionError for count to weight', async () => {
      await expect(converter.convert(1, 'Stück', 'g', 'SomeFood')).rejects.toThrow(
        ImpossibleConversionError
      );
    });

    it('throws ImpossibleConversionError for pinch to weight', async () => {
      await expect(converter.convert(1, 'Prise', 'g', 'SomeFood')).rejects.toThrow(
        ImpossibleConversionError
      );
    });

    it('throws ImpossibleConversionError for weight to count', async () => {
      await expect(converter.convert(100, 'g', 'Stück', 'SomeFood')).rejects.toThrow(
        ImpossibleConversionError
      );
    });
  });

  describe('normalizeToBaseUnit - cross-category with density', () => {
    it('normalizes TL Mehl to ml (base unit)', async () => {
      const result = await converter.normalizeToBaseUnit(1, 'TL', 'Mehl');
      expect(result).toEqual({ quantity: 5, unit: 'ml' });
    });

    it('normalizes kg to g (base unit for weight)', async () => {
      const result = await converter.normalizeToBaseUnit(2, 'kg');
      expect(result).toEqual({ quantity: 2000, unit: 'g' });
    });
  });

  describe('convert - missing ingredient density', () => {
    it('throws ImpossibleConversionError without ingredientName for cross-category', async () => {
      await expect(converter.convert(1, 'TL', 'g')).rejects.toThrow(ImpossibleConversionError);
    });

    it('throws MissingDensityError for volumeToWeight with missing density per unit', async () => {
      // Öl has TL and EL but no ml density
      await expect(converter.convert(100, 'ml', 'g', 'Öl')).rejects.toThrow(MissingDensityError);
    });
  });

  describe('normalizeToBaseUnit - error handling', () => {
    it('throws UnknownUnitError for unknown unit', async () => {
      await expect(converter.normalizeToBaseUnit(1, 'unknown')).rejects.toThrow(UnknownUnitError);
    });
  });

  describe('convert - additional edge cases', () => {
    it('converts between different volume units with multiple steps', async () => {
      // EL to ml conversion
      const result = await converter.convert(2, 'EL', 'ml');
      expect(result).toBeCloseTo(30, 0);
    });

    it('converts multiple density ingredients to verify consistency', async () => {
      // Test Butter which has different density than Mehl
      const result = await converter.convert(1, 'EL', 'g', 'Butter');
      expect(result).toBeCloseTo(15, 1);
    });

    it('converts Honig (honey) volume to weight', async () => {
      const result = await converter.convert(1, 'TL', 'g', 'Honig');
      expect(result).toBeCloseTo(7, 1);
    });

    it('normalizes l to ml (base unit in volume)', async () => {
      const result = await converter.normalizeToBaseUnit(1, 'l');
      expect(result).toEqual({ quantity: 1000, unit: 'ml' });
    });

    it('normalizes EL to ml with cross-category ingredient', async () => {
      const result = await converter.normalizeToBaseUnit(1, 'EL', 'Zucker');
      expect(result.unit).toBe('ml');
      expect(result.quantity).toBeCloseTo(15, 1);
    });

    it('converts kg Honig to ml', async () => {
      // Honig: 1.4 g/ml, so 1000g = 714ml
      const result = await converter.convert(1, 'kg', 'ml', 'Honig');
      expect(result).toBeCloseTo(714, 0);
    });

    it('converts g Öl to ml', async () => {
      // Öl: 0.9 g/ml (from Butter density), so 9g = 10ml
      const result = await converter.convert(9, 'g', 'ml', 'Butter');
      expect(result).toBeCloseTo(10, 0);
    });

    it('throws UnknownUnitError in normalizeToBaseUnit for unknown unit', async () => {
      await expect(converter.normalizeToBaseUnit(1, 'invalidUnit')).rejects.toThrow(
        UnknownUnitError
      );
    });

    it('converts g to kg (weight normalization)', async () => {
      const result = await converter.convert(2000, 'g', 'kg');
      expect(result).toBeCloseTo(2, 1);
    });
  });
});
