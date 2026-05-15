export const CYCLE_PHASES = {
  MENSTRUATION: 'Menstruation',
  FOLLICULAR: 'Follicular',
  OVULATION: 'Ovulation',
  LUTEAL: 'Luteal',
} as const;

export const PHASE_DEFINITIONS = [
  {
    name: CYCLE_PHASES.MENSTRUATION,
    day_start: 0,
    day_end: 4,
    description: 'Bleeding phase, hormone levels low',
  },
  {
    name: CYCLE_PHASES.FOLLICULAR,
    day_start: 5,
    day_end: 12,
    description: 'Follicle develops, estrogen rises',
  },
  {
    name: CYCLE_PHASES.OVULATION,
    day_start: 13,
    day_end: 15,
    description: 'Egg release, luteinizing hormone surge',
  },
  {
    name: CYCLE_PHASES.LUTEAL,
    day_start: 16,
    day_end: 27,
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
