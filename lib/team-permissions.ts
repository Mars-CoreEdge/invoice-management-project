import { getTeamService } from './team-service';
import { getQBOSessionManager } from './qbo-session';
import { PermissionKey, TeamRole } from '../types/teams';

export interface TeamPermissionContext {
  userId: string;
  teamId: string;
  userRole: TeamRole | null;
  hasPermission: boolean;
}

/**
 * Check if a user has permission for a specific operation in a team
 */
export async function checkTeamPermission(
  userId: string,
  teamId: string,
  permission: PermissionKey
): Promise<TeamPermissionContext> {
  const teamService = getTeamService();
  
  // Check user's role in the team
  const roleCheck = await teamService.checkUserRole(userId, teamId);
  
  if (!roleCheck.is_member) {
    return {
      userId,
      teamId,
      userRole: null,
      hasPermission: false
    };
  }

  // Check specific permission
  const hasPermission = await teamService.checkUserPermission(userId, teamId, permission);
  
  return {
    userId,
    teamId,
    userRole: roleCheck.user_role,
    hasPermission
  };
}

/**
 * Middleware for AI tools to check team permissions
 */
export async function withTeamPermission<T>(
  userId: string,
  teamId: string,
  permission: PermissionKey,
  operation: (context: TeamPermissionContext) => Promise<T>
): Promise<T> {
  const context = await checkTeamPermission(userId, teamId, permission);
  
  if (!context.hasPermission) {
    throw new Error(`Insufficient permissions. Required: ${permission}, User role: ${context.userRole}`);
  }
  
  return operation(context);
}

/**
 * Get QuickBooks data with team permission check
 */
export async function getTeamQuickBooksData(
  userId: string,
  teamId: string,
  dataType: 'invoices' | 'customers' | 'items' | 'company'
) {
  const requiredPermission: PermissionKey = 
    dataType === 'company' ? 'can_manage_quickbooks' : 'can_view_invoices';

  return withTeamPermission(userId, teamId, requiredPermission, async (context) => {
    const qboSession = getQBOSessionManager();
    
    switch (dataType) {
      case 'invoices':
        return await qboSession.getInvoices();
      case 'customers':
        return await qboSession.getCustomers();
      case 'items':
        return await qboSession.getItems();
      case 'company':
        return await qboSession.getCompanyInfo();
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  });
}

/**
 * Check if user can perform AI operations in a team
 */
export async function canUseAITools(userId: string, teamId: string): Promise<boolean> {
  const context = await checkTeamPermission(userId, teamId, 'can_use_ai_tools');
  return context.hasPermission;
}

/**
 * Check if user can manage QuickBooks in a team
 */
export async function canManageQuickBooks(userId: string, teamId: string): Promise<boolean> {
  const context = await checkTeamPermission(userId, teamId, 'can_manage_quickbooks');
  return context.hasPermission;
}

/**
 * Check if user can edit invoices in a team
 */
export async function canEditInvoices(userId: string, teamId: string): Promise<boolean> {
  const context = await checkTeamPermission(userId, teamId, 'can_edit_invoices');
  return context.hasPermission;
}

/**
 * Get user's role in a team
 */
export async function getUserTeamRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const teamService = getTeamService();
  return await teamService.getUserRole(userId, teamId);
}

/**
 * Validate team access for API operations
 */
export async function validateTeamAccess(
  userId: string,
  teamId: string,
  requiredPermissions: PermissionKey[]
): Promise<TeamPermissionContext> {
  const teamService = getTeamService();
  
  // First check if user is a member
  const roleCheck = await teamService.checkUserRole(userId, teamId);
  
  if (!roleCheck.is_member) {
    throw new Error('Access denied: User is not a member of this team');
  }

  // Check all required permissions
  for (const permission of requiredPermissions) {
    const hasPermission = await teamService.checkUserPermission(userId, teamId, permission);
    if (!hasPermission) {
      throw new Error(`Access denied: Insufficient permissions for ${permission}`);
    }
  }

  return {
    userId,
    teamId,
    userRole: roleCheck.user_role,
    hasPermission: true
  };
}

/**
 * Get all teams where user has a specific permission
 */
export async function getTeamsWithPermission(
  userId: string,
  permission: PermissionKey
): Promise<string[]> {
  const teamService = getTeamService();
  const userTeams = await teamService.getUserTeams(userId);
  
  const teamsWithPermission: string[] = [];
  
  for (const team of userTeams) {
    const hasPermission = await teamService.checkUserPermission(userId, team.team_id, permission);
    if (hasPermission) {
      teamsWithPermission.push(team.team_id);
    }
  }
  
  return teamsWithPermission;
} 