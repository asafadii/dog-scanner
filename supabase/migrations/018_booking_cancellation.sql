-- Sprint: booking cancellation support

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'));

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS
  cancelled_by text CHECK (cancelled_by IN ('staff', 'client')) DEFAULT NULL;
