/*
  # Create leaderboard function and weekly reset system

  1. New Functions
    - `get_leaderboard_data()` - Returns leaderboard data with proper joins
  
  2. Schema Changes
    - Add `last_leaderboard_reward_claim` to wallets table for weekly reset tracking
  
  3. Security
    - Function is accessible to all users for reading leaderboard data
*/

-- Add column for tracking last leaderboard reward claim
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'last_leaderboard_reward_claim'
  ) THEN
    ALTER TABLE wallets ADD COLUMN last_leaderboard_reward_claim timestamptz;
  END IF;
END $$;

-- Create function to get leaderboard data with proper joins
CREATE OR REPLACE FUNCTION get_leaderboard_data()
RETURNS TABLE(
    user_id uuid,
    username text,
    balance bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.user_id,
        p.username,
        w.balance::bigint
    FROM
        public.wallets w
    JOIN
        public.profiles p ON w.user_id = p.id
    WHERE
        w.balance >= 10
    ORDER BY
        w.balance DESC
    LIMIT 10;
END;
$$;