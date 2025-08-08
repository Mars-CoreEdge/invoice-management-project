#!/usr/bin/env node

// Test end-to-end team invite flow and SendGrid email send

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

// Load env from .env.local if present
;(function loadLocalEnv() {
  try {
    const p = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(p)) {
      const c = fs.readFileSync(p, 'utf8')
      c.split('\n').forEach((line) => {
        const t = line.trim()
        if (!t || t.startsWith('#')) return
        const [k, ...v] = t.split('=')
        if (!k || v.length === 0) return
        const val = v.join('=').replace(/^['"]|['"]$/g, '')
        if (!process.env[k]) process.env[k] = val
      })
    }
  } catch {}
})()

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'
const INVITE_TARGET_EMAIL = process.env.INVITE_TARGET_EMAIL || process.env.SENDGRID_FROM_EMAIL || TEST_USER_EMAIL

function log(s) { console.log(s) }

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const client = u.protocol === 'https:' ? https : http
    const req = client.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    }, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} }) }
        catch { resolve({ status: res.statusCode, data }) }
      })
    })
    req.on('error', reject)
    if (options.body) req.write(JSON.stringify(options.body))
    req.end()
  })
}

async function authenticate() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  let { data, error } = await supabase.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
  if (error && SERVICE_ROLE_KEY) {
    const { createClient: adminFactory } = await import('@supabase/supabase-js')
    const admin = adminFactory(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { error: adminErr } = await admin.auth.admin.createUser({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD, email_confirm: true })
    if (adminErr) throw new Error(`Admin create user failed: ${adminErr.message}`)
    const retry = await supabase.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
    data = retry.data
  }
  if (!data?.session) throw new Error('Authentication failed (no session)')
  return data.session
}

function authHeaders(session) {
  return { Cookie: `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`, Authorization: `Bearer ${session.access_token}` }
}

async function getOrCreateTeamId(headers) {
  const list = await makeRequest(`${BASE_URL}/api/teams`, { headers })
  if (list.status === 200 && list.data?.success && Array.isArray(list.data.data) && list.data.data.length) {
    return list.data.data[0].team_id || list.data.data[0].id
  }
  const created = await makeRequest(`${BASE_URL}/api/teams`, { method: 'POST', headers, body: { team_name: `Invite Test Team ${Date.now()}`, description: 'For invite tests' } })
  if (created.status === 200 && created.data?.success) return created.data.data.team_id
  throw new Error('Failed to obtain a team')
}

;(async () => {
  try {
    log('🔐 Authenticating...')
    const session = await authenticate()
    const headers = authHeaders(session)

    log('👥 Ensuring a team...')
    const teamId = await getOrCreateTeamId(headers)

    log(`✉️ Sending invite to ${INVITE_TARGET_EMAIL} ...`)
    const res = await makeRequest(`${BASE_URL}/api/teams/${teamId}/invite`, {
      method: 'POST',
      headers,
      body: { email: INVITE_TARGET_EMAIL, role: 'viewer' },
    })

    log('Status:', res.status)
    log('Response:', typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2))

    if (res.status !== 200) {
      console.error('❌ Invite API failed. Check server logs and env (SENDGRID_API_KEY, SENDGRID_FROM_EMAIL).')
      process.exit(1)
    }

    log('✅ Invite triggered. Check SendGrid Activity and the target inbox.')
    process.exit(0)
  } catch (e) {
    console.error('❌ Test failed:', e.message)
    process.exit(1)
  }
})()


