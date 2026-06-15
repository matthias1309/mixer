-- Add image_path column to recipes (REQ-009)
-- Stores the file name of a recipe photo kept on disk under
-- UPLOAD_CONFIG.UPLOAD_DIR (.data/uploads/recipes). The binary itself is
-- never stored in the database. Idempotency is handled by the migration
-- runner, which skips duplicate-column errors on ALTER TABLE ADD COLUMN
-- for both SQLite and PostgreSQL.

ALTER TABLE recipes ADD COLUMN image_path VARCHAR(255);
