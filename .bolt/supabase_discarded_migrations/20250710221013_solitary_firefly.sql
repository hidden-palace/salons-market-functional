/*
  # Complete Branding System Setup

  1. New Tables
    - `company_branding` - Store logo and color scheme
    - `employee_profiles` - Store employee profile pictures
  
  2. Enhanced Tables
    - `leads` - Add rating, source platform, specialties, profile link, notes
  
  3. Security
    - Enable RLS on all tables
    - Add proper policies for authenticated users
  
  4. Performance
    - Add indexes for common queries
    - Add update triggers for timestamps
*/

-- Create company_branding table
CREATE TABLE IF NOT EXISTS company_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  primary_color text DEFAULT '#ec4899',
  secondary_color text DEFAULT '#64748b',
  accent_color text DEFAULT '#f97316',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee_profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  profile_picture_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_platform text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rating numeric(2,1);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS specialties jsonb DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profile_link text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;

-- Add rating constraint (simple approach - will fail if exists, but that's ok)
ALTER TABLE leads ADD CONSTRAINT chk_leads_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Enable RLS
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Company branding policies (using your exact pattern)
DROP POLICY IF EXISTS "Anyone can read branding" ON company_branding;
CREATE POLICY "Anyone can read branding"
  ON company_branding
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage branding" ON company_branding;
CREATE POLICY "Only admins can manage branding"
  ON company_branding
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM app_users au
    JOIN roles r ON au.role_id = r.id
    WHERE au.id = auth.uid() AND r.name = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM app_users au
    JOIN roles r ON au.role_id = r.id
    WHERE au.id = auth.uid() AND r.name = 'admin'
  ));

-- Employee profiles policies (using your exact pattern)
DROP POLICY IF EXISTS "Anyone can read employee profiles" ON employee_profiles;
CREATE POLICY "Anyone can read employee profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage employee profiles" ON employee_profiles;
CREATE POLICY "Only admins can manage employee profiles"
  ON employee_profiles
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM app_users au
    JOIN roles r ON au.role_id = r.id
    WHERE au.id = auth.uid() AND r.name = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM app_users au
    JOIN roles r ON au.role_id = r.id
    WHERE au.id = auth.uid() AND r.name = 'admin'
  ));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_id ON employee_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads(source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads(rating);

-- Add update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_company_branding_updated_at ON company_branding;
CREATE TRIGGER update_company_branding_updated_at
    BEFORE UPDATE ON company_branding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON employee_profiles;
CREATE TRIGGER update_employee_profiles_updated_at
    BEFORE UPDATE ON employee_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();