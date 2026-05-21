-- Seed data for units, conversions, and ingredient densities

-- Volume units
INSERT OR IGNORE INTO units (abbreviation, name, category, base_unit) VALUES
('TL', 'Teelöffel', 'volume', 'ml'),
('EL', 'Esslöffel', 'volume', 'ml'),
('ml', 'Milliliter', 'volume', 'ml'),
('l', 'Liter', 'volume', 'ml');

-- Weight units
INSERT OR IGNORE INTO units (abbreviation, name, category, base_unit) VALUES
('g', 'Gramm', 'weight', 'g'),
('kg', 'Kilogramm', 'weight', 'g');

-- Count/piece units
INSERT OR IGNORE INTO units (abbreviation, name, category, base_unit) VALUES
('Stück', 'Piece', 'count', 'count');

-- Pinch units
INSERT OR IGNORE INTO units (abbreviation, name, category, base_unit) VALUES
('Prise', 'Pinch', 'pinch', 'pinch');

-- Volume conversions
INSERT OR IGNORE INTO unit_conversions (from_unit_id, to_unit_id, conversion_factor) VALUES
(1, 2, 0.333),      -- 1 TL = 0.333 EL
(2, 1, 3.0),        -- 1 EL = 3 TL
(1, 3, 5.0),        -- 1 TL = 5 ml
(2, 3, 15.0),       -- 1 EL = 15 ml
(3, 1, 0.2),        -- 1 ml = 0.2 TL
(3, 2, 0.0667),     -- 1 ml = 0.0667 EL
(3, 4, 0.001),      -- 1 ml = 0.001 l
(4, 3, 1000.0);     -- 1 l = 1000 ml

-- Weight conversions
INSERT OR IGNORE INTO unit_conversions (from_unit_id, to_unit_id, conversion_factor) VALUES
(5, 6, 0.001),      -- 1 g = 0.001 kg
(6, 5, 1000.0);     -- 1 kg = 1000 g

-- Common ingredient densities (in grams per unit)
INSERT OR IGNORE INTO ingredient_densities (ingredient_name, volume_unit_id, weight_in_grams) VALUES
('Mehl', 1, 5.0),           -- 1 TL Mehl = 5g
('Mehl', 2, 15.0),          -- 1 EL Mehl = 15g
('Mehl', 3, 1.0),           -- 1 ml Mehl = 1g
('Zucker', 1, 8.0),         -- 1 TL Zucker = 8g
('Zucker', 2, 25.0),        -- 1 EL Zucker = 25g
('Zucker', 3, 0.8),         -- 1 ml Zucker = 0.8g
('Butter', 1, 5.0),         -- 1 TL Butter = 5g
('Butter', 2, 15.0),        -- 1 EL Butter = 15g
('Butter', 3, 0.9),         -- 1 ml Butter = 0.9g
('Honig', 1, 7.0),          -- 1 TL Honig = 7g
('Honig', 2, 20.0),         -- 1 EL Honig = 20g
('Honig', 3, 1.4),          -- 1 ml Honig = 1.4g
('Salz', 1, 6.0),           -- 1 TL Salz = 6g
('Salz', 2, 18.0),          -- 1 EL Salz = 18g
('Öl', 1, 5.0),             -- 1 TL Öl = 5g
('Öl', 2, 15.0);            -- 1 EL Öl = 15g
