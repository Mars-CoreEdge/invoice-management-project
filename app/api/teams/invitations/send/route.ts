import { NextRequest, NextResponse } from 'next/server'

// Simple email sender stub using Resend/SMTP could be integrated here.
// For now we log the invite and return success so UI flow proceeds.

export async function POST(request: NextRequest) {
  try {
    const { email, role, teamId, token } = await request.json()
    if (!email || !role || !teamId || !token) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const acceptUrl = `${baseUrl}/teams/invitations/accept?token=${encodeURIComponent(token)}`

    console.log('Sending invite email:', { to: email, role, teamId, acceptUrl })

    // TODO: Integrate actual email provider here (Resend/SendGrid/SMTP)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending invite email:', error)
    return NextResponse.json({ success: false, error: 'Failed to send invite email' }, { status: 500 })
  }
}


