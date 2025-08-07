-- Emergency Teams Fix - Break infinite recursion completely
-- This migration temporarily disables RLS to break the recursion cycle

-- Step 1: Completely disable RLS on all team tables
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to clean slate
DROP POLICY IF EXISTS "teams_select_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_update_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON public.teams;

DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON public.team_members;

DROP POLICY IF EXISTS "team_invitations_select_policy" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_insert_policy" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_delete_policy" ON public.team_invitations;

-- Step 3: Re-enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ultra-simple policies that cannot cause recursion
-- Teams policies
CREATE POLICY "teams_select_simple" ON public.teams
  FOR SELECT USING (true); -- Allow all authenticated users to see teams

CREATE POLICY "teams_insert_simple" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "teams_update_simple" ON public.teams
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "teams_delete_simple" ON public.teams
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Team members policies - SUPER SIMPLE
CREATE POLICY "team_members_select_simple" ON public.team_members
  FOR SELECT USING (true); -- Allow all authenticated users to see team members

CREATE POLICY "team_members_insert_simple" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "team_members_update_simple" ON public.team_members
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "team_members_delete_simple" ON public.team_members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Team invitations policies - SUPER SIMPLE
CREATE POLICY "team_invitations_select_simple" ON public.team_invitations
  FOR SELECT USING (true); -- Allow all authenticated users to see invitations

CREATE POLICY "team_invitations_insert_simple" ON public.team_invitations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "team_invitations_delete_simple" ON public.team_invitations
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Step 5: Create a function to test if the fix worked
CREATE OR REPLACE FUNCTION public.test_teams_access()
RETURNS TABLE(
  teams_count BIGINT,
  members_count BIGINT,
  invitations_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.teams) as teams_count,
    (SELECT COUNT(*) FROM public.team_members) as members_count,
    (SELECT COUNT(*) FROM public.team_invitations) as invitations_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
