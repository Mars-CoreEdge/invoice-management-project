#!/usr/bin/env node

// Dedicated tester for POST /api/chat

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

// Load env from .env.local if present
;(function loadLocalEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      content.split('\n').forEach((line) => {
        const t = line.trim()
        if (!t || t.startsWith('#')) return
        const [key, ...valParts] = t.split('=')
        if (!key || valParts.length === 0) return
        const value = valParts.join('=').replace(/^['"]|['"]$/g, '')
        if (!process.env[key]) process.env[key] = value
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

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const client = u.protocol === 'https:' ? https : http
    const req = client.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {}
            resolve({ status: res.statusCode, data: json })
          } catch {
            resolve({ status: res.statusCode, data })
          }
        })
      }
    )
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
  const created = await makeRequest(`${BASE_URL}/api/teams`, { method: 'POST', headers, body: { team_name: `Chat Test Team ${Date.now()}`, description: 'For chat tests' } })
  if (created.status === 200 && created.data?.success) return created.data.data.team_id
  throw new Error('Failed to obtain a team')
}

;(async () => {
  try {
    console.log('🔐 Authenticating...')
    const session = await authenticate()
    const headers = authHeaders(session)
    console.log('👥 Ensuring a team...')
    const teamId = await getOrCreateTeamId(headers)

    console.log('💬 Calling POST /api/chat ...')
    const res = await makeRequest(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: {
        message: 'Show me my latest invoices and any overdue ones.',
        teamId,
        history: [],
      },
    })

    console.log('Status:', res.status)
    console.log('Response:', typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2))
    process.exit(res.status === 200 ? 0 : 1)
  } catch (e) {
    console.error('❌ Test failed:', e.message)
    process.exit(1)
  }
})()


