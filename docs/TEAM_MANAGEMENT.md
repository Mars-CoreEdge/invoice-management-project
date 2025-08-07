# Team Management & Role-Based Access Control

This document describes the team collaboration features implemented in the Invoice Management Tool, including role-based access control (RBAC) and team management capabilities.

## Overview

The application now supports multi-tenant team collaboration with the following features:

- **Team Creation**: Users can create teams (workspaces) for collaboration
- **Role-Based Access**: Three roles: Admin, Accountant, and Viewer
- **User Invitations**: Secure invitation system with email-based invites
- **Permission Management**: Granular permissions based on user roles
- **Team Isolation**: Each team's data is isolated from other teams

## Database Schema

### Tables

#### `teams`
- `id` (uuid, primary key)
- `team_name` (text, required)
- `description` (text, optional)
- `owner_id` (uuid, foreign key to `auth.users.id`)
- `created_at` (timestampz)
- `updated_at` (timestampz)

#### `team_members`
- `team_id` (uuid, foreign key to `teams.id`)
- `user_id` (uuid, foreign key to `auth.users.id`)
- `role` (text, check constraint: 'admin', 'accountant', 'viewer')
- `joined_at` (timestampz)
- `invited_by` (uuid, foreign key to `auth.users.id`)
- Composite primary key: (team_id, user_id)

#### `team_invitations`
- `id` (uuid, primary key)
- `team_id` (uuid, foreign key to `teams.id`)
- `email` (text, required)
- `role` (text, check constraint: 'admin', 'accountant', 'viewer')
- `invited_by` (uuid, foreign key to `auth.users.id`)
- `token` (text, unique)
- `expires_at` (timestampz)
- `created_at` (timestampz)

## User Roles & Permissions

### Admin Role
- ✅ Create and manage teams
- ✅ Invite users to team
- ✅ Remove users from team
- ✅ Change user roles
- ✅ Access all team features
- ✅ View and manage invoices
- ✅ Use AI chat features

### Accountant Role
- ✅ View team information
- ✅ Access invoice data
- ✅ Use AI chat features
- ✅ View team members
- ❌ Invite users
- ❌ Manage team settings
- ❌ Remove team members

### Viewer Role
- ✅ View team information
- ✅ View invoice data (read-only)
- ✅ Use AI chat features
- ✅ View team members
- ❌ Invite users
- ❌ Manage team settings
- ❌ Edit invoice data

## Frontend Components

### TeamSelector
A dropdown component that allows users to switch between teams they belong to.

**Features:**
- Auto-selects first team on load
- Shows team name and user role
- Visual indicators for team owner
- Role-based styling

### TeamManagement
A comprehensive team management interface.

**Features:**
- Create new teams
- View team members
- Invite new users
- Manage user roles
- View pending invitations
- Team statistics

### TeamContext
React context for managing team state across the application.

**Provides:**
- Selected team ID
- User role in current team
- Permission checks
- Team list
- Loading states

## API Endpoints

### Teams
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create new team
- `GET /api/teams/[id]` - Get team details
- `PUT /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

### Team Members
- `GET /api/teams/[id]/members` - Get team members
- `POST /api/teams/[id]/members` - Invite user to team
- `PUT /api/teams/[id]/members/[userId]` - Update member role
- `DELETE /api/teams/[id]/members/[userId]` - Remove member

### Invitations
- `GET /api/teams/invitations` - Get user's invitations
- `GET /api/teams/[id]/invitations` - Get team invitations
- `GET /api/teams/invitations/[token]` - Get invitation details
- `POST /api/teams/invitations/accept` - Accept invitation

## Usage Examples

### Creating a Team
```typescript
const response = await fetch('/api/teams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    team_name: 'My Accounting Team',
    description: 'Team for managing client accounts'
  })
});
```

### Inviting a User
```typescript
const response = await fetch(`/api/teams/${teamId}/members`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    role: 'accountant'
  })
});
```

### Using Team Context
```typescript
import { useTeam } from '@/components/TeamContext';

function MyComponent() {
  const { selectedTeamId, userRole, canInviteUsers } = useTeam();
  
  if (!canInviteUsers) {
    return <div>You don't have permission to invite users</div>;
  }
  
  return <InviteUserForm teamId={selectedTeamId} />;
}
```

## Security Features

### Row Level Security (RLS)
All team-related tables have RLS policies that ensure:
- Users can only access data from teams they belong to
- Only admins can modify team settings
- Invitations are properly scoped to teams

### Token-Based Invitations
- Secure invitation tokens with expiration
- Email verification for invitations
- Automatic cleanup of expired invitations

### Permission Checks
- Server-side validation of all operations
- Role-based access control on all endpoints
- Client-side permission indicators

## Integration with Existing Features

### QuickBooks Integration
- Team-scoped QuickBooks tokens
- Each team can connect to different QuickBooks accounts
- Role-based access to QuickBooks data

### AI Chat
- Team-scoped chat sessions
- Role-based access to invoice data
- Permission-aware AI responses

### Invoice Management
- Team-scoped invoice data
- Role-based permissions for viewing/editing
- Admin-only access to sensitive operations

## Best Practices

### For Developers
1. Always check permissions before performing operations
2. Use the TeamContext for team-related state
3. Implement proper error handling for permission denied cases
4. Test with different user roles

### For Users
1. Create teams for different client groups
2. Use appropriate roles for team members
3. Regularly review team permissions
4. Clean up expired invitations

## Troubleshooting

### Common Issues

**"Access Denied" errors**
- Check if user is a member of the team
- Verify user has appropriate role for the operation
- Ensure team is properly selected

**Invitation not working**
- Check if invitation has expired
- Verify email address is correct
- Ensure user is not already a team member

**Team not showing up**
- Check if user is properly added to team
- Verify RLS policies are working
- Check for any database constraints

### Debug Mode
Enable debug logging by setting `DEBUG_TEAMS=true` in environment variables to see detailed team-related logs. 