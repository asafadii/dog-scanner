-- Facility code + soft-delete archive for dogs/clients

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  facility_code text UNIQUE DEFAULT NULL;

ALTER TABLE dogs ADD COLUMN IF NOT EXISTS
  archived_at timestamptz DEFAULT NULL;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  archived_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS dogs_archived_at_idx
  ON public.dogs(archived_at) WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS clients_archived_at_idx
  ON public.clients(archived_at) WHERE archived_at IS NOT NULL;
