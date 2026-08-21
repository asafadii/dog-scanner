ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS
  food_source text CHECK (food_source IN ('own','facility')) DEFAULT NULL;

-- Do NOT drop or stop referencing dogs.feeding_source in this migration
-- — that column stays in the schema; only future migrations/app code
-- change how it's used. This task is additive only.
