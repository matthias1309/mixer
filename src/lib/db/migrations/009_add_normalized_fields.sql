-- Add normalized fields to ingredients table
-- Supports both SQLite and PostgreSQL

ALTER TABLE ingredients ADD COLUMN normalized_quantity NUMERIC(10, 2);
ALTER TABLE ingredients ADD COLUMN normalized_unit VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_ingredients_normalized ON ingredients(normalized_quantity, normalized_unit);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_normalized ON ingredients(recipe_id, normalized_unit);
