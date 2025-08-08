import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseForRequest(request)
    
    // Get current user (supports Bearer Authorization too)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await (request as any).json()
    const { message, teamId, history = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    const teamService = getTeamService()

    // Check if user has access to AI tools in this team
    const roleCheck = await teamService.checkUserRole(user.id, teamId, ['admin', 'accountant'])
    if (!roleCheck.has_permission) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin or accountant role required.' },
        { status: 403 }
      )
    }

    // Get team details for context
    const team = await teamService.getTeam(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    // Build system prompt with team context
    const systemPrompt = `You are an AI assistant for the invoice management system. You're helping the team "${team.team_name}" with their invoice management tasks.

Your capabilities include:
- Creating and managing invoices
- Analyzing invoice data and trends
- Providing business insights
- QuickBooks integration support
- Financial reporting and analysis

Current user role: ${roleCheck.user_role}
Team: ${team.team_name}
${team.description ? `Team description: ${team.description}` : ''}

Please provide helpful, accurate, and actionable responses. If you need to perform specific actions like creating invoices or accessing data, let the user know what information you need.

Always be professional, concise, and focus on practical business advice.`

    // Prepare conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Generate AI response
    const result = await generateText({
      model: openai('gpt-4'),
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    })

    return NextResponse.json({
      success: true,
      message: result.text
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate response' },
      { status: 500 }
    )
  }
} 