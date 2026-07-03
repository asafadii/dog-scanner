-- Dog profile missing fields
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS microchip_number text DEFAULT NULL;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_neutered boolean DEFAULT NULL;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS aggression_towards_people boolean DEFAULT NULL;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS aggression_towards_dogs boolean DEFAULT NULL;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS separation_anxiety text DEFAULT NULL;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS kennel_trained text DEFAULT NULL;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS chewing_risk text DEFAULT NULL;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS health_certificate_number text DEFAULT NULL;

-- Facility name and currency
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS name text DEFAULT NULL;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS currency text
  CHECK (currency IN ('EUR','GBP','HUF','USD','CHF','CZK','PLN','RON','SEK','NOK','DKK'))
  DEFAULT 'EUR';
