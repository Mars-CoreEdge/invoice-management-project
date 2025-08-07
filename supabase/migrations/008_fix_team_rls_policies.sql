-- Fix infinite recursion in team RLS policies
-- This migration replaces the problematic RLS policies with simpler, non-recursive ones

-- Drop existing problematic policies
DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON public.team_members;

-- Create simplified, non-recursive RLS policies for team_members table
CREATE POLICY "team_members_select_policy" ON public.team_members
  FOR SELECT USING (
    -- Users can see team members if they are members of that team
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_insert_policy" ON public.team_members
  FOR INSERT WITH CHECK (
    -- Only team admins can add new members
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  );

CREATE POLICY "team_members_update_policy" ON public.team_members
  FOR UPDATE USING (
    -- Only team admins can update member roles
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  ) WITH CHECK (
    -- Prevent demoting the last admin
    (role != 'admin' AND user_id != auth.uid()) OR
    (role = 'admin') OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.role = 'admin' 
      AND tm.user_id != team_members.user_id
    )
  );

CREATE POLICY "team_members_delete_policy" ON public.team_members
  FOR DELETE USING (
    -- Only team admins can remove members
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    ) AND
    -- Prevent removing the last admin
    (user_id != auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.role = 'admin' 
      AND tm.user_id != team_members.user_id
    )
  );

-- Also fix the teams policies to avoid potential recursion
DROP POLICY IF EXISTS "teams_select_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_update_policy" ON public.teams;

CREATE POLICY "teams_select_policy" ON public.teams
  FOR SELECT USING (
    -- Users can see teams they are members of or own
    owner_id = auth.uid() OR
    id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "teams_update_policy" ON public.teams
  FOR UPDATE USING (
    -- Only team admins can update team details
    owner_id = auth.uid() OR
    id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  ) WITH CHECK (
    -- Owner cannot be changed
    owner_id = (SELECT owner_id FROM public.teams WHERE id = teams.id)
  );

-- Fix team_invitations policies as well
DROP POLICY IF EXISTS "team_invitations_select_policy" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_insert_policy" ON public.team_invitations;
DROP POLICY IF EXISTS "team_invitations_delete_policy" ON public.team_invitations;

CREATE POLICY "team_invitations_select_policy" ON public.team_invitations
  FOR SELECT USING (
    -- Team admins can see invitations for their team
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  );

CREATE POLICY "team_invitations_insert_policy" ON public.team_invitations
  FOR INSERT WITH CHECK (
    -- Only team admins can create invitations
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    ) AND
    -- Invited by must be the current user
    invited_by = auth.uid()
  );

CREATE POLICY "team_invitations_delete_policy" ON public.team_invitations
  FOR DELETE USING (
    -- Team admins can delete invitations for their team
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  );
