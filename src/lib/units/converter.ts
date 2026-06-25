import { getDb } from '@/lib/db/init';
import {
  Unit,
  IngredientDensity,
  ConversionResult,
  UnknownUnitError,
  ImpossibleConversionError,
  MissingDensityError,
} from './types';
import { UNIT_CATEGORIES } from './constants';

export class UnitConverter {
  private units: Map<string, Unit> = new Map();
  private conversions: Map<string, number> = new Map();
  private densities: Map<string, IngredientDensity[]> = new Map();

  async initialize(): Promise<void> {
    const db = getDb();

    // Load units
    const unitRows = db.prepare('SELECT * FROM units').all() as Unit[];
    unitRows.forEach((unit) => {
      this.units.set(unit.abbreviation, unit);
    });

    // Load conversions
    const conversionRows = db
      .prepare(
        `SELECT u1.abbreviation as from_unit, u2.abbreviation as to_unit, uc.conversion_factor
         FROM unit_conversions uc
         JOIN units u1 ON uc.from_unit_id = u1.id
         JOIN units u2 ON uc.to_unit_id = u2.id`
      )
      .all() as { from_unit: string; to_unit: string; conversion_factor: number }[];
    conversionRows.forEach((conv) => {
      this.conversions.set(`${conv.from_unit}->${conv.to_unit}`, conv.conversion_factor);
    });

    // Load densities
    const densityRows = db.prepare('SELECT * FROM ingredient_densities').all() as IngredientDensity[];
    densityRows.forEach((density) => {
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
    if (!this.units.has(fromUnit)) throw new UnknownUnitError(fromUnit);
    if (!this.units.has(toUnit)) throw new UnknownUnitError(toUnit);

    const from = this.units.get(fromUnit)!;
    const to = this.units.get(toUnit)!;

    if (from.category === to.category) {
      return this.convertSameCategory(quantity, fromUnit, toUnit);
    }

    if (!ingredientName) {
      throw new ImpossibleConversionError(fromUnit, toUnit);
    }

    return this.convertCrossCategory(quantity, fromUnit, toUnit, ingredientName);
  }

  private convertSameCategory(quantity: number, fromUnit: string, toUnit: string): number {
    const factor = this.conversions.get(`${fromUnit}->${toUnit}`);
    if (factor === undefined) throw new ImpossibleConversionError(fromUnit, toUnit);
    return quantity * factor;
  }

  private convertCrossCategory(
    quantity: number,
    fromUnit: string,
    toUnit: string,
    ingredientName: string
  ): number {
    const from = this.units.get(fromUnit)!;
    const to = this.units.get(toUnit)!;

    const isVolumeToWeight =
      from.category === UNIT_CATEGORIES.VOLUME && to.category === UNIT_CATEGORIES.WEIGHT;
    const isWeightToVolume =
      from.category === UNIT_CATEGORIES.WEIGHT && to.category === UNIT_CATEGORIES.VOLUME;

    if (!isVolumeToWeight && !isWeightToVolume) {
      throw new ImpossibleConversionError(fromUnit, toUnit, ingredientName);
    }

    const densityKey = ingredientName.toLowerCase();
    const densities = this.densities.get(densityKey);
    if (!densities || densities.length === 0) {
      throw new MissingDensityError(ingredientName);
    }

    if (isVolumeToWeight) {
      return this.volumeToWeight(quantity, fromUnit, ingredientName, densities);
    }
    return this.weightToVolume(quantity, fromUnit, ingredientName, densities);
  }

  private volumeToWeight(
    quantity: number,
    volumeUnit: string,
    ingredientName: string,
    densities: IngredientDensity[]
  ): number {
    const unitData = this.units.get(volumeUnit)!;
    const density = densities.find((d) => d.volume_unit_id === unitData.id);
    if (!density) throw new MissingDensityError(ingredientName);
    return quantity * density.weight_in_grams;
  }

  private weightToVolume(
    quantity: number,
    weightUnit: string,
    ingredientName: string,
    densities: IngredientDensity[]
  ): number {
    // Normalize weight to grams first
    const weightInGrams = weightUnit === 'kg' ? quantity * 1000 : quantity;

    // Find density per ml for the ingredient
    const mlUnit = this.units.get('ml');
    if (!mlUnit) throw new MissingDensityError(ingredientName);

    const mlDensity = densities.find((d) => d.volume_unit_id === mlUnit.id);
    if (!mlDensity) throw new MissingDensityError(ingredientName);

    return weightInGrams / mlDensity.weight_in_grams;
  }

  async normalizeToBaseUnit(
    quantity: number,
    unit: string,
    ingredientName?: string
  ): Promise<ConversionResult> {
    if (!this.units.has(unit)) throw new UnknownUnitError(unit);

    const unitData = this.units.get(unit)!;
    if (unit === unitData.base_unit) return { quantity, unit };

    const normalizedQuantity = await this.convert(quantity, unit, unitData.base_unit, ingredientName);
    return { quantity: normalizedQuantity, unit: unitData.base_unit };
  }

  async getConversionFactor(fromUnit: string, toUnit: string): Promise<number> {
    if (!this.units.has(fromUnit)) throw new UnknownUnitError(fromUnit);
    if (!this.units.has(toUnit)) throw new UnknownUnitError(toUnit);

    const factor = this.conversions.get(`${fromUnit}->${toUnit}`);
    if (factor === undefined) throw new ImpossibleConversionError(fromUnit, toUnit);
    return factor;
  }
}
