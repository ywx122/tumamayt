/*
  # Fix fake users config RLS policies

  1. Security Changes
    - Add RLS policies for `fake_users_config` table
    - Allow owners to insert and update fake user count
    - Allow public to read the fake user count

  2. Changes Made
    - Enable RLS on fake_users_config table (if not already enabled)
    - Add policy for owners to insert/update fake user configuration
    - Add policy for public to read fake user count
*/

-- Ensure RLS is enabled on fake_users_config table
ALTER TABLE fake_users_config ENABLE ROW LEVEL SECURITY;

-- Allow owners to manage fake users config
CREATE POLICY "Only owners can manage fake users config"
  ON fake_users_config
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_owner = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_owner = true
  ));

-- Allow everyone to read fake users config
CREATE POLICY "Anyone can read fake users config"
  ON fake_users_config
  FOR SELECT
  TO public
  USING (true);