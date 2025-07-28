/*
  # Create Branding System Tables

  1. New Tables
    - `company_branding` - Store logo and color scheme
    - `employee_profiles` - Store employee profile pictures
  
  2. Lead Table Enhancements
    - Add missing columns for better lead management
    - Add rating and profile link columns
    
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
*/

-- Create company branding table
CREATE TABLE IF NOT EXISTS company_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  primary_color text DEFAULT '#ec4899',
  secondary_color text DEFAULT '#64748b',
  accent_color text DEFAULT '#f97316',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  profile_picture_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_platform text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rating numeric(2,1);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS specialties jsonb DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS profile_link text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;

-- Enable RLS on new tables
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_branding
CREATE POLICY "Anyone can read branding"
  ON company_branding
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage branding"
  ON company_branding
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin'
    )
  );

-- RLS Policies for employee_profiles
CREATE POLICY "Anyone can read employee profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage employee profiles"
  ON employee_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_id ON employee_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads(source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads(rating);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_branding_updated_at
  BEFORE UPDATE ON company_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();