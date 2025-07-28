/*
  # Create missing employee_profiles table

  1. New Tables
    - `employee_profiles`
      - `id` (uuid, primary key)
      - `employee_id` (text, unique)
      - `profile_picture_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `employee_profiles` table
    - Add policy for public read access
    - Add policy for authenticated users to manage profiles

  3. Indexes
    - Index on employee_id for faster lookups

  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Create employee_profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL UNIQUE,
  profile_picture_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_profiles
CREATE POLICY "Anyone can read employee profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage employee profiles"
  ON employee_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_id ON employee_profiles (employee_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to update updated_at columns
CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();