# Team Collaboration & Role-Based Access Control (RBAC)

This document describes the team collaboration and role-based access control system implemented for the multi-tenant invoice management tool.

## Overview

The system enables users to create teams (workspaces), invite members, assign roles, and enforce permissions across all features including QuickBooks integration and AI tools.

## Database Schema

### Tables

#### `teams`
- `id`: UUID (Primary Key)
- `team_name`: TEXT (Required)
- `description`: TEXT (Optional)
- `owner_id`: UUID (Foreign Key to `auth.users.id`)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

#### `team_members`
- `team_id`: UUID (Foreign Key to `teams.id`)
- `user_id`: UUID (Foreign Key to `auth.users.id`)
- `role`: `team_role` enum ('admin', 'accountant', 'viewer')
- `joined_at`: TIMESTAMPTZ
- `invited_by`: UUID (Foreign Key to `auth.users.id`)
- **Composite Primary Key**: (team_id, user_id)

#### `team_invitations`
- `id`: UUID (Primary Key)
- `team_id`: UUID (Foreign Key to `teams.id`)
- `email`: TEXT (Required)
- `role`: `team_role` enum
- `invited_by`: UUID (Foreign Key to `auth.users.id`)
- `token`: TEXT (Unique invitation token)
- `expires_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ

### Enums

#### `team_role`
- `admin`: Full access to all features
- `accountant`: Can view/edit invoices, manage QuickBooks, use AI tools
- `viewer`: Can only view invoices

## Role-Based Permissions

### Permission Matrix

| Permission | Admin | Accountant | Viewer |
|------------|-------|------------|--------|
| `can_manage_team` | ✅ | ❌ | ❌ |
| `can_invite_users` | ✅ | ❌ | ❌ |
| `can_remove_users` | ✅ | ❌ | ❌ |
| `can_change_roles` | ✅ | ❌ | ❌ |
| `can_delete_team` | ✅ | ❌ | ❌ |
| `can_view_invoices` | ✅ | ✅ | ✅ |
| `can_edit_invoices` | ✅ | ✅ | ❌ |
| `can_delete_invoices` | ✅ | ❌ | ❌ |
| `can_manage_quickbooks` | ✅ | ✅ | ❌ |
| `can_use_ai_tools` | ✅ | ✅ | ❌ |

## API Endpoints

### Teams

#### `GET /api/teams`
Get all teams the current user belongs to.

**Response:**
```json
{
  "teams": [
    {
      "team_id": "uuid",
      "team_name": "My Team",
      "role": "admin",
      "is_owner": true,
      "member_count": 3
    }
  ]
}
```

#### `POST /api/teams`
Create a new team.

**Request:**
```json
{
  "team_name": "My New Team",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "team_id": "uuid",
  "message": "Team created successfully"
}
```

#### `GET /api/teams/[teamId]`
Get team details.

**Response:**
```json
{
  "team": {
    "id": "uuid",
    "team_name": "My Team",
    "description": "Team description",
    "owner_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `PUT /api/teams/[teamId]`
Update team details (admin only).

**Request:**
```json
{
  "team_name": "Updated Team Name",
  "description": "Updated description"
}
```

#### `DELETE /api/teams/[teamId]`
Delete team (owner only).

### Team Members

#### `GET /api/teams/[teamId]/members`
Get team members.

**Response:**
```json
{
  "members": [
    {
      "team_id": "uuid",
      "user_id": "uuid",
      "role": "admin",
      "joined_at": "2024-01-01T00:00:00Z",
      "invited_by": "uuid",
      "users": {
        "email": "user@example.com",
        "raw_user_meta_data": {}
      }
    }
  ]
}
```

#### `POST /api/teams/[teamId]/members`
Invite a user to the team (admin only).

**Request:**
```json
{
  "email": "newuser@example.com",
  "role": "accountant"
}
```

**Response:**
```json
{
  "success": true,
  "invitation_token": "token",
  "message": "User invited successfully"
}
```

#### `PUT /api/teams/[teamId]/members/[userId]`
Update member role (admin only).

**Request:**
```json
{
  "role": "accountant"
}
```

#### `DELETE /api/teams/[teamId]/members/[userId]`
Remove member from team (admin only).

### Invitations

#### `POST /api/teams/invitations/accept`
Accept a team invitation.

**Request:**
```json
{
  "token": "invitation_token"
}
```

**Response:**
```json
{
  "success": true,
  "team_id": "uuid",
  "message": "Invitation accepted successfully"
}
```

## TypeScript Integration

### Types

```typescript
import { 
  TeamRole, 
  Team, 
  TeamMember, 
  TeamInvitation,
  UserTeam,
  UserRoleCheck,
  PermissionKey 
} from '../types/teams';
```

### Team Service

```typescript
import { getTeamService } from '../lib/team-service';

const teamService = getTeamService();

// Check user role
const roleCheck = await teamService.checkUserRole(userId, teamId, ['admin', 'accountant']);

// Check permission
const hasPermission = await teamService.checkUserPermission(userId, teamId, 'can_edit_invoices');

// Get user teams
const teams = await teamService.getUserTeams(userId);

// Create team
const teamId = await teamService.createTeam({ team_name: 'New Team' });

// Invite user
const token = await teamService.inviteUser({ team_id: teamId, email: 'user@example.com' });
```

### Permission Middleware

```typescript
import { withTeamPermission, checkTeamPermission } from '../lib/team-permissions';

// Check permission with middleware
const result = await withTeamPermission(
  userId, 
  teamId, 
  'can_use_ai_tools',
  async (context) => {
    // Perform AI operation
    return await aiTool.analyzeInvoices();
  }
);

// Get QuickBooks data with permission check
const invoices = await getTeamQuickBooksData(userId, teamId, 'invoices');
```

## Row Level Security (RLS)

### Teams Table Policies

- **Select**: Users can see teams they are members of
- **Insert**: Any authenticated user can create a team (becomes owner)
- **Update**: Only team admins can update team details
- **Delete**: Only team owner can delete the team

### Team Members Table Policies

- **Select**: Team members can see other team members
- **Insert**: Only team admins can add new members
- **Update**: Only team admins can update member roles
- **Delete**: Only team admins can remove members

### Team Invitations Table Policies

- **Select**: Team admins can see invitations for their team
- **Insert**: Only team admins can create invitations
- **Delete**: Team admins can delete invitations

## Database Functions

### `check_user_role(user_uuid, team_uuid, allowed_roles[])`
Check if a user has a specific role in a team.

### `get_user_teams(user_uuid)`
Get all teams a user belongs to with role and member count.

### `create_team_with_admin(team_name, description)`
Create a new team with the current user as admin.

### `invite_user_to_team(team_uuid, email_address, user_role)`
Invite a user to join a team.

### `accept_team_invitation(invitation_token)`
Accept a team invitation.

### `cleanup_expired_invitations()`
Remove expired team invitations.

## Integration with AI Tools

The team permissions system integrates with AI tools to ensure users can only access data they have permission to view:

```typescript
// In AI tools
const invoices = await withTeamPermission(
  userId, 
  teamId, 
  'can_view_invoices',
  async (context) => {
    return await getQBOSessionManager().getInvoices();
  }
);
```

## Integration with QuickBooks

QuickBooks operations respect team permissions:

```typescript
// Check if user can manage QuickBooks
const canManage = await canManageQuickBooks(userId, teamId);
if (!canManage) {
  throw new Error('Insufficient permissions to manage QuickBooks');
}

// Get QuickBooks data with permission check
const companyInfo = await getTeamQuickBooksData(userId, teamId, 'company');
```

## Security Considerations

1. **Role Validation**: All role assignments are validated against the enum
2. **Permission Checks**: Every operation checks user permissions
3. **RLS Policies**: Database-level security prevents unauthorized access
4. **Token Expiration**: Invitation tokens expire after 7 days
5. **Last Admin Protection**: Cannot demote or remove the last admin
6. **Email Validation**: Invitation emails are validated for format

## Migration

To apply the team collaboration system:

1. Run the migration script:
   ```bash
   node scripts/apply-team-migration.js
   ```

2. Copy the SQL content to your Supabase SQL Editor

3. Execute the migration

4. Verify the tables were created:
   ```sql
   SELECT * FROM public.teams LIMIT 1;
   SELECT * FROM public.team_members LIMIT 1;
   SELECT * FROM public.team_invitations LIMIT 1;
   ```

## Example Usage

### Creating a Team and Inviting Members

```typescript
// 1. Create a team
const teamId = await teamService.createTeam({
  team_name: 'Accounting Team',
  description: 'Team for managing invoices and accounting'
});

// 2. Invite team members
await teamService.inviteUser({
  team_id: teamId,
  email: 'accountant@company.com',
  role: 'accountant'
});

await teamService.inviteUser({
  team_id: teamId,
  email: 'viewer@company.com',
  role: 'viewer'
});
```

### Checking Permissions in AI Tools

```typescript
// In AI tool implementation
export async function analyzeInvoices(userId: string, teamId: string) {
  return await withTeamPermission(
    userId,
    teamId,
    'can_use_ai_tools',
    async (context) => {
      const invoices = await getTeamQuickBooksData(userId, teamId, 'invoices');
      return await aiModel.analyze(invoices);
    }
  );
}
```

### Frontend Team Selection

```typescript
// Get user's teams
const teams = await fetch('/api/teams').then(r => r.json());

// Check permissions for current team
const canEdit = await fetch(`/api/teams/${teamId}/permissions`)
  .then(r => r.json())
  .then(data => data.permissions.can_edit_invoices);
```

This system provides a robust foundation for multi-tenant collaboration while maintaining strict security and access control. 