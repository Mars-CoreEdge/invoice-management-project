-- Complete Teams Fix - Comprehensive solution for team management
-- This migration ensures all team tables exist and have proper RLS policies

-- First, ensure the team_role enum exists
DO $$ BEGIN
    CREATE TYPE team_role AS ENUM ('admin', 'accountant', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure team name is not empty
  CONSTRAINT teams_name_not_empty CHECK (LENGTH(TRIM(team_name)) > 0)
);

-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_members (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Composite primary key to ensure unique team-user pairs
  PRIMARY KEY (team_id, user_id)
);

-- Create team_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure email is valid format
  CONSTRAINT team_invitations_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  -- Ensure token is not empty
  CONSTRAINT team_invitations_token_not_empty CHECK (LENGTH(TRIM(token)) > 0)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON public.teams(created_at);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON public.team_invitations(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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

-- Create simple, non-recursive RLS policies for teams table
CREATE POLICY "teams_select_policy" ON public.teams
  FOR SELECT USING (
    -- Users can see teams they own or are members of
    owner_id = auth.uid() OR
    id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "teams_insert_policy" ON public.teams
  FOR INSERT WITH CHECK (
    -- Any authenticated user can create a team
    auth.uid() IS NOT NULL AND
    -- Owner must be the current user
    owner_id = auth.uid()
  );

CREATE POLICY "teams_update_policy" ON public.teams
  FOR UPDATE USING (
    -- Only team owner or admins can update team details
    owner_id = auth.uid() OR
    id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  ) WITH CHECK (
    -- Owner cannot be changed
    owner_id = (SELECT owner_id FROM public.teams WHERE id = teams.id)
  );

CREATE POLICY "teams_delete_policy" ON public.teams
  FOR DELETE USING (
    -- Only team owner can delete the team
    owner_id = auth.uid()
  );

-- Create simple, non-recursive RLS policies for team_members table
CREATE POLICY "team_members_select_policy" ON public.team_members
  FOR SELECT USING (
    -- Users can see their own memberships or memberships in teams they belong to
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

-- Create simple, non-recursive RLS policies for team_invitations table
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

-- Function to update teams updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update teams updated_at timestamp
DROP TRIGGER IF EXISTS on_teams_updated ON public.teams;
CREATE TRIGGER on_teams_updated
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_teams_updated_at();

-- Function to create a new team with initial admin
CREATE OR REPLACE FUNCTION public.create_team_with_admin(
  team_name TEXT,
  description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create a team';
  END IF;
  
  -- Create the team
  INSERT INTO public.teams (team_name, description, owner_id)
  VALUES (team_name, description, current_user_id)
  RETURNING id INTO new_team_id;
  
  -- Add the creator as admin
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, current_user_id, 'admin');
  
  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
