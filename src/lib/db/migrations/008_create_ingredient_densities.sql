-- Create ingredient_densities table for density data for volume-weight conversions
-- Supports both SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS ingredient_densities (
  id SERIAL PRIMARY KEY,
  ingredient_name VARCHAR(255) NOT NULL,
  volume_unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  weight_in_grams NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ingredient_name, volume_unit_id)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_densities_name ON ingredient_densities(ingredient_name);
CREATE INDEX IF NOT EXISTS idx_ingredient_densities_unit ON ingredient_densities(volume_unit_id);
