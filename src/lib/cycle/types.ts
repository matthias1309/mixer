export interface CycleInfo {
  last_menstruation_date: Date;
  cycle_length_days: number;
}

export interface CyclePhase {
  id?: number;
  name: string;
  day_start: number;
  day_end: number;
  description: string;
}

export interface CurrentPhase {
  phase: CyclePhase;
  day_of_cycle: number;
  cycle_progress: number; // 0-1
}

export interface UserCycle {
  id: number;
  user_id: number;
  last_menstruation_date: Date;
  cycle_length_days: number;
  created_at: Date;
  updated_at: Date;
}

export interface CycleLog {
  id: number;
  user_id: number;
  log_date: Date;
  phase: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CycleInfoResponse {
  last_menstruation_date: Date;
  cycle_length_days: number;
  current_phase: CurrentPhase;
}
