-- Supabase does not support DO blocks via API or SQL editor
-- Rewrite using simple conditional-safe SQL for Supabase compatibility

-- Add the chk_leads_rating constraint if not exists (manually ensure idempotency)
-- Note: PostgreSQL does not support IF NOT EXISTS for constraints directly, so manual check is required before running again

-- Make sure the "rating" column exists before applying the constraint
ALTER TABLE leads ADD CONSTRAINT chk_leads_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- If you want it idempotent, check for constraint existence outside Supabase (client-side) or manage through migrations
