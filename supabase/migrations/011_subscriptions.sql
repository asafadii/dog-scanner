ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  subscription_plan text
    CHECK (subscription_plan IN ('dora', 'dora_unlimited'))
    DEFAULT 'dora';

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  subscription_status text
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled'))
    DEFAULT 'trialing';

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  trial_ends_at timestamptz
    DEFAULT (now() + interval '14 days');

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  staff_limit integer DEFAULT 3;

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  subscription_started_at timestamptz DEFAULT NULL;

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  stripe_customer_id text DEFAULT NULL;

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS
  stripe_subscription_id text DEFAULT NULL;
