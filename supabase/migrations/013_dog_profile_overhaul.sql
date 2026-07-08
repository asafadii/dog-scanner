-- Feeding restructure
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS
  feeding_source text CHECK (feeding_source IN ('own', 'facility'))
  DEFAULT NULL;

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS
  feeding_meals_per_day integer CHECK (feeding_meals_per_day BETWEEN 1 AND 3)
  DEFAULT NULL;

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS
  feeding_notes text DEFAULT NULL;

-- Keep existing feeding column for backward compat — do NOT drop it
-- It will be ignored going forward; new data uses feeding_source/meals/notes

-- Remove overnight from dogs — now booking-driven
ALTER TABLE dogs DROP COLUMN IF EXISTS overnight;

-- Emergency phone on clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  emergency_phone text DEFAULT NULL;
