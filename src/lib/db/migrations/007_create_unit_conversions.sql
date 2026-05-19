-- Create unit_conversions table for conversion factors between units
-- Supports both SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS unit_conversions (
  id SERIAL PRIMARY KEY,
  from_unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  to_unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  conversion_factor NUMERIC(10, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_unit_id, to_unit_id)
);

CREATE INDEX IF NOT EXISTS idx_unit_conversions_from ON unit_conversions(from_unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_conversions_to ON unit_conversions(to_unit_id);
