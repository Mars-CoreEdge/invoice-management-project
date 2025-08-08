-- Teams and Role-Based Access Control (RBAC) Schema
-- This migration creates a complete team collaboration system for multi-tenant invoice management

-- First, drop any existing team-related objects to avoid conflicts
DROP TABLE IF EXISTS public.team_invitations CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TYPE IF EXISTS team_role CASCADE;

-- Create enum for team roles
CREATE TYPE team_role AS ENUM ('admin', 'accountant', 'viewer');

-- Create teams table
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure team name is not empty
  CONSTRAINT teams_name_not_empty CHECK (LENGTH(TRIM(team_name)) > 0)
);

-- Create team_members table with composite primary key
CREATE TABLE public.team_members (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Composite primary key to ensure unique team-user pairs
  PRIMARY KEY (team_id, user_id)
);

-- Create team_invitations table for pending invitations
CREATE TABLE public.team_invitations (
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
CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX idx_teams_created_at ON public.teams(created_at);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_role ON public.team_members(role);
CREATE INDEX idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_expires_at ON public.team_invitations(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams table
CREATE POLICY "teams_select_policy" ON public.teams
  FOR SELECT USING (
    -- Users can see teams they are members of
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = teams.id AND user_id = auth.uid()
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
    -- Only team admins can update team details
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = teams.id 
      AND user_id = auth.uid() 
      AND role = 'admin'
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

-- RLS Policies for team_members table
CREATE POLICY "team_members_select_policy" ON public.team_members
  FOR SELECT USING (
    -- Team members can see other team members
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "team_members_insert_policy" ON public.team_members
  FOR INSERT WITH CHECK (
    -- Only team admins can add new members
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "team_members_update_policy" ON public.team_members
  FOR UPDATE USING (
    -- Only team admins can update member roles
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role = 'admin'
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
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role = 'admin'
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

-- RLS Policies for team_invitations table
CREATE POLICY "team_invitations_select_policy" ON public.team_invitations
  FOR SELECT USING (
    -- Team admins can see invitations for their team
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "team_invitations_insert_policy" ON public.team_invitations
  FOR INSERT WITH CHECK (
    -- Only team admins can create invitations
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role = 'admin'
    ) AND
    -- Invited by must be the current user
    invited_by = auth.uid()
  );

CREATE POLICY "team_invitations_delete_policy" ON public.team_invitations
  FOR DELETE USING (
    -- Team admins can delete invitations for their team
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role = 'admin'
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
CREATE TRIGGER on_teams_updated
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_teams_updated_at();

-- Utility function to check user role in a team
CREATE OR REPLACE FUNCTION public.check_user_role(
  user_uuid UUID,
  team_uuid UUID,
  allowed_roles team_role[] DEFAULT NULL
)
RETURNS TABLE(
  has_permission BOOLEAN,
  user_role team_role,
  is_member BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN allowed_roles IS NULL THEN TRUE
      ELSE tm.role = ANY(allowed_roles)
    END as has_permission,
    tm.role as user_role,
    TRUE as is_member
  FROM public.team_members tm
  WHERE tm.team_id = team_uuid AND tm.user_id = user_uuid;
  
  -- If no rows returned, user is not a member
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::team_role, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Function to invite a user to a team
CREATE OR REPLACE FUNCTION public.invite_user_to_team(
  team_uuid UUID,
  email_address TEXT,
  user_role team_role DEFAULT 'viewer'
)
RETURNS TEXT AS $$
DECLARE
  invitation_token TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to invite someone';
  END IF;
  
  -- Check if user is admin of the team
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_uuid 
    AND user_id = current_user_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only team admins can invite users';
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.team_members tm
    INNER JOIN auth.users u ON tm.user_id = u.id
    WHERE tm.team_id = team_uuid AND u.email = email_address
  ) THEN
    RAISE EXCEPTION 'User is already a member of this team';
  END IF;
  
  -- Check if invitation already exists
  IF EXISTS (
    SELECT 1 FROM public.team_invitations 
    WHERE team_id = team_uuid AND email = email_address
  ) THEN
    RAISE EXCEPTION 'Invitation already exists for this email';
  END IF;
  
  -- Generate invitation token
  invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create invitation
  INSERT INTO public.team_invitations (team_id, email, role, invited_by, token, expires_at)
  VALUES (team_uuid, email_address, user_role, current_user_id, invitation_token, NOW() + INTERVAL '7 days');
  
  RETURN invitation_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token TEXT)
RETURNS UUID AS $$
DECLARE
  invitation_record RECORD;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to accept invitation';
  END IF;
  
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM public.team_invitations
  WHERE token = invitation_token AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Check if user email matches invitation
  IF (SELECT email FROM auth.users WHERE id = current_user_id) != invitation_record.email THEN
    RAISE EXCEPTION 'Invitation email does not match current user email';
  END IF;
  
  -- Add user to team
  INSERT INTO public.team_members (team_id, user_id, role, invited_by)
  VALUES (invitation_record.team_id, current_user_id, invitation_record.role, invitation_record.invited_by)
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  -- Delete the invitation
  DELETE FROM public.team_invitations WHERE token = invitation_token;
  
  RETURN invitation_record.team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.team_invitations
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.teams IS 'Teams/workspaces for multi-tenant collaboration';
COMMENT ON TABLE public.team_members IS 'Team membership and role assignments';
COMMENT ON TABLE public.team_invitations IS 'Pending team invitations';
COMMENT ON TYPE team_role IS 'Available roles for team members';
COMMENT ON FUNCTION public.check_user_role IS 'Check if user has required role in a team';
COMMENT ON FUNCTION public.get_user_teams IS 'Get all teams a user belongs to';
COMMENT ON FUNCTION public.create_team_with_admin IS 'Create a new team with the creator as admin';
COMMENT ON FUNCTION public.invite_user_to_team IS 'Invite a user to join a team';
COMMENT ON FUNCTION public.accept_team_invitation IS 'Accept a team invitation';
COMMENT ON FUNCTION public.cleanup_expired_invitations IS 'Remove expired team invitations'; 