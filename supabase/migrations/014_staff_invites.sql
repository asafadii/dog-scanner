-- Sprint: Staff invite flow

CREATE TABLE IF NOT EXISTS public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES public.profiles(id),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_invites_token_idx
  ON public.staff_invites(token);

CREATE INDEX IF NOT EXISTS staff_invites_facility_id_idx
  ON public.staff_invites(facility_id);

ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_invites_select ON public.staff_invites
  FOR SELECT USING (
    facility_id IN (
      SELECT facility_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY staff_invites_insert ON public.staff_invites
  FOR INSERT WITH CHECK (
    facility_id IN (
      SELECT facility_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY staff_invites_update ON public.staff_invites
  FOR UPDATE USING (
    facility_id IN (
      SELECT facility_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
