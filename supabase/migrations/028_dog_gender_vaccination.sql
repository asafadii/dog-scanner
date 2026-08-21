ALTER TABLE public.dogs DROP CONSTRAINT IF EXISTS dogs_sex_check;
ALTER TABLE public.dogs ADD CONSTRAINT dogs_sex_check
  CHECK (sex IS NULL OR sex IN ('male','female'));

ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS
  vaccination_expiry_date date DEFAULT NULL;

ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS
  vaccination_owner_week_before_email_sent_at timestamptz DEFAULT NULL;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS
  vaccination_owner_expired_email_sent_at timestamptz DEFAULT NULL;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS
  vaccination_facility_week_before_email_sent_at timestamptz DEFAULT NULL;
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS
  vaccination_facility_expired_email_sent_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS dogs_vaccination_expiry_date_idx
  ON public.dogs (vaccination_expiry_date) WHERE vaccination_expiry_date IS NOT NULL;
