import { calculateCurrentPhase, calculatePhaseOnDate } from '@/lib/cycle/calculator';
import { CYCLE_PHASES } from '@/lib/cycle/constants';

describe('Cycle Phase Calculator', () => {
  // Test date: 2026-05-14 (example)
  const testDate = new Date('2026-05-14');

  // TC-010-01
  it('calculates current phase for 28-day cycle', () => {
    const lastMenstruation = new Date('2026-04-30'); // 14 days ago
    const result = calculateCurrentPhase(
      { last_menstruation_date: lastMenstruation, cycle_length_days: 28 },
      testDate
    );

    expect(result.day_of_cycle).toBe(14);
    expect(result.phase.name).toBe(CYCLE_PHASES.OVULATION);
    expect(result.cycle_progress).toBeCloseTo(0.5, 1);
  });

  // TC-010-02
  it('handles day 1 of cycle', () => {
    const lastMenstruation = testDate; // Today is day 1
    const result = calculateCurrentPhase(
      { last_menstruation_date: lastMenstruation, cycle_length_days: 28 },
      testDate
    );

    expect(result.day_of_cycle).toBe(0);
    expect(result.phase.name).toBe(CYCLE_PHASES.MENSTRUATION);
  });

  // TC-010-03
  it('calculates phase on specific date', () => {
    const lastMenstruation = new Date('2026-04-30');
    const queryDate = new Date('2026-05-04'); // Day 4 (last day of menstruation, 0-indexed)

    const result = calculatePhaseOnDate(
      { last_menstruation_date: lastMenstruation, cycle_length_days: 28 },
      queryDate
    );

    expect(result.day_of_cycle).toBe(4);
    expect(result.phase.name).toBe(CYCLE_PHASES.MENSTRUATION);
  });

  // TC-010-04
  it('handles different cycle lengths', () => {
    const lastMenstruation = new Date('2026-04-30');
    const result35day = calculateCurrentPhase(
      { last_menstruation_date: lastMenstruation, cycle_length_days: 35 },
      testDate
    );

    expect(result35day.day_of_cycle).toBe(14);
    const cycleProgress = 14 / 35;
    expect(result35day.cycle_progress).toBeCloseTo(cycleProgress, 2);
  });
});
