-- Public embed booking submissions + account-link tracking

CREATE TABLE IF NOT EXISTS public.embed_booking_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
  succeeded boolean NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS embed_booking_attempts_ip_idx
  ON public.embed_booking_attempts (ip_address, attempted_at DESC);

ALTER TABLE public.embed_booking_attempts ENABLE ROW LEVEL SECURITY;

-- Track bookings created via the public embed, for account-linking
-- once the owner completes signup
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  pending_account_link boolean NOT NULL DEFAULT false;
