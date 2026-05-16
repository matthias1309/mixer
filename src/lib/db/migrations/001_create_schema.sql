-- Create schema for both SQLite and PostgreSQL
-- This file must work with both database systems

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Recipes table (with deduplication support)
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  instructions TEXT,
  servings INTEGER DEFAULT 1,
  creator_id INTEGER NOT NULL,
  canonical_id INTEGER,
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (canonical_id) REFERENCES recipes(id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_creator ON recipes(creator_id);
CREATE INDEX IF NOT EXISTS idx_recipes_canonical ON recipes(canonical_id);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),

  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
