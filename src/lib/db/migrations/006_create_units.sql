-- Create units table for unit management
-- Supports both SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  abbreviation VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK(category IN ('volume', 'weight', 'count', 'pinch')),
  base_unit VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_units_abbreviation ON units(abbreviation);
CREATE INDEX IF NOT EXISTS idx_units_category ON units(category);
