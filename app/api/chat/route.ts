import { NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { getQBOSessionManager } from '@/lib/qbo-session'

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

    // Build system prompt with team context and tool usage
    const systemPrompt = `You are an AI assistant for the invoice management system, helping team "${team.team_name}".

Capabilities:
- Create, update, delete, and list invoices from QuickBooks sandbox
- Analyze invoice trends and provide insights

Tool usage:
- When users request real data (e.g., "show my invoices"), call the appropriate tool instead of returning JSON or pseudo-code.
- After using a tool, present clear, concise results (bulleted list or table-like text). Do not return raw JSON.

Keep responses professional and business-focused.`

    // Prepare conversation history for streaming
    const messagesForModel = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: finalMessage },
    ]

    // Define tools the model can invoke
    const listInvoices = tool({
      description: 'List recent QuickBooks invoices for the current team',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max number of invoices to return', default: 10 },
        },
      },
      execute: async ({ limit = 10 }: any) => {
        const manager = getQBOSessionManager()
        const session = await manager.getSession(user.id)
        if (!session) return 'QuickBooks is not connected. Please connect QuickBooks first.'
        const result = await manager.getInvoices(session, Math.max(1, Math.min(50, Number(limit) || 10)), 0)
        if (!result.success) return `Failed to fetch invoices: ${result.error || 'Unknown error'}`
        const rows: any[] = Array.isArray(result.data) ? result.data : []
        if (rows.length === 0) return 'No invoices found.'
        const lines = rows.slice(0, limit).map((inv: any) => {
          const doc = inv.DocNumber || inv.docNumber || inv.Id
          const date = inv.TxnDate || inv.txnDate || inv.MetaData?.CreateTime?.slice(0,10) || ''
          const total = typeof inv.TotalAmt !== 'undefined' ? inv.TotalAmt : (inv.totalAmount || 0)
          const bal = typeof inv.Balance !== 'undefined' ? inv.Balance : (inv.balance || 0)
          const status = Number(bal) === 0 ? 'paid' : 'unpaid'
          const name = inv.CustomerRef?.name || inv.customer_name || inv.CustomerRef || 'Customer'
          return `- ${doc} • ${name} • ${date} • Total $${Number(total).toFixed(2)} • ${status}`
        })
        return `Here are your recent invoices:\n${lines.join('\n')}`
      },
    })

    // Stream the response with tools enabled (compatible with useChat)
    const result = await streamText({
      model: openai('gpt-4'),
      messages: messagesForModel,
      tools: { listInvoices },
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