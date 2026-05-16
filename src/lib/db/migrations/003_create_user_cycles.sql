-- Create user cycle tracking table
CREATE TABLE IF NOT EXISTS user_cycles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  last_menstruation_date VARCHAR(10) NOT NULL,
  cycle_length_days INTEGER NOT NULL DEFAULT 28,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_cycles_user ON user_cycles(user_id);
