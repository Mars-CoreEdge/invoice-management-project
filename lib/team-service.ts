import { createServerSupabaseClient } from './supabase-server';
import { 
  Team, 
  TeamMember, 
  TeamInvitation, 
  UserTeam, 
  UserRoleCheck, 
  TeamRole,
  CreateTeamRequest,
  InviteUserRequest,
  AcceptInvitationRequest,
  hasPermission,
  getRequiredRoleForPermission,
  PermissionKey
} from '../types/teams';

export class TeamService {
  private supabase = createServerSupabaseClient();

  /**
   * Check if a user has a specific role in a team
   */
  async checkUserRole(
    userId: string, 
    teamId: string, 
    allowedRoles?: TeamRole[]
  ): Promise<UserRoleCheck> {
    try {
      const { data, error } = await this.supabase.rpc('check_user_role', {
        user_uuid: userId,
        team_uuid: teamId,
        allowed_roles: allowedRoles
      });

      if (error) {
        console.error('Error checking user role:', error);
        return { has_permission: false, user_role: null, is_member: false };
      }

      return data?.[0] || { has_permission: false, user_role: null, is_member: false };
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      return { has_permission: false, user_role: null, is_member: false };
    }
  }

  /**
   * Check if a user has a specific permission in a team
   */
  async checkUserPermission(
    userId: string, 
    teamId: string, 
    permission: PermissionKey
  ): Promise<boolean> {
    const requiredRoles = getRequiredRoleForPermission(permission);
    const roleCheck = await this.checkUserRole(userId, teamId, requiredRoles);
    return roleCheck.has_permission;
  }

  /**
   * Get all teams a user belongs to
   */
  async getUserTeams(userId: string): Promise<UserTeam[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_teams', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error getting user teams:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTeams:', error);
      return [];
    }
  }

  /**
   * Create a new team with the current user as admin
   */
  async createTeam(request: CreateTeamRequest): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('create_team_with_admin', {
        team_name: request.team_name,
        description: request.description
      });

      if (error) {
        console.error('Error creating team:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createTeam:', error);
      return null;
    }
  }

  /**
   * Get team details
   */
  async getTeam(teamId: string): Promise<Team | null> {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('Error getting team:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTeam:', error);
      return null;
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_members')
        .select(`
          team_id,
          user_id,
          role,
          joined_at,
          invited_by,
          users:user_id(email, raw_user_meta_data)
        `)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error getting team members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTeamMembers:', error);
      return [];
    }
  }

  /**
   * Invite a user to a team
   */
  async inviteUser(request: InviteUserRequest): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('invite_user_to_team', {
        team_uuid: request.team_id,
        email_address: request.email,
        user_role: request.role || 'viewer'
      });

      if (error) {
        console.error('Error inviting user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in inviteUser:', error);
      return null;
    }
  }

  /**
   * Accept a team invitation
   */
  async acceptInvitation(request: AcceptInvitationRequest): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('accept_team_invitation', {
        invitation_token: request.token
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      return null;
    }
  }

  /**
   * Get pending invitations for a team
   */
  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    try {
      const { data, error } = await this.supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error getting team invitations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTeamInvitations:', error);
      return [];
    }
  }

  /**
   * Update a team member's role
   */
  async updateMemberRole(
    teamId: string, 
    userId: string, 
    newRole: TeamRole
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating member role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMemberRole:', error);
      return false;
    }
  }

  /**
   * Remove a member from a team
   */
  async removeMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeMember:', error);
      return false;
    }
  }

  /**
   * Delete a team invitation
   */
  async deleteInvitation(invitationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error deleting invitation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteInvitation:', error);
      return false;
    }
  }

  /**
   * Update team details
   */
  async updateTeam(
    teamId: string, 
    updates: Partial<Pick<Team, 'team_name' | 'description'>>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

      if (error) {
        console.error('Error updating team:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTeam:', error);
      return false;
    }
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) {
        console.error('Error deleting team:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTeam:', error);
      return false;
    }
  }

  /**
   * Clean up expired invitations
   */
  async cleanupExpiredInvitations(): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_invitations');

      if (error) {
        console.error('Error cleaning up expired invitations:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredInvitations:', error);
      return 0;
    }
  }

  /**
   * Get user's role in a team
   */
  async getUserRole(userId: string, teamId: string): Promise<TeamRole | null> {
    try {
      const { data, error } = await this.supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error getting user role:', error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
    }
  }

  /**
   * Check if user is team owner
   */
  async isTeamOwner(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .select('owner_id')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('Error checking team ownership:', error);
        return false;
      }

      return data?.owner_id === userId;
    } catch (error) {
      console.error('Error in isTeamOwner:', error);
      return false;
    }
  }
}

// Singleton instance
let teamServiceInstance: TeamService | null = null;

export function getTeamService(): TeamService {
  if (!teamServiceInstance) {
    teamServiceInstance = new TeamService();
  }
  return teamServiceInstance;
} 