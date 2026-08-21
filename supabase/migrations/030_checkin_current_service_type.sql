ALTER TABLE public.dog_checkins ADD COLUMN IF NOT EXISTS
  current_service_type text CHECK (current_service_type IN ('daycare','boarding')) DEFAULT NULL;

UPDATE public.dog_checkins dc
SET current_service_type = COALESCE(
  (SELECT b.service_type FROM public.bookings b WHERE b.id = dc.booking_id),
  'daycare'
)
WHERE dc.checked_out_at IS NULL AND dc.current_service_type IS NULL;
