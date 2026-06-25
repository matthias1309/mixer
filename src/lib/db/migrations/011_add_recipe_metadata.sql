-- Add recipe metadata & REWE tag vocabulary (REQ-016)
-- difficulty/total_time_minutes/meal_type are scalar columns on recipes;
-- recipe_tags is an n:m relation against the fixed vocabulary in
-- src/lib/constants.ts (no free-text tags, prevents filter drift).
-- Additive only: existing recipes keep NULL metadata and zero tags.

ALTER TABLE recipes ADD COLUMN difficulty TEXT;
ALTER TABLE recipes ADD COLUMN total_time_minutes INTEGER;
ALTER TABLE recipes ADD COLUMN meal_type TEXT;

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id INTEGER NOT NULL,
  tag       TEXT    NOT NULL,
  PRIMARY KEY (recipe_id, tag),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag);
