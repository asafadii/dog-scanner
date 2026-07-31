ALTER TABLE public.staff_invites
  ADD COLUMN role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff'));
