export type TeamRole = 'admin' | 'accountant' | 'viewer' | 'assistant';

export interface Team {
  id: string;
  team_name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  invited_by?: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface UserTeam {
  team_id: string;
  team_name: string;
  role: TeamRole;
  is_owner: boolean;
  member_count: number;
}

export interface UserRoleCheck {
  has_permission: boolean;
  user_role: TeamRole | null;
  is_member: boolean;
}

export interface CreateTeamRequest {
  team_name: string;
  description?: string;
}

export interface InviteUserRequest {
  team_id: string;
  email: string;
  role?: TeamRole;
}

export interface AcceptInvitationRequest {
  token: string;
}

// Role-based permissions for different operations
export const ROLE_PERMISSIONS = {
  admin: {
    can_manage_team: true,
    can_invite_users: true,
    can_remove_users: true,
    can_change_roles: true,
    can_delete_team: true,
    can_view_invoices: true,
    can_edit_invoices: true,
    can_delete_invoices: true,
    can_manage_quickbooks: true,
    can_use_ai_tools: true,
  },
  accountant: {
    can_manage_team: false,
    can_invite_users: false,
    can_remove_users: false,
    can_change_roles: false,
    can_delete_team: false,
    can_view_invoices: true,
    can_edit_invoices: true,
    can_delete_invoices: false,
    can_manage_quickbooks: true,
    can_use_ai_tools: true,
  },
  assistant: {
    can_manage_team: false,
    can_invite_users: false,
    can_remove_users: false,
    can_change_roles: false,
    can_delete_team: false,
    can_view_invoices: true,
    can_edit_invoices: false,
    can_delete_invoices: false,
    can_manage_quickbooks: false,
    can_use_ai_tools: true,
  },
  viewer: {
    can_manage_team: false,
    can_invite_users: false,
    can_remove_users: false,
    can_change_roles: false,
    can_delete_team: false,
    can_view_invoices: true,
    can_edit_invoices: false,
    can_delete_invoices: false,
    can_manage_quickbooks: false,
    can_use_ai_tools: false,
  },
} as const;

export type PermissionKey = keyof typeof ROLE_PERMISSIONS.admin;

export function hasPermission(role: TeamRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role][permission] || false;
}

export function getRequiredRoleForPermission(permission: PermissionKey): TeamRole[] {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([_, permissions]) => permissions[permission])
    .map(([role]) => role as TeamRole);
} 