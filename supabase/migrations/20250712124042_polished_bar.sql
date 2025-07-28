-- Drop existing RLS policies for employee_profiles if they exist
DROP POLICY IF EXISTS "Authenticated users can manage employee profiles" ON employee_profiles;
DROP POLICY IF EXISTS "Anyone can read employee profiles" ON employee_profiles;

-- Re-enable RLS (ensures RLS is active after dropping policies)
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create a new RLS policy that allows public (anon and authenticated) users to manage employee profiles
-- This is necessary because the backend is making requests using the anon key.
CREATE POLICY "Public can manage employee profiles"
  ON employee_profiles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create a new RLS policy that allows public (anon and authenticated) users to read employee profiles
CREATE POLICY "Public can view employee profiles"
  ON employee_profiles
  FOR SELECT
  TO public
  USING (true);