-- Billing grace period: past_due tracking + email-sent timestamps

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  past_due_since timestamptz DEFAULT NULL;

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  trial_7day_email_sent_at timestamptz DEFAULT NULL;

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  grace_started_email_sent_at timestamptz DEFAULT NULL;

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  access_blocked_email_sent_at timestamptz DEFAULT NULL;
