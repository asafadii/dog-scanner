CREATE TABLE IF NOT EXISTS public.facility_notification_preferences (
  facility_id uuid PRIMARY KEY REFERENCES public.facilities(id) ON DELETE CASCADE,
  notify_new_booking boolean NOT NULL DEFAULT true,
  notify_returning_dog_booking boolean NOT NULL DEFAULT true,
  notify_booking_cancelled_by_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS facility_notification_preferences_set_updated_at
  ON public.facility_notification_preferences;
CREATE TRIGGER facility_notification_preferences_set_updated_at
  BEFORE UPDATE ON public.facility_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.facility_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facility_notification_prefs_select_facility_members"
  ON public.facility_notification_preferences
  FOR SELECT USING (facility_id IN (SELECT facility_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "facility_notification_prefs_upsert_facility_admins"
  ON public.facility_notification_preferences
  FOR INSERT WITH CHECK (facility_id IN (
    SELECT facility_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "facility_notification_prefs_update_facility_admins"
  ON public.facility_notification_preferences
  FOR UPDATE USING (facility_id IN (
    SELECT facility_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (facility_id IN (
    SELECT facility_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
