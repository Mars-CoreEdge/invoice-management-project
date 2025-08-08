-- Fix ambiguous column reference in get_user_teams function
-- This migration fixes the PostgreSQL error: "column reference 'team_id' is ambiguous"

-- Drop and recreate the function with proper column qualification
DROP FUNCTION IF EXISTS public.get_user_teams(UUID);

-- Function to get all teams a user belongs to
CREATE OR REPLACE FUNCTION public.get_user_teams(user_uuid UUID)
RETURNS TABLE(
  team_id UUID,
  team_name TEXT,
  role team_role,
  is_owner BOOLEAN,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as team_id,
    t.team_name,
    tm.role,
    (t.owner_id = user_uuid) as is_owner,
    (SELECT COUNT(*) FROM public.team_members WHERE team_members.team_id = t.id) as member_count
  FROM public.teams t
  INNER JOIN public.team_members tm ON t.id = tm.team_id
  WHERE tm.user_id = user_uuid
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_teams IS 'Get all teams a user belongs to (fixed ambiguous column reference)';
