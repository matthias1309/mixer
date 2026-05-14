-- src/lib/db/migrations/002_create_nutrition_tables.sql
CREATE TABLE IF NOT EXISTS nutrition_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  base_unit VARCHAR(50) NOT NULL DEFAULT 'g',
  base_size INTEGER NOT NULL DEFAULT 100,

  -- Nutrients per base_size (100g standard)
  kcal DECIMAL(8,2),
  sugar DECIMAL(8,2),
  fat DECIMAL(8,2),
  protein DECIMAL(8,2),
  carbohydrates DECIMAL(8,2),
  fiber DECIMAL(8,2),
  sodium DECIMAL(8,2),
  calcium DECIMAL(8,2),
  vitamin_d DECIMAL(8,2),
  magnesium DECIMAL(8,2),
  vitamin_b6 DECIMAL(8,2),
  vitamin_b12 DECIMAL(8,2),
  vitamin_e DECIMAL(8,2),
  zinc DECIMAL(8,2),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nutrition_ingredients_name ON nutrition_ingredients(name);
CREATE INDEX IF NOT EXISTS idx_nutrition_ingredients_category ON nutrition_ingredients(category);

CREATE TABLE IF NOT EXISTS ingredient_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL REFERENCES nutrition_ingredients(id) ON DELETE CASCADE,
  unit VARCHAR(50) NOT NULL,
  amount_in_base_unit DECIMAL(10,3) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(ingredient_id, unit)
);

CREATE INDEX IF NOT EXISTS idx_conversions_ingredient ON ingredient_conversions(ingredient_id);

CREATE TABLE IF NOT EXISTS recipe_nutrients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL UNIQUE REFERENCES recipes(id) ON DELETE CASCADE,
  portions INTEGER NOT NULL DEFAULT 1,

  total_kcal DECIMAL(10,2),
  total_sugar DECIMAL(10,2),
  total_fat DECIMAL(10,2),
  total_protein DECIMAL(10,2),
  total_carbohydrates DECIMAL(10,2),
  total_fiber DECIMAL(10,2),
  total_sodium DECIMAL(10,2),
  total_calcium DECIMAL(10,2),
  total_vitamin_d DECIMAL(10,2),
  total_magnesium DECIMAL(10,2),
  total_vitamin_b6 DECIMAL(10,2),
  total_vitamin_b12 DECIMAL(10,2),
  total_vitamin_e DECIMAL(10,2),
  total_zinc DECIMAL(10,2),

  per_portion_kcal DECIMAL(10,2),
  per_portion_sugar DECIMAL(10,2),
  per_portion_fat DECIMAL(10,2),
  per_portion_protein DECIMAL(10,2),
  per_portion_carbohydrates DECIMAL(10,2),
  per_portion_fiber DECIMAL(10,2),
  per_portion_sodium DECIMAL(10,2),
  per_portion_calcium DECIMAL(10,2),
  per_portion_vitamin_d DECIMAL(10,2),
  per_portion_magnesium DECIMAL(10,2),
  per_portion_vitamin_b6 DECIMAL(10,2),
  per_portion_vitamin_b12 DECIMAL(10,2),
  per_portion_vitamin_e DECIMAL(10,2),
  per_portion_zinc DECIMAL(10,2),

  last_calculated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recipe_nutrients_recipe ON recipe_nutrients(recipe_id);
