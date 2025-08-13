#!/usr/bin/env node

/**
 * Invoices Full Test Suite
 * - Auth via Supabase (creates test user if service role available)
 * - Ensure a team exists
 * - Internal invoices (Supabase): list, create, analytics
 * - QuickBooks: status, customers/items, list, filtered list, create, read(id/doc), update, delete
 * - Saves JSON report
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
        const value = valueParts.join('=') .replace(/^['"]|['"]$/g, '')
        if (!process.env[key]) process.env[key] = value
      })
    }
  } catch {}
})()

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

const color = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m' }
const log = (msg, c='') => console.log(`${c}${msg}${color.reset}`)

const results = []
function addResult(name, status, details='') { results.push({ name, status, details }) ; log(`${status === 'PASS' ? '✓' : '✗'} ${name}${details ? ' - ' + details : ''}`, status === 'PASS' ? color.green : color.red) }

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const isHttps = u.protocol === 'https:'
    const client = isHttps ? https : http
    const req = client.request({ hostname: u.hostname, port: u.port || (isHttps ? 443 : 80), path: u.pathname + u.search, method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }, (res) => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => { try { resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} }) } catch { resolve({ status: res.statusCode, data }) } })
    })
    req.on('error', reject)
    if (options.body) req.write(JSON.stringify(options.body))
    req.end()
  })
}

async function authenticate() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { addResult('Auth env', 'FAIL', 'Missing Supabase env'); return null }
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  let { data, error } = await supabase.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
  if (error) {
    if (!SERVICE_ROLE_KEY) { addResult('Auth create user', 'FAIL', 'No service role key'); return null }
    const { createClient: adminClient } = await import('@supabase/supabase-js')
    const admin = adminClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { error: adminErr } = await admin.auth.admin.createUser({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD, email_confirm: true })
    if (adminErr) { addResult('Admin create user', 'FAIL', adminErr.message); return null }
    const again = await supabase.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
    if (again.error) { addResult('Auth login', 'FAIL', again.error.message); return null }
    data = again.data
  }
  if (data?.session) { addResult('Auth login', 'PASS', TEST_USER_EMAIL); return { access_token: data.session.access_token, refresh_token: data.session.refresh_token } }
  addResult('Auth login', 'FAIL', 'No session'); return null
}

function authHeaders(session) { if (!session) return {} ; const cookie = `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}` ; return { Cookie: cookie, Authorization: `Bearer ${session.access_token}` } }

async function getOrCreateTeam(headers) {
  const list = await makeRequest(`${BASE_URL}/api/teams`, { headers })
  if (list.status === 200 && list.data?.success && Array.isArray(list.data.data) && list.data.data.length > 0) return list.data.data[0].team_id || list.data.data[0].id
  const created = await makeRequest(`${BASE_URL}/api/teams`, { method: 'POST', headers, body: { team_name: `Invoices Test Team ${Date.now()}` } })
  if (created.status === 200 && created.data?.success) return created.data.data.team_id
  return null
}

async function testInternalInvoices(headers, teamId) {
  // List
  const list = await makeRequest(`${BASE_URL}/api/invoices?teamId=${teamId}`, { headers })
  addResult('Internal - List invoices', list.status === 200 ? 'PASS' : 'FAIL', `status=${list.status}`)

  // Create
  const payload = {
    teamId,
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_address: '123 Test St',
    invoice_date: new Date().toISOString().slice(0,10),
    due_date: new Date(Date.now()+7*86400000).toISOString().slice(0,10),
    items: [{ id: '1', description: 'Service', quantity: 1, unit_price: 100, amount: 100 }],
    subtotal: 100, tax: 8, total_amount: 108, balance: 108, status: 'draft', notes: 'Created by test', terms: 'Net 7'
  }
  const create = await makeRequest(`${BASE_URL}/api/invoices`, { method: 'POST', headers, body: payload })
  addResult('Internal - Create invoice', create.status === 200 && create.data?.success ? 'PASS' : 'FAIL', `status=${create.status}`)
}

async function testAnalytics(headers, teamId) {
  const res = await makeRequest(`${BASE_URL}/api/analytics?teamId=${teamId}&range=30d`, { headers })
  addResult('Analytics - GET', res.status === 200 && res.data?.success ? 'PASS' : 'FAIL', `status=${res.status}`)
}

async function fetchQboPrimitives(headers, teamId) {
  const status = await makeRequest(`${BASE_URL}/api/quickbooks/status`, { headers })
  if (status.status !== 200) { addResult('QBO - Status', 'FAIL', `status=${status.status} (Connect account to run QBO tests)`); return null }
  addResult('QBO - Status', 'PASS')
  let customers = await makeRequest(`${BASE_URL}/api/qbo/customers`, { headers })
  let items = await makeRequest(`${BASE_URL}/api/qbo/items`, { headers })
  let customerId = Array.isArray(customers.data?.data) && (customers.data.data[0]?.Id || customers.data.data[0]?.id) ? String(customers.data.data[0].Id || customers.data.data[0].id) : null
  let itemId = Array.isArray(items.data?.data) && (items.data.data[0]?.Id || items.data.data[0]?.id) ? String(items.data.data[0].Id || items.data.data[0].id) : null

  // If missing primitives, create minimal ones via helper endpoints
  if (!customerId) {
    const name = `Test Customer ${Date.now()}`
    const created = await makeRequest(`${BASE_URL}/api/qbo/customers/create?teamId=${encodeURIComponent(teamId)}`, { method: 'POST', headers, body: { DisplayName: name } })
    if (created.status === 200 && created.data?.success && created.data?.data?.Id) {
      customerId = String(created.data.data.Id)
    }
  }
  if (!itemId) {
    const name = `Test Service ${Date.now()}`
    const created = await makeRequest(`${BASE_URL}/api/qbo/items/create?teamId=${encodeURIComponent(teamId)}`, { method: 'POST', headers, body: { Name: name, Type: 'Service', UnitPrice: 25 } })
    if (created.status === 200 && created.data?.success && created.data?.data?.Id) {
      itemId = String(created.data.data.Id)
    }
  }

  // Re-fetch if still missing
  if (!customerId || !itemId) {
    customers = await makeRequest(`${BASE_URL}/api/qbo/customers`, { headers })
    items = await makeRequest(`${BASE_URL}/api/qbo/items`, { headers })
    customerId = Array.isArray(customers.data?.data) && (customers.data.data[0]?.Id || customers.data.data[0]?.id) ? String(customers.data.data[0].Id || customers.data.data[0].id) : null
    itemId = Array.isArray(items.data?.data) && (items.data.data[0]?.Id || items.data.data[0]?.id) ? String(items.data.data[0].Id || items.data.data[0].id) : null
  }

  if (!customerId || !itemId) { addResult('QBO - Fetch primitives', 'FAIL', 'No customers/items (connect QBO sample data or use create helpers)'); return null }
  addResult('QBO - Fetch primitives', 'PASS', `customer=${customerId} item=${itemId}`)
  return { customerId, itemId }
}

async function testQboInvoices(headers, teamId) {
  const primitives = await fetchQboPrimitives(headers, teamId)
  if (!primitives) return
  const { customerId, itemId } = primitives

  // List
  const list = await makeRequest(`${BASE_URL}/api/qbo/invoices?teamId=${teamId}&limit=5`, { headers })
  addResult('QBO - List invoices', list.status === 200 && list.data?.success ? 'PASS' : 'FAIL', `status=${list.status}`)

  // Create
  const createBody = {
    Line: [ { DetailType: 'SalesItemLineDetail', Amount: 25, SalesItemLineDetail: { ItemRef: { value: itemId } } } ],
    CustomerRef: { value: customerId }, PrivateNote: 'Full test create', TxnDate: new Date().toISOString().slice(0,10)
  }
  const created = await makeRequest(`${BASE_URL}/api/qbo/invoices?teamId=${teamId}`, { method: 'POST', headers, body: createBody })
  const newId = created?.data?.data?.Id ? String(created.data.data.Id) : null
  const newDoc = created?.data?.data?.DocNumber ? String(created.data.data.DocNumber) : ''
  addResult('QBO - Create invoice', created.status === 200 && !!newId ? 'PASS' : 'FAIL', `status=${created.status}`)
  if (!newId) return

  // Read by id
  const getById = await makeRequest(`${BASE_URL}/api/qbo/invoices/${encodeURIComponent(newId)}?teamId=${teamId}&by=id`, { headers })
  addResult('QBO - Get by Id', getById.status === 200 && getById.data?.success ? 'PASS' : 'FAIL', `status=${getById.status}`)

  // Read by Doc
  if (newDoc) {
    const getByDoc = await makeRequest(`${BASE_URL}/api/qbo/invoices/${encodeURIComponent(newDoc)}?teamId=${teamId}&by=doc`, { headers })
    addResult('QBO - Get by DocNumber', getByDoc.status === 200 && getByDoc.data?.success ? 'PASS' : 'FAIL', `status=${getByDoc.status}`)
  }

  // Update
  const update = await makeRequest(`${BASE_URL}/api/qbo/invoices/${encodeURIComponent(newId)}?teamId=${teamId}`, { method: 'PUT', headers, body: { PrivateNote: `Updated at ${new Date().toISOString()}` } })
  addResult('QBO - Update invoice', update.status === 200 && update.data?.success ? 'PASS' : 'FAIL', `status=${update.status}`)

  // Delete
  const del = await makeRequest(`${BASE_URL}/api/qbo/invoices/${encodeURIComponent(newId)}?teamId=${teamId}`, { method: 'DELETE', headers })
  addResult('QBO - Delete invoice', del.status === 200 && del.data?.success ? 'PASS' : 'FAIL', `status=${del.status}`)

  // Filtered list by date (today)
  const today = new Date().toISOString().slice(0,10)
  const filtered = await makeRequest(`${BASE_URL}/api/qbo/invoices?teamId=${teamId}&from=${today}&to=${today}`, { headers })
  addResult('QBO - Filtered list (date)', filtered.status === 200 && filtered.data?.success ? 'PASS' : 'FAIL', `status=${filtered.status}`)
}

async function main() {
  log('Invoices Full Test Suite', color.bold)
  log(`Base URL: ${BASE_URL}`, color.cyan)

  const session = await authenticate()
  if (!session) process.exit(1)
  const headers = authHeaders(session)
  const teamId = await getOrCreateTeam(headers)
  if (!teamId) { addResult('Ensure team', 'FAIL', 'Cannot create or fetch team'); process.exit(1) }
  addResult('Ensure team', 'PASS', teamId)

  await testInternalInvoices(headers, teamId)
  await testAnalytics(headers, teamId)
  await testQboInvoices(headers, teamId)

  // Save report
  const report = { timestamp: new Date().toISOString(), baseUrl: BASE_URL, results }
  const out = path.join(__dirname, 'test-invoices-full-report.json')
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  log(`Saved report to ${out}`, color.cyan)

  const failed = results.filter(r => r.status === 'FAIL').length
  process.exit(failed > 0 ? 1 : 0)
}

// Parse args
const args = process.argv.slice(2)
for (let i = 0; i < args.length; i++) { if (args[i] === '--base-url') process.env.NEXT_PUBLIC_APP_URL = args[++i] }

main().catch((e) => { log(`Suite failed: ${e.message}`, color.red); process.exit(1) })


