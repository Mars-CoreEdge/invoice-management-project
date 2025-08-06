import { NextRequest, NextResponse } from 'next/server';
import { getTeamService } from '../../../../../../lib/team-service';
import { getUserIdFromRequest } from '../../../../../../lib/utils';
import { TeamRole } from '../../../../../../types/teams';

export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string; userId: string } }
) {
  try {
    const currentUserId = await getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamService = getTeamService();
    
    // Check if user can change roles
    const hasPermission = await teamService.checkUserPermission(
      currentUserId, 
      params.teamId, 
      'can_change_roles'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: { role: TeamRole } = await request.json();
    
    if (!body.role || !['admin', 'accountant', 'viewer'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 }
      );
    }

    // Prevent demoting the last admin
    if (body.role !== 'admin') {
      const currentRole = await teamService.getUserRole(params.userId, params.teamId);
      if (currentRole === 'admin') {
        const adminCount = await teamService.getTeamMembers(params.teamId)
          .then(members => members.filter(m => m.role === 'admin').length);
        
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot demote the last admin' },
            { status: 400 }
          );
        }
      }
    }

    const success = await teamService.updateMemberRole(
      params.teamId, 
      params.userId, 
      body.role
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Member role updated successfully' 
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; userId: string } }
) {
  try {
    const currentUserId = await getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamService = getTeamService();
    
    // Check if user can remove members
    const hasPermission = await teamService.checkUserPermission(
      currentUserId, 
      params.teamId, 
      'can_remove_users'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Prevent removing the last admin
    const memberRole = await teamService.getUserRole(params.userId, params.teamId);
    if (memberRole === 'admin') {
      const adminCount = await teamService.getTeamMembers(params.teamId)
        .then(members => members.filter(m => m.role === 'admin').length);
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin' },
          { status: 400 }
        );
      }
    }

    // Prevent removing yourself
    if (params.userId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the team' },
        { status: 400 }
      );
    }

    const success = await teamService.removeMember(params.teamId, params.userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Member removed successfully' 
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
} 