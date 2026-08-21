CREATE TABLE IF NOT EXISTS public.pass_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('daycare','boarding')),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  occasions integer NOT NULL CHECK (occasions > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pass_types_facility_id_idx ON public.pass_types (facility_id);

DROP TRIGGER IF EXISTS pass_types_set_updated_at ON public.pass_types;
CREATE TRIGGER pass_types_set_updated_at
  BEFORE UPDATE ON public.pass_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pass_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pass_types_select_facility_members" ON public.pass_types
  FOR SELECT USING (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "pass_types_insert_facility_members" ON public.pass_types
  FOR INSERT WITH CHECK (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid())
    AND NOT public.is_facility_write_blocked(facility_id));
CREATE POLICY "pass_types_update_facility_members" ON public.pass_types
  FOR UPDATE USING (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid())
    AND NOT public.is_facility_write_blocked(facility_id));

CREATE TABLE IF NOT EXISTS public.client_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  pass_type_id uuid NOT NULL REFERENCES public.pass_types(id) ON DELETE RESTRICT,
  service_type text NOT NULL CHECK (service_type IN ('daycare','boarding')),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  occasions_total integer NOT NULL CHECK (occasions_total > 0),
  occasions_used integer NOT NULL DEFAULT 0 CHECK (occasions_used >= 0),
  expiry_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','exhausted','expired','cancelled')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  constraint client_passes_usage_check CHECK (occasions_used <= occasions_total)
);
-- client_id ON DELETE CASCADE is intentional and client-confirmed:
-- deleting a client deletes their passes too, no blocking.

CREATE INDEX IF NOT EXISTS client_passes_client_id_idx ON public.client_passes (client_id);
CREATE INDEX IF NOT EXISTS client_passes_facility_id_idx ON public.client_passes (facility_id);
CREATE INDEX IF NOT EXISTS client_passes_status_idx ON public.client_passes (facility_id, status);

DROP TRIGGER IF EXISTS client_passes_set_updated_at ON public.client_passes;
CREATE TRIGGER client_passes_set_updated_at
  BEFORE UPDATE ON public.client_passes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.client_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_passes_select_facility_members" ON public.client_passes
  FOR SELECT USING (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "client_passes_insert_facility_members" ON public.client_passes
  FOR INSERT WITH CHECK (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid())
    AND NOT public.is_facility_write_blocked(facility_id));
CREATE POLICY "client_passes_update_facility_members" ON public.client_passes
  FOR UPDATE USING (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid())
    AND NOT public.is_facility_write_blocked(facility_id));

CREATE TABLE IF NOT EXISTS public.pass_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_pass_id uuid NOT NULL REFERENCES public.client_passes(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  units_consumed integer NOT NULL DEFAULT 1 CHECK (units_consumed > 0),
  used_at timestamptz NOT NULL DEFAULT now(),
  unique (payment_id)
);

CREATE INDEX IF NOT EXISTS pass_usages_client_pass_id_idx ON public.pass_usages (client_pass_id);

ALTER TABLE public.pass_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pass_usages_select_facility_members" ON public.pass_usages
  FOR SELECT USING (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "pass_usages_insert_facility_members" ON public.pass_usages
  FOR INSERT WITH CHECK (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()));

-- client_passes now exists, so this FK can be added safely here:
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS
  client_pass_id uuid REFERENCES public.client_passes(id) ON DELETE SET NULL;
