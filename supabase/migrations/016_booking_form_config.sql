-- Public booking form field configuration (staff Settings)

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  booking_form_config jsonb DEFAULT NULL;
