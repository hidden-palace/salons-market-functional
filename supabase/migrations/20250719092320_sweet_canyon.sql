/*
  # Create leads table with comprehensive structure

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `business_name` (text, required)
      - `contact_name` (text)
      - `role_title` (text)
      - `email` (text)
      - `phone` (text)
      - `website` (text)
      - `address` (text)
      - `city` (text)
      - `state` (text)
      - `postal_code` (text)
      - `country` (text, default 'US')
      - `industry` (text)
      - `categories` (jsonb, default '[]')
      - `source_platform` (text)
      - `rating` (numeric(2,1))
      - `specialties` (jsonb, default '[]')
      - `profile_link` (text)
      - `notes` (text)
      - `relevance_score` (numeric(2,1), default 0)
      - `contact_role_score` (numeric(2,1), default 0)
      - `location_score` (numeric(2,1), default 0)
      - `completeness_score` (numeric(2,1), default 0)
      - `online_presence_score` (numeric(2,1), default 0)
      - `average_score` (numeric(2,1), default 0)
      - `validated` (boolean, default false)
      - `outreach_sent` (boolean, default false)
      - `response_received` (boolean, default false)
      - `converted` (boolean, default false)
      - `employee_id` (text)
      - `source_data` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `leads` table
    - Add policy for public access (since backend uses anon key)

  3. Indexes
    - Index on business_name for faster searches
    - Index on city for location filtering
    - Index on industry for category filtering
    - Index on employee_id for employee-specific queries
    - Index on created_at for date sorting
    - Index on validated, outreach_sent for status filtering

  4. Constraints
    - Rating constraint (0-5 range)
    - Score constraints (0-5 range)

  5. Triggers
    - Auto-update updated_at timestamp
    - Auto-calculate average_score from individual scores
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text,
  role_title text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',
  industry text,
  categories jsonb DEFAULT '[]'::jsonb,
  source_platform text,
  rating numeric(2,1),
  specialties jsonb DEFAULT '[]'::jsonb,
  profile_link text,
  notes text,
  relevance_score numeric(2,1) DEFAULT 0,
  contact_role_score numeric(2,1) DEFAULT 0,
  location_score numeric(2,1) DEFAULT 0,
  completeness_score numeric(2,1) DEFAULT 0,
  online_presence_score numeric(2,1) DEFAULT 0,
  average_score numeric(2,1) DEFAULT 0,
  validated boolean DEFAULT false,
  outreach_sent boolean DEFAULT false,
  response_received boolean DEFAULT false,
  converted boolean DEFAULT false,
  employee_id text,
  source_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policy for public access (backend uses anon key)
CREATE POLICY "Public can manage leads"
  ON leads
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_business_name ON leads (business_name);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads (city);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads (industry);
CREATE INDEX IF NOT EXISTS idx_leads_employee_id ON leads (employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_validated ON leads (validated);
CREATE INDEX IF NOT EXISTS idx_leads_outreach_sent ON leads (outreach_sent);
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads (source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads (rating);

-- Add constraints
ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS chk_leads_rating 
  CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS chk_leads_relevance_score 
  CHECK (relevance_score >= 0 AND relevance_score <= 5);

ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS chk_leads_contact_role_score 
  CHECK (contact_role_score >= 0 AND contact_role_score <= 5);

ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS chk_leads_location_score 
  CHECK (location_score >= 0 AND location_score <= 5);

ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS chk_leads_completeness_score 
  CHECK (completeness_score >= 0 AND completeness_score <= 5);

ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS chk_leads_online_presence_score 
  CHECK (online_presence_score >= 0 AND online_presence_score <= 5);

ALTER TABLE leads ADD CONSTRAINT IF NOT EXISTS chk_leads_average_score 
  CHECK (average_score >= 0 AND average_score <= 5);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-calculate average score
CREATE OR REPLACE FUNCTION calculate_average_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.average_score = (
    COALESCE(NEW.relevance_score, 0) + 
    COALESCE(NEW.contact_role_score, 0) + 
    COALESCE(NEW.location_score, 0) + 
    COALESCE(NEW.completeness_score, 0) + 
    COALESCE(NEW.online_presence_score, 0)
  ) / 5.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate average score
CREATE TRIGGER calculate_leads_average_score
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION calculate_average_score();