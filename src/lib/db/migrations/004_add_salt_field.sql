-- Add salt nutrient field to ingredient and recipe-nutrients tables
-- Salt is tracked separately from Sodium to provide more granular nutritional data.
-- Idempotency is handled by the migration runner (checks existing columns before ALTER).

ALTER TABLE nutrition_ingredients ADD COLUMN salt DECIMAL(8,2);

ALTER TABLE recipe_nutrients ADD COLUMN total_salt DECIMAL(10,2);
ALTER TABLE recipe_nutrients ADD COLUMN per_portion_salt DECIMAL(10,2);
