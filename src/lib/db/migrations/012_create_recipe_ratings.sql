-- Recipe star ratings (REQ-018): one row per (user, recipe), enforced by the
-- composite PK rather than only app code (AC-018-01, AC-018-05). The CHECK
-- backs up the 1..5 app validation. The recipe index supports the
-- AVG/COUNT aggregate join used by list/detail queries and minRating/sort.

CREATE TABLE IF NOT EXISTS recipe_ratings (
  user_id    INTEGER NOT NULL,
  recipe_id  INTEGER NOT NULL,
  stars      INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
