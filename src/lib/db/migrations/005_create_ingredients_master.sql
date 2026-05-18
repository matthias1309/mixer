-- Create ingredients_master table for ingredient reference data
CREATE TABLE IF NOT EXISTS ingredients_master (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  base_unit VARCHAR(50) DEFAULT 'g',
  base_size DECIMAL(10, 2) DEFAULT 100,
  kcal DECIMAL(10, 2),
  sugar DECIMAL(10, 2),
  fat DECIMAL(10, 2),
  protein DECIMAL(10, 2),
  carbohydrates DECIMAL(10, 2),
  fiber DECIMAL(10, 2),
  salt DECIMAL(10, 2),
  sodium DECIMAL(10, 2),
  calcium DECIMAL(10, 2),
  vitamin_d DECIMAL(10, 2),
  magnesium DECIMAL(10, 2),
  vitamin_b6 DECIMAL(10, 2),
  vitamin_b12 DECIMAL(10, 2),
  vitamin_e DECIMAL(10, 2),
  iron DECIMAL(10, 2),
  zinc DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingredients_master_name ON ingredients_master(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_master_category ON ingredients_master(category);
