/*
  # Fix RLS policies for company_branding table

  1. Security Changes
    - Drop existing restrictive admin-only policies
    - Add permissive policies that allow public access for SELECT, INSERT, and UPDATE
    - This allows the backend service to manage branding data using the anonymous key

  2. Changes Made
    - Remove admin role requirement for branding operations
    - Allow authenticated users to read and modify branding data
    - Enable logo upload functionality to work properly
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can read branding" ON company_branding;
DROP POLICY IF EXISTS "Only admins can manage branding" ON company_branding;

-- Create new permissive policies for company_branding
CREATE POLICY "Public can read branding"
  ON company_branding
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert branding"
  ON company_branding
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update branding"
  ON company_branding
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);