import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

export async function POST(request: Request) {
  try {
    const { email, role, teamId, token } = await (request as any).json()
    if (!email || !role || !teamId || !token) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const acceptUrl = `${baseUrl}/teams/invitations/accept?token=${encodeURIComponent(token)}`

    // Configure SendGrid
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.NEXT_PUBLIC_FROM_EMAIL
    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      console.warn('SendGrid not configured. Skipping real email send.')
      return NextResponse.json({ success: true, warning: 'SendGrid not configured' })
    }
    sgMail.setApiKey(SENDGRID_API_KEY)

    const msg = {
      to: email,
      from: SENDGRID_FROM_EMAIL,
      subject: 'You have been invited to a team',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>You have been invited to join a team</h2>
          <p>You have been invited to join team <strong>${teamId}</strong> with role <strong>${role}</strong>.</p>
          <p>Click the button below to accept your invitation:</p>
          <p>
            <a href="${acceptUrl}" style="background:#7c3aed;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Accept Invitation</a>
          </p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p><a href="${acceptUrl}">${acceptUrl}</a></p>
        </div>
      `
    }

    await sgMail.send(msg as any)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending invite email:', error?.message || error)
    return NextResponse.json({ success: false, error: 'Failed to send invite email' }, { status: 500 })
  }
}


