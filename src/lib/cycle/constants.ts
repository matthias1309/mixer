export const CYCLE_PHASES = {
  MENSTRUATION: 'Menstruation',
  FOLLICULAR: 'Follicular',
  OVULATION: 'Ovulation',
  LUTEAL: 'Luteal',
} as const;

export const PHASE_DEFINITIONS = [
  {
    name: CYCLE_PHASES.MENSTRUATION,
    day_start: 1,
    day_end: 5,
    description: 'Bleeding phase, hormone levels low',
  },
  {
    name: CYCLE_PHASES.FOLLICULAR,
    day_start: 1,
    day_end: 13,
    description: 'Follicle develops, estrogen rises',
  },
  {
    name: CYCLE_PHASES.OVULATION,
    day_start: 12,
    day_end: 16,
    description: 'Egg release, luteinizing hormone surge',
  },
  {
    name: CYCLE_PHASES.LUTEAL,
    day_start: 15,
    day_end: 28,
    description: 'Corpus luteum forms, progesterone rises',
  },
] as const;

export const CYCLE_LENGTH_MIN = 21;
export const CYCLE_LENGTH_MAX = 35;
export const DEFAULT_CYCLE_LENGTH = 28;

export const PHASE_PRIORITY = {
  [CYCLE_PHASES.OVULATION]: 4,
  [CYCLE_PHASES.FOLLICULAR]: 3,
  [CYCLE_PHASES.LUTEAL]: 3,
  [CYCLE_PHASES.MENSTRUATION]: 1,
} as const;
