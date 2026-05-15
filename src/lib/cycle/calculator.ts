import { CycleInfo, CurrentPhase, CyclePhase } from './types';
import { PHASE_DEFINITIONS, PHASE_PRIORITY } from './constants';

function getDayOfCycle(
  lastMenstruationDate: Date,
  cycleLengthDays: number,
  date: Date
): number {
  const diffMs = date.getTime() - lastMenstruationDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays % cycleLengthDays;
}

function findPhaseForDay(dayOfCycle: number): CyclePhase {
  // Check overlapping phases by priority
  const phasesByPriority = PHASE_DEFINITIONS.sort(
    (a, b) => (PHASE_PRIORITY[b.name as keyof typeof PHASE_PRIORITY] || 0) -
              (PHASE_PRIORITY[a.name as keyof typeof PHASE_PRIORITY] || 0)
  );

  for (const phase of phasesByPriority) {
    if (dayOfCycle >= phase.day_start && dayOfCycle <= phase.day_end) {
      return phase as CyclePhase;
    }
  }

  // Fallback to first matching phase
  return (PHASE_DEFINITIONS.find(
    p => dayOfCycle >= p.day_start && dayOfCycle <= p.day_end
  ) || PHASE_DEFINITIONS[0]) as CyclePhase;
}

export function calculateCurrentPhase(
  cycleInfo: CycleInfo,
  today: Date = new Date()
): CurrentPhase {
  const dayOfCycle = getDayOfCycle(
    cycleInfo.last_menstruation_date,
    cycleInfo.cycle_length_days,
    today
  );

  const phase = findPhaseForDay(dayOfCycle);
  const cycleProgress = dayOfCycle / cycleInfo.cycle_length_days;

  return {
    phase,
    day_of_cycle: dayOfCycle,
    cycle_progress: cycleProgress,
  };
}

export function calculatePhaseOnDate(
  cycleInfo: CycleInfo,
  date: Date
): CurrentPhase {
  return calculateCurrentPhase(cycleInfo, date);
}

export function getDayOfCycleForDate(
  lastMenstruationDate: Date,
  cycleLengthDays: number,
  date: Date
): number {
  return getDayOfCycle(lastMenstruationDate, cycleLengthDays, date);
}

export function validateCycleInfo(info: Partial<CycleInfo>): string[] {
  const errors: string[] = [];

  if (!info.last_menstruation_date) {
    errors.push('Last menstruation date is required');
  } else if (info.last_menstruation_date > new Date()) {
    errors.push('Last menstruation date cannot be in the future');
  }

  if (!info.cycle_length_days ||
      info.cycle_length_days < 21 ||
      info.cycle_length_days > 35) {
    errors.push('Cycle length must be between 21 and 35 days');
  }

  return errors;
}
