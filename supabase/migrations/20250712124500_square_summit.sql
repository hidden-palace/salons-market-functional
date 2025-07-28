```sql
-- Drop existing RLS policies for employee_profiles to avoid conflicts
DROP POLICY IF EXISTS "Public can manage employee profiles" ON employee_profiles;
DROP POLICY IF EXISTS "Public can view employee profiles" ON employee_profiles;
DROP POLICY IF EXISTS "Authenticated users can manage employee profiles" ON employee_profiles;
DROP POLICY IF EXISTS "Anyone can read employee profiles" ON employee_profiles;

-- Ensure RLS is enabled
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for public users to INSERT employee profiles
CREATE POLICY "Public can insert employee profiles"
  ON employee_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy for public users to UPDATE employee profiles
  ON employee_profiles
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy for public users to SELECT employee profiles
CREATE POLICY "Public can select employee profiles"
  ON employee_profiles
  FOR SELECT
  TO public
  USING (true);
```