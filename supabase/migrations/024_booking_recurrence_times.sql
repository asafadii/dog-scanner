ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS
  arrival_time time DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS
  end_time time DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.booking_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('daycare','boarding')),
  recurrence_freq text NOT NULL CHECK (recurrence_freq IN ('weekly','biweekly')),
  recurrence_days_of_week int[] NOT NULL,
  recurrence_start_date date NOT NULL,
  recurrence_end_date date NOT NULL,
  arrival_time time DEFAULT NULL,
  end_time time DEFAULT NULL,
  transport_required boolean NOT NULL DEFAULT false,
  food_source text CHECK (food_source IN ('own','facility')) DEFAULT NULL,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  constraint booking_series_date_range_check CHECK (recurrence_end_date >= recurrence_start_date)
);

CREATE INDEX IF NOT EXISTS booking_series_facility_id_idx ON public.booking_series (facility_id);
CREATE INDEX IF NOT EXISTS booking_series_dog_id_idx ON public.booking_series (dog_id);

DROP TRIGGER IF EXISTS booking_series_set_updated_at ON public.booking_series;
CREATE TRIGGER booking_series_set_updated_at
  BEFORE UPDATE ON public.booking_series
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.booking_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_series_select_facility_members" ON public.booking_series
  FOR SELECT USING (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "booking_series_insert_facility_members" ON public.booking_series
  FOR INSERT WITH CHECK (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid())
    AND NOT public.is_facility_write_blocked(facility_id));
CREATE POLICY "booking_series_update_facility_members" ON public.booking_series
  FOR UPDATE USING (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid())
    AND NOT public.is_facility_write_blocked(facility_id));

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS
  series_id uuid REFERENCES public.booking_series(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS
  series_occurrence_date date DEFAULT NULL;

CREATE INDEX IF NOT EXISTS bookings_series_id_idx ON public.bookings (series_id);

CREATE POLICY "booking_series_select_linked_client_accounts" ON public.booking_series
  FOR SELECT USING (
    client_id IN (SELECT client_id FROM public.client_account_links WHERE client_account_id = auth.uid())
  );
