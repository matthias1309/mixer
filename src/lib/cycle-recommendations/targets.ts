import { PHASE_NUTRIENT_TARGETS } from './constants';
import { PhaseNutrientTarget, PRIORITY_WEIGHTS } from './types';

export function getPhaseTargets(phase: string): PhaseNutrientTarget[] {
  const targets = PHASE_NUTRIENT_TARGETS[phase as keyof typeof PHASE_NUTRIENT_TARGETS];

  if (!targets) {
    throw new Error(`Unknown phase: ${phase}`);
  }

  return Object.entries(targets).map(([nutrient_name, target]) => ({
    nutrient_name,
    daily_value: target.daily_value,
    unit: target.unit,
    priority: target.priority,
    weight: PRIORITY_WEIGHTS[target.priority],
  }));
}

export function getAllPhaseTargets(): Record<string, PhaseNutrientTarget[]> {
  const phases = Object.keys(PHASE_NUTRIENT_TARGETS);
  const result: Record<string, PhaseNutrientTarget[]> = {};

  for (const phase of phases) {
    result[phase] = getPhaseTargets(phase);
  }

  return result;
}

export function validateTargets(): boolean {
  try {
    const phases = Object.keys(PHASE_NUTRIENT_TARGETS);
    for (const phase of phases) {
      getPhaseTargets(phase);
    }
    return true;
  } catch {
    return false;
  }
}
