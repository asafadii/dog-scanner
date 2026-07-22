-- Portal account settings: notification prefs + soft-delete

ALTER TABLE public.client_accounts
  ADD COLUMN IF NOT EXISTS email_reminders_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.client_accounts
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;
