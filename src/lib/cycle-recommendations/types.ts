export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  CRITICAL: 1.0,
  HIGH: 0.75,
  MEDIUM: 0.5,
};

export interface PhaseNutrientTarget {
  nutrient_name: string;
  daily_value: number;
  unit: string;
  priority: Priority;
  weight: number;
}

export interface RecipePhaseScore {
  recipe_id: number;
  phase_name: string;
  score: number;
  matched_nutrients: string[];
  reason: string;
  last_calculated: Date;
}

export interface RecipeScoredForPhase {
  recipe_id: number;
  name: string;
  score: number;
  phase: string;
  matched_nutrients: string[];
  reason: string;
  per_portion?: Record<string, number>;
}

export interface FilterOptions {
  phase: string;
  min_score?: number;
  sort_by?: 'score' | 'name' | 'kcal';
  limit?: number;
}

export interface NutrientMap {
  [key: string]: number;
}
