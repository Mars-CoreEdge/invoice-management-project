#!/usr/bin/env node

/**
 * QBO Endpoint Probe
 * Logs results like: "GET /api/invoices/qbo 401 in 755ms"
 * Can run unauthenticated or authenticated (Supabase), and optionally pass teamId.
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

// Load .env.local
;(function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      content.split('\n').forEach((line) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) return
        const [key, ...valueParts] = trimmed.split('=')
        if (!key || valueParts.length === 0) return
        const value = valueParts.join('=').replace(/^['"]|['"]$/g, '')
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

const color = { reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m' }
const logLine = (method, path, status, ms) => {
  console.log(`${method} ${path} ${status} in ${ms}ms`)
}

function makeRequest(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const isHttps = u.protocol === 'https:'
    const client = isHttps ? https : http
    const started = process.hrtime.bigint()
    const req = client.request({
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    }, (res) => {
      let data = ''
      res.on('data', (d) => data += d)
      res.on('end', () => {
        const ended = process.hrtime.bigint()
        const ms = Number(ended - started) / 1e6
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {}, ms: Math.round(ms) })
        } catch {
          resolve({ status: res.statusCode, data, ms: Math.round(ms) })
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function authenticateIfNeeded(doAuth) {
  if (!doAuth) return null
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  let { data, error } = await supabase.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
  if (error && SERVICE_ROLE_KEY) {
    const { createClient: adminClient } = await import('@supabase/supabase-js')
    const admin = adminClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    await admin.auth.admin.createUser({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD, email_confirm: true }).catch(() => {})
    const again = await supabase.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
    data = again.data
  }
  if (!data?.session) return null
  const cookie = `sb-access-token=${data.session.access_token}; sb-refresh-token=${data.session.refresh_token}`
  return { Cookie: cookie, Authorization: `Bearer ${data.session.access_token}` }
}

async function getOrCreateTeam(headers) {
  const list = await makeRequest(`${BASE_URL}/api/teams`, { headers })
  if (list.status === 200 && list.data?.success && Array.isArray(list.data.data) && list.data.data.length > 0) {
    return list.data.data[0].team_id || list.data.data[0].id
  }
  const created = await makeRequest(`${BASE_URL}/api/teams`, { method: 'POST', headers, body: { team_name: `QBO Probe Team ${Date.now()}` } })
  if (created.status === 200 && created.data?.success) return created.data.data.team_id
  return ''
}

async function run() {
  const args = process.argv.slice(2)
  let doAuth = false
  let teamId = ''
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--auth': doAuth = true; break
      case '--team': teamId = args[++i]; break
      case '--base-url': process.env.NEXT_PUBLIC_APP_URL = args[++i]; break
    }
  }

  const headers = await authenticateIfNeeded(doAuth) || {}
  if (doAuth && !teamId) teamId = await getOrCreateTeam(headers)

  const endpoints = [
    { method: 'GET', path: '/api/quickbooks/status' },
    { method: 'GET', path: '/api/qbo/company' },
    { method: 'GET', path: '/api/qbo/customers' },
    { method: 'GET', path: '/api/qbo/items' },
    { method: 'GET', path: `/api/qbo/invoices${teamId ? `?teamId=${encodeURIComponent(teamId)}&limit=5` : ''}` },
    { method: 'GET', path: '/api/invoices/qbo' },
    // Create helpers (only when teamId present)
    ...(teamId ? [
      { method: 'POST', path: `/api/qbo/customers/create?teamId=${encodeURIComponent(teamId)}`, body: { DisplayName: `Probe Customer ${Date.now()}` } },
      { method: 'POST', path: `/api/qbo/items/create?teamId=${encodeURIComponent(teamId)}`, body: { Name: `Probe Service ${Date.now()}`, Type: 'Service', UnitPrice: 25 } },
    ] : [])
  ]

  console.log(`${color.bold}QBO Endpoint Probe (${doAuth ? 'authenticated' : 'unauthenticated'})${color.reset}`)
  console.log(`${color.dim}Base: ${BASE_URL}${color.reset}`)
  if (teamId) console.log(`${color.dim}Team: ${teamId}${color.reset}`)

  for (const ep of endpoints) {
    const url = `${BASE_URL}${ep.path}`
    try {
      const res = await makeRequest(url, { method: ep.method, headers, body: ep.body })
      logLine(ep.method, ep.path, res.status, res.ms)
    } catch (e) {
      logLine(ep.method, ep.path, 'ERR', 0)
    }
  }
}

run().catch((e) => { console.error(e); process.exit(1) })


