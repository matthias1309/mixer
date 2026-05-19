import { ScaledIngredient } from './types';
import { UNIT_PROMOTION_RULES, ROUNDING_RULES } from './constants';

export class RecipeScaler {
  scaleIngredient(ingredient: ScaledIngredient, scaleFactor: number): ScaledIngredient {
    if (scaleFactor <= 0) {
      throw new Error('Scale factor must be positive');
    }

    if (ingredient.unit === null) {
      return { ...ingredient, quantity: ingredient.quantity * scaleFactor };
    }

    const newQuantity = ingredient.quantity * scaleFactor;
    const { quantity, unit } = this.promoteUnit(newQuantity, ingredient.unit);

    return {
      ...ingredient,
      quantity: this.roundQuantity(quantity, unit),
      unit,
    };
  }

  promoteUnit(quantity: number, unit: string): { quantity: number; unit: string } {
    if (unit === 'Stück' || unit === 'Prise') {
      return { quantity, unit };
    }

    const rule = UNIT_PROMOTION_RULES[unit as keyof typeof UNIT_PROMOTION_RULES];
    if (!rule || quantity < rule.threshold) {
      return { quantity, unit };
    }

    const conversionFactors: Record<string, number> = {
      'TL->EL': 1 / 3,
      'EL->ml': 15,
      'ml->l': 1 / 1000,
    };

    const factorKey = `${unit}->${rule.promoteToUnit}`;
    const factor = conversionFactors[factorKey];
    if (!factor) return { quantity, unit };

    return { quantity: quantity * factor, unit: rule.promoteToUnit };
  }

  private roundQuantity(quantity: number, unit: string): number {
    if (unit === 'Stück' || unit === 'Prise') {
      return Math.round(quantity);
    }

    if (unit === 'g') {
      const precision = quantity >= ROUNDING_RULES.weight_large.threshold
        ? ROUNDING_RULES.weight_large.precision
        : ROUNDING_RULES.weight_small.precision;
      return Math.round(quantity / precision) * precision;
    }

    if (unit === 'kg') {
      return Math.round(quantity * 100) / 100;
    }

    if (unit === 'ml') {
      const precision = quantity >= ROUNDING_RULES.volume_large.threshold
        ? ROUNDING_RULES.volume_large.precision
        : ROUNDING_RULES.volume_small.precision;
      return Math.round(quantity / precision) * precision;
    }

    if (unit === 'l') {
      return Math.round(quantity * 100) / 100;
    }

    if (unit === 'TL' || unit === 'EL') {
      return Math.round(quantity * 4) / 4;
    }

    return quantity;
  }
}
