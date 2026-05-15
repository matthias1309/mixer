CREATE TABLE IF NOT EXISTS phase_nutrient_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_name VARCHAR(50) NOT NULL,
  nutrient_name VARCHAR(100) NOT NULL,
  daily_value_amount DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  priority VARCHAR(20) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(phase_name, nutrient_name)
);

CREATE INDEX idx_phase_targets_phase ON phase_nutrient_targets(phase_name);

CREATE TABLE IF NOT EXISTS recipe_phase_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  phase_name VARCHAR(50) NOT NULL,
  score DECIMAL(5,2),
  matched_nutrients VARCHAR(500),
  reason TEXT,

  last_calculated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(recipe_id, phase_name)
);

CREATE INDEX idx_recipe_scores_recipe ON recipe_phase_scores(recipe_id);
CREATE INDEX idx_recipe_scores_phase ON recipe_phase_scores(phase_name);
