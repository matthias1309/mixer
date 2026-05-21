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
