import { NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

// Mock invoice data for analysis
const mockInvoices = [
  {
    id: '1',
    invoice_number: 'INV-2024-001',
    customer_name: 'Acme Corporation',
    total_amount: 2500.00,
    balance: 2500.00,
    status: 'pending',
    due_date: '2024-02-15',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    invoice_number: 'INV-2024-002',
    customer_name: 'Tech Solutions Inc',
    total_amount: 1800.00,
    balance: 0.00,
    status: 'paid',
    due_date: '2024-02-10',
    created_at: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    invoice_number: 'INV-2024-003',
    customer_name: 'Global Industries',
    total_amount: 3200.00,
    balance: 3200.00,
    status: 'overdue',
    due_date: '2024-01-20',
    created_at: '2024-01-05T11:20:00Z'
  },
  {
    id: '4',
    invoice_number: 'INV-2024-004',
    customer_name: 'Startup Ventures',
    total_amount: 950.00,
    balance: 950.00,
    status: 'draft',
    due_date: '2024-03-01',
    created_at: '2024-01-20T16:45:00Z'
  },
  {
    id: '5',
    invoice_number: 'INV-2024-005',
    customer_name: 'Enterprise Solutions',
    total_amount: 4200.00,
    balance: 0.00,
    status: 'paid',
    due_date: '2024-02-05',
    created_at: '2024-01-08T13:15:00Z'
  }
]

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

    const body = await request.json()
    const { query, teamId, analysisType = 'general' } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
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

    // Analyze invoice data
    const analysis = await analyzeInvoices(query, analysisType, team.team_name)

    return NextResponse.json({
      success: true,
      analysis,
      data: mockInvoices // Include raw data for reference
    })
  } catch (error) {
    console.error('Error in AI invoice analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze invoices' },
      { status: 500 }
    )
  }
}

async function analyzeInvoices(query: string, analysisType: string, teamName: string) {
  // Calculate basic statistics
  const totalInvoices = mockInvoices.length
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
  const outstandingAmount = mockInvoices.reduce((sum, inv) => sum + inv.balance, 0)
  const paidInvoices = mockInvoices.filter(inv => inv.status === 'paid').length
  const overdueInvoices = mockInvoices.filter(inv => inv.status === 'overdue').length
  const pendingInvoices = mockInvoices.filter(inv => inv.status === 'pending').length

  // Calculate average invoice value
  const averageInvoiceValue = totalRevenue / totalInvoices

  // Find top customers
  const customerTotals = mockInvoices.reduce((acc, inv) => {
    acc[inv.customer_name] = (acc[inv.customer_name] || 0) + inv.total_amount
    return acc
  }, {} as Record<string, number>)

  const topCustomers = Object.entries(customerTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([name, total]) => ({ name, total }))

  // Calculate days overdue for overdue invoices
  const today = new Date()
  const overdueAnalysis = mockInvoices
    .filter(inv => inv.status === 'overdue')
    .map(inv => {
      const dueDate = new Date(inv.due_date)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name,
        amount: inv.balance,
        days_overdue: daysOverdue
      }
    })

  // Build context for AI analysis
  const context = `
Team: ${teamName}
Total Invoices: ${totalInvoices}
Total Revenue: $${totalRevenue.toFixed(2)}
Outstanding Amount: $${outstandingAmount.toFixed(2)}
Paid Invoices: ${paidInvoices}
Overdue Invoices: ${overdueInvoices}
Pending Invoices: ${pendingInvoices}
Average Invoice Value: $${averageInvoiceValue.toFixed(2)}

Top Customers:
${topCustomers.map(c => `- ${c.name}: $${c.total.toFixed(2)}`).join('\n')}

Overdue Invoices:
${overdueAnalysis.map(inv => `- ${inv.invoice_number} (${inv.customer_name}): $${inv.amount.toFixed(2)} - ${inv.days_overdue} days overdue`).join('\n')}

Recent Invoices:
${mockInvoices.slice(-5).map(inv => `- ${inv.invoice_number}: $${inv.total_amount.toFixed(2)} (${inv.status})`).join('\n')}
`

  // Generate AI analysis based on query and type
  const systemPrompt = `You are an AI financial analyst specializing in invoice management and business insights. You're analyzing data for the team "${teamName}".

Your role is to provide:
- Clear, actionable insights about invoice performance
- Recommendations for improving cash flow
- Identification of trends and patterns
- Suggestions for customer relationship management
- Risk assessment for overdue invoices

Always be professional, data-driven, and provide specific, actionable advice. Use the provided data to support your analysis.

Analysis Type: ${analysisType}
User Query: ${query}

Available Data:
${context}

Please provide a comprehensive analysis that addresses the user's query while offering valuable business insights.`

  const result = await generateText({
    model: openai('gpt-4'),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ],
    maxTokens: 1500,
    temperature: 0.7,
  })

  return {
    summary: result.text,
    statistics: {
      totalInvoices,
      totalRevenue,
      outstandingAmount,
      paidInvoices,
      overdueInvoices,
      pendingInvoices,
      averageInvoiceValue,
      collectionRate: ((totalRevenue - outstandingAmount) / totalRevenue * 100).toFixed(1) + '%'
    },
    topCustomers,
    overdueAnalysis,
    recommendations: generateRecommendations(overdueInvoices, outstandingAmount, averageInvoiceValue)
  }
}

function generateRecommendations(overdueCount: number, outstandingAmount: number, averageInvoice: number) {
  const recommendations = []

  if (overdueCount > 0) {
    recommendations.push({
      type: 'urgent',
      title: 'Address Overdue Invoices',
      description: `You have ${overdueCount} overdue invoices totaling $${outstandingAmount.toFixed(2)}. Consider implementing automated payment reminders and follow-up procedures.`
    })
  }

  if (outstandingAmount > averageInvoice * 3) {
    recommendations.push({
      type: 'important',
      title: 'Improve Collection Process',
      description: 'Your outstanding amount is significantly high. Consider offering early payment discounts or implementing stricter payment terms.'
    })
  }

  if (averageInvoice < 1000) {
    recommendations.push({
      type: 'suggestion',
      title: 'Optimize Pricing Strategy',
      description: 'Your average invoice value is relatively low. Consider bundling services or reviewing your pricing strategy to increase revenue per customer.'
    })
  }

  recommendations.push({
    type: 'general',
    title: 'Regular Review',
    description: 'Schedule weekly reviews of your invoice status and follow up with customers who have pending payments.'
  })

  return recommendations
} 