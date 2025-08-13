import { NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(request: Request) {
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
    const { message, messages, teamId } = body
    // Support both shapes: { message, history } and { messages: [{role,content}...] }
    let finalMessage: string | null = null
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = []

    if (typeof message === 'string' && message.trim()) {
      finalMessage = message.trim()
      history = Array.isArray(body.history)
        ? body.history.map((m: any) => ({ role: m.role, content: m.content }))
        : []
    } else if (Array.isArray(messages) && messages.length > 0) {
      const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')
      finalMessage = lastUser?.content || null
      history = messages
        .slice(0, -1)
        .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    }

    if (!finalMessage) {
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

    // Prepare conversation history for streaming
    const messagesForModel = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: finalMessage },
    ]

    // Stream the response in the format expected by useChat
    const result = await streamText({
      model: openai('gpt-4'),
      messages: messagesForModel,
      maxTokens: 1000,
      temperature: 0.7,
    })

    return result.toAIStreamResponse()
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate response' },
      { status: 500 }
    )
  }
} 