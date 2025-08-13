#!/usr/bin/env node

/**
 * QuickBooks Invoice CRUD Test
 * Authenticates a user, ensures a team, and exercises:
 * - List invoices
 * - Create invoice (using first available customer + item)
 * - Read invoice by id and DocNumber
 * - Update invoice (PrivateNote)
 * - Delete invoice
 *
 * Safe by default: creates and deletes only the test-created invoice.
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

// Config
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

// Colors
const color = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}
const log = (msg, c='') => console.log(`${c}${msg}${color.reset}`)

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const isHttps = u.protocol === 'https:'
    const client = isHttps ? https : http
    const req = client.request({
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    }, (res) => {
      let data = ''
      res.on('data', (d) => data += d)
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
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log('Missing Supabase env; cannot authenticate.', color.red)
    return null
  }
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  let { data: signInData, error } = await supabase.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
  if (error) {
    if (SERVICE_ROLE_KEY) {
      const { createClient: createAdmin } = await import('@supabase/supabase-js')
      const admin = createAdmin(SUPABASE_URL, SERVICE_ROLE_KEY)
      const { error: adminErr } = await admin.auth.admin.createUser({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD, email_confirm: true })
      if (adminErr) { log(`Admin create user failed: ${adminErr.message}`, color.red); return null }
      const again = await supabase.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
      if (again.error) { log(`Sign in failed after admin user: ${again.error.message}`, color.red); return null }
      signInData = again.data
    } else {
      log('No service role; cannot auto-create test user.', color.red)
      return null
    }
  }
  if (!signInData?.session) return null
  return { access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token }
}

function authHeaders(session) {
  if (!session) return {}
  const cookie = `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`
  return { Cookie: cookie, Authorization: `Bearer ${session.access_token}` }
}

async function getOrCreateTeam(headers) {
  const list = await makeRequest(`${BASE_URL}/api/teams`, { headers })
  if (list.status === 200 && list.data?.success && Array.isArray(list.data.data) && list.data.data.length > 0) {
    return list.data.data[0].team_id || list.data.data[0].id
  }
  const created = await makeRequest(`${BASE_URL}/api/teams`, { method: 'POST', headers, body: { team_name: `QBO Test Team ${Date.now()}` } })
  if (created.status === 200 && created.data?.success) return created.data.data.team_id
  return null
}

async function main() {
  log('QBO Invoice CRUD Test', color.bold)
  log(`Base URL: ${BASE_URL}`, color.cyan)

  const session = await authenticate()
  if (!session) { log('Auth failed; aborting.', color.red); process.exit(1) }
  const headers = authHeaders(session)

  const teamId = await getOrCreateTeam(headers)
  if (!teamId) { log('No team available; aborting.', color.red); process.exit(1) }
  log(`Team: ${teamId}`, color.cyan)

  // Check QBO connectivity (status endpoint may return 401 if not connected)
  const status = await makeRequest(`${BASE_URL}/api/quickbooks/status`, { headers })
  if (status.status !== 200) {
    log('QuickBooks not connected for this user; skipping CRUD test.', color.yellow)
    process.exit(0)
  }

  // Gather first customer and item to create invoice
  const customers = await makeRequest(`${BASE_URL}/api/qbo/customers`, { headers })
  const items = await makeRequest(`${BASE_URL}/api/qbo/items`, { headers })
  if (customers.status !== 200 || items.status !== 200 || !Array.isArray(customers.data?.data) || customers.data.data.length === 0 || !Array.isArray(items.data?.data) || items.data.data.length === 0) {
    log('Could not fetch customers/items; cannot create invoice. Exiting.', color.red)
    process.exit(1)
  }
  const customerId = String(customers.data.data[0].Id || customers.data.data[0].id)
  const itemId = String(items.data.data[0].Id || items.data.data[0].id)
  log(`Using Customer ${customerId}, Item ${itemId}`, color.cyan)

  // 1) List invoices
  const list1 = await makeRequest(`${BASE_URL}/api/qbo/invoices?teamId=${teamId}&limit=10`, { headers })
  log(`List invoices: ${list1.status}`, list1.status === 200 ? color.green : color.red)

  // 2) Create invoice
  const createBody = {
    Line: [
      {
        DetailType: 'SalesItemLineDetail',
        Amount: 25,
        SalesItemLineDetail: { ItemRef: { value: itemId } }
      }
    ],
    CustomerRef: { value: customerId },
    PrivateNote: 'Created by automated CRUD test',
    TxnDate: new Date().toISOString().slice(0,10)
  }
  const created = await makeRequest(`${BASE_URL}/api/qbo/invoices?teamId=${teamId}`, { method: 'POST', headers, body: createBody })
  if (created.status !== 200 || !created.data?.success || !created.data?.data?.Id) {
    log(`Create invoice failed: ${created.status} ${JSON.stringify(created.data)}`, color.red)
    process.exit(1)
  }
  const newId = String(created.data.data.Id)
  const newDoc = String(created.data.data.DocNumber || '')
  log(`Created invoice Id=${newId} Doc=${newDoc}`, color.green)

  // 3) Read invoice by id
  const fetchedById = await makeRequest(`${BASE_URL}/api/qbo/invoices/${encodeURIComponent(newId)}?teamId=${teamId}&by=id`, { headers })
  log(`Fetch by Id: ${fetchedById.status}`, fetchedById.status === 200 ? color.green : color.red)

  // 3b) Read by DocNumber if available
  if (newDoc) {
    const fetchedByDoc = await makeRequest(`${BASE_URL}/api/qbo/invoices/${encodeURIComponent(newDoc)}?teamId=${teamId}&by=doc`, { headers })
    log(`Fetch by DocNumber: ${fetchedByDoc.status}`, fetchedByDoc.status === 200 ? color.green : color.red)
  }

  // 4) Update invoice
  const update = await makeRequest(`${BASE_URL}/api/qbo/invoices/${encodeURIComponent(newId)}?teamId=${teamId}`, {
    method: 'PUT', headers, body: { PrivateNote: `Updated by test at ${new Date().toISOString()}` }
  })
  log(`Update: ${update.status}`, update.status === 200 ? color.green : color.red)

  // 5) Delete invoice
  const del = await makeRequest(`${BASE_URL}/api/qbo/invoices/${encodeURIComponent(newId)}?teamId=${teamId}`, { method: 'DELETE', headers })
  log(`Delete: ${del.status}`, del.status === 200 ? color.green : color.red)

  process.exit(0)
}

// CLI args
const args = process.argv.slice(2)
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-url') process.env.NEXT_PUBLIC_APP_URL = args[++i]
}

main().catch((e) => { log(`Test failed: ${e.message}`, color.red); process.exit(1) })


