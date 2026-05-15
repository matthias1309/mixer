CREATE TABLE IF NOT EXISTS user_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  last_menstruation_date DATE NOT NULL,
  cycle_length_days INTEGER NOT NULL DEFAULT 28,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_cycles_user ON user_cycles(user_id);

CREATE TABLE IF NOT EXISTS cycle_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  day_start INTEGER NOT NULL,
  day_end INTEGER NOT NULL,
  description TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cycle_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  phase VARCHAR(50),
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, log_date)
);

CREATE INDEX idx_cycle_logs_user ON cycle_logs(user_id);
CREATE INDEX idx_cycle_logs_date ON cycle_logs(log_date);
