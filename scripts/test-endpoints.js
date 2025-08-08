#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Testing Script
 * Tests all endpoints in the invoice management system
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if present (no external dependency)
(() => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const [key, ...valueParts] = trimmed.split('=');
        if (!key || valueParts.length === 0) return;
        const value = valueParts.join('=').replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = value;
      });
    }
  } catch {}
})();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : 'red';
  const statusText = status === 'PASS' ? '✓' : '✗';
  
  log(`${statusText} ${testName}`, statusColor);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
  
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  testResults.details.push({
    name: testName,
    status,
    details
  });
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test authentication and get session using Supabase client
async function authenticate() {
  log('\n🔐 Testing Authentication...', 'cyan');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logTest('Authentication - Environment Setup', 'FAIL', 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    return null;
  }
  
  try {
    // Import Supabase client dynamically
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Try to sign in with existing user
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (signInError) {
      // If user doesn't exist, try to create using admin if available, else sign up
      log(`User doesn't exist, attempting to create test user: ${TEST_USER_EMAIL}`, 'yellow');

      if (SERVICE_ROLE_KEY) {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const admin = createAdminClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { data: created, error: adminErr } = await admin.auth.admin.createUser({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
          email_confirm: true
        });
        if (adminErr) {
          logTest('Authentication - Admin Create User', 'FAIL', `Admin createUser failed: ${adminErr.message}`);
          return null;
        }
        // Try signing in again with anon key
        const { data: afterAdminSignIn, error: afterAdminErr } = await supabase.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        });
        if (afterAdminErr) {
          logTest('Authentication - Login', 'FAIL', `Sign in after admin provisioning failed: ${afterAdminErr.message}`);
          return null;
        }
        signInData = afterAdminSignIn;
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        });
        
        if (signUpError) {
          logTest('Authentication - Sign Up', 'FAIL', `Sign up failed: ${signUpError.message}`);
          return null;
        }
        
        if (signUpData.user && !signUpData.user.email_confirmed_at) {
          logTest('Authentication - Sign Up', 'PASS', 'User created but email confirmation required');
          log('Note: In a real environment, you would need to confirm the email before testing', 'yellow');
          return null;
        }
        
        signInData = signUpData;
      }
    }
    
    if (signInData.session) {
      logTest('Authentication - Login', 'PASS', `Authenticated as ${TEST_USER_EMAIL}`);
      return {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        user: signInData.user
      };
    } else {
      logTest('Authentication - Login', 'FAIL', 'No session returned after authentication');
      return null;
    }
    
  } catch (error) {
    logTest('Authentication - Login', 'FAIL', `Authentication error: ${error.message}`);
    return null;
  }
}

function getAuthHeaders(session) {
  if (!session) return {};
  const cookie = `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`;
  return { Cookie: cookie, Authorization: `Bearer ${session.access_token}` };
}

async function getOrCreateTestTeamId(headers) {
  try {
    // Try to list teams
    const list = await makeRequest(`${BASE_URL}/api/teams`, { headers });
    if (list.status === 200 && list.data?.success && Array.isArray(list.data.data) && list.data.data.length > 0) {
      return list.data.data[0].team_id || list.data.data[0].id || list.data.data[0].teamId;
    }
    // Create a team
    const created = await makeRequest(`${BASE_URL}/api/teams`, {
      method: 'POST',
      headers,
      body: { team_name: `Test Team ${Date.now()}`, description: 'Team for automated tests' }
    });
    if (created.status === 200 && created.data?.success) {
      return created.data.data.team_id || created.data.data.id;
    }
  } catch {}
  return null;
}

// Test Teams API
async function testTeamsAPI(session) {
  log('\n👥 Testing Teams API...', 'cyan');
  
  const headers = getAuthHeaders(session);
  
  try {
    // Test GET /api/teams
    const getTeamsResponse = await makeRequest(`${BASE_URL}/api/teams`, {
      headers
    });
    
    if (getTeamsResponse.status === 200) {
      logTest('Teams - GET /api/teams', 'PASS');
    } else {
      logTest('Teams - GET /api/teams', 'FAIL', `Status: ${getTeamsResponse.status}`);
    }
    
    // Test POST /api/teams (create team)
    const createTeamResponse = await makeRequest(`${BASE_URL}/api/teams`, {
      method: 'POST',
      headers,
      body: {
        team_name: 'Test Team',
        description: 'Test team for API testing'
      }
    });
    
    if (createTeamResponse.status === 200 && createTeamResponse.data.success) {
      logTest('Teams - POST /api/teams', 'PASS');
      const teamId = createTeamResponse.data.data.team_id;
      
      // Test team-specific endpoints
      await testTeamSpecificEndpoints(teamId, headers);
      
    } else {
      logTest('Teams - POST /api/teams', 'FAIL', `Status: ${createTeamResponse.status}`);
    }
    
  } catch (error) {
    logTest('Teams API', 'FAIL', error.message);
  }
}

// Test team-specific endpoints
async function testTeamSpecificEndpoints(teamId, headers) {
  try {
    // Test GET /api/teams/[teamId]
    const getTeamResponse = await makeRequest(`${BASE_URL}/api/teams/${teamId}`, {
      headers
    });
    
    if (getTeamResponse.status === 200) {
      logTest(`Teams - GET /api/teams/${teamId}`, 'PASS');
    } else {
      logTest(`Teams - GET /api/teams/${teamId}`, 'FAIL', `Status: ${getTeamResponse.status}`);
    }
    
    // Test PUT /api/teams/[teamId]
    const updateTeamResponse = await makeRequest(`${BASE_URL}/api/teams/${teamId}`, {
      method: 'PUT',
      headers,
      body: {
        team_name: 'Updated Test Team',
        description: 'Updated description'
      }
    });
    
    if (updateTeamResponse.status === 200) {
      logTest(`Teams - PUT /api/teams/${teamId}`, 'PASS');
    } else {
      logTest(`Teams - PUT /api/teams/${teamId}`, 'FAIL', `Status: ${updateTeamResponse.status}`);
    }
    
    // Test GET /api/teams/[teamId]/members
    const getMembersResponse = await makeRequest(`${BASE_URL}/api/teams/${teamId}/members`, {
      headers
    });
    
    if (getMembersResponse.status === 200) {
      logTest(`Teams - GET /api/teams/${teamId}/members`, 'PASS');
    } else {
      logTest(`Teams - GET /api/teams/${teamId}/members`, 'FAIL', `Status: ${getMembersResponse.status}`);
    }
    
    // Test POST /api/teams/[teamId]/invite
    const inviteResponse = await makeRequest(`${BASE_URL}/api/teams/${teamId}/invite`, {
      method: 'POST',
      headers,
      body: {
        email: 'invite@example.com',
        role: 'viewer'
      }
    });
    
    if (inviteResponse.status === 200) {
      logTest(`Teams - POST /api/teams/${teamId}/invite`, 'PASS');
    } else {
      logTest(`Teams - POST /api/teams/${teamId}/invite`, 'FAIL', `Status: ${inviteResponse.status}`);
    }
    
  } catch (error) {
    logTest('Team-specific endpoints', 'FAIL', error.message);
  }
}

// Test Invoices API
async function testInvoicesAPI(session) {
  log('\n📄 Testing Invoices API...', 'cyan');
  
  const headers = getAuthHeaders(session);
  let teamId = await getOrCreateTestTeamId(headers);
  if (!teamId) {
    logTest('Invoices - GET /api/invoices', 'FAIL', 'No team available');
    logTest('Invoices - POST /api/invoices', 'FAIL', 'No team available');
    return;
  }
  
  try {
    // Test GET /api/invoices
    const getInvoicesResponse = await makeRequest(`${BASE_URL}/api/invoices?teamId=${teamId}`, {
      headers
    });
    
    if (getInvoicesResponse.status === 200) {
      logTest('Invoices - GET /api/invoices', 'PASS');
    } else {
      logTest('Invoices - GET /api/invoices', 'FAIL', `Status: ${getInvoicesResponse.status}`);
    }
    
    // Test POST /api/invoices
    const createInvoiceResponse = await makeRequest(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers,
      body: {
        teamId,
        customer_name: 'Test Customer',
        total_amount: 1000.00,
        items: [
          {
            description: 'Test Item',
            quantity: 1,
            unit_price: 1000.00,
            amount: 1000.00
          }
        ]
      }
    });
    
    if (createInvoiceResponse.status === 200) {
      logTest('Invoices - POST /api/invoices', 'PASS');
    } else {
      logTest('Invoices - POST /api/invoices', 'FAIL', `Status: ${createInvoiceResponse.status}`);
    }
    
  } catch (error) {
    logTest('Invoices API', 'FAIL', error.message);
  }
}

// Test Chat API
async function testChatAPI(session) {
  log('\n💬 Testing Chat API...', 'cyan');
  
  const headers = getAuthHeaders(session);
  let teamId = await getOrCreateTestTeamId(headers);
  if (!teamId) {
    logTest('Chat - POST /api/chat', 'FAIL', 'No team available');
    return;
  }
  
  try {
    const chatResponse = await makeRequest(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: {
        message: 'Hello, can you help me with invoice management?',
        teamId,
        history: []
      }
    });
    
    if (chatResponse.status === 200) {
      logTest('Chat - POST /api/chat', 'PASS');
    } else {
      logTest('Chat - POST /api/chat', 'FAIL', `Status: ${chatResponse.status}`);
    }
    
  } catch (error) {
    logTest('Chat API', 'FAIL', error.message);
  }
}

// Test AI Invoices API
async function testAIInvoicesAPI(session) {
  log('\n🤖 Testing AI Invoices API...', 'cyan');
  
  const headers = getAuthHeaders(session);
  let teamId = await getOrCreateTestTeamId(headers);
  if (!teamId) {
    logTest('AI Invoices - POST /api/ai/invoices', 'FAIL', 'No team available');
    return;
  }
  
  try {
    const aiResponse = await makeRequest(`${BASE_URL}/api/ai/invoices`, {
      method: 'POST',
      headers,
      body: {
        query: 'Show me invoice analytics for this month',
        teamId,
        analysisType: 'overview'
      }
    });
    
    if (aiResponse.status === 200) {
      logTest('AI Invoices - POST /api/ai/invoices', 'PASS');
    } else {
      logTest('AI Invoices - POST /api/ai/invoices', 'FAIL', `Status: ${aiResponse.status}`);
    }
    
  } catch (error) {
    logTest('AI Invoices API', 'FAIL', error.message);
  }
}

// Test QuickBooks API
async function testQuickBooksAPI(session) {
  log('\n📊 Testing QuickBooks API...', 'cyan');
  
  const headers = getAuthHeaders(session);
  
  try {
    // Test QuickBooks status
    const statusResponse = await makeRequest(`${BASE_URL}/api/quickbooks/status`, {
      headers
    });
    
    if (statusResponse.status === 200) {
      logTest('QuickBooks - GET /api/quickbooks/status', 'PASS');
    } else {
      logTest('QuickBooks - GET /api/quickbooks/status', 'FAIL', `Status: ${statusResponse.status}`);
    }
    
    // Test QBO company info
    const companyResponse = await makeRequest(`${BASE_URL}/api/qbo/company`, {
      headers
    });
    
    if (companyResponse.status === 200 || companyResponse.status === 401) {
      logTest('QBO - GET /api/qbo/company', 'PASS', companyResponse.status === 401 ? 'Not connected (expected in dev)' : '');
    } else {
      logTest('QBO - GET /api/qbo/company', 'FAIL', `Status: ${companyResponse.status}`);
    }
    
    // Test QBO customers
    const customersResponse = await makeRequest(`${BASE_URL}/api/qbo/customers`, {
      headers
    });
    
    if (customersResponse.status === 200 || customersResponse.status === 401) {
      logTest('QBO - GET /api/qbo/customers', 'PASS', customersResponse.status === 401 ? 'Not connected (expected in dev)' : '');
    } else {
      logTest('QBO - GET /api/qbo/customers', 'FAIL', `Status: ${customersResponse.status}`);
    }
    
    // Test QBO items
    const itemsResponse = await makeRequest(`${BASE_URL}/api/qbo/items`, {
      headers
    });
    
    if (itemsResponse.status === 200 || itemsResponse.status === 401) {
      logTest('QBO - GET /api/qbo/items', 'PASS', itemsResponse.status === 401 ? 'Not connected (expected in dev)' : '');
    } else {
      logTest('QBO - GET /api/qbo/items', 'FAIL', `Status: ${itemsResponse.status}`);
    }
    
  } catch (error) {
    logTest('QuickBooks API', 'FAIL', error.message);
  }
}

// Test OAuth endpoints
async function testOAuthEndpoints() {
  log('\n🔗 Testing OAuth Endpoints...', 'cyan');
  
  try {
    // Test OAuth route - expects 307 redirect to OAuth provider
    const oauthResponse = await makeRequest(`${BASE_URL}/api/oauth`);
    
    if (oauthResponse.status === 307) {
      logTest('OAuth - GET /api/oauth', 'PASS', 'Correctly redirects to OAuth provider');
    } else {
      logTest('OAuth - GET /api/oauth', 'FAIL', `Status: ${oauthResponse.status}, expected 307`);
    }
    
    // Test QuickBooks auth callback - expects 400, 302, or 307 when called without parameters
    const callbackResponse = await makeRequest(`${BASE_URL}/api/auth/quickbooks/callback`);
    
    if (callbackResponse.status === 400 || callbackResponse.status === 302 || callbackResponse.status === 307) {
      logTest('Auth - GET /api/auth/quickbooks/callback', 'PASS', 'Correctly handles missing OAuth parameters');
    } else {
      logTest('Auth - GET /api/auth/quickbooks/callback', 'FAIL', `Status: ${callbackResponse.status}, expected 400, 302, or 307`);
    }
    
  } catch (error) {
    logTest('OAuth Endpoints', 'FAIL', error.message);
  }
}

// Test protected routes
async function testProtectedRoutes(session) {
  log('\n🔒 Testing Protected Routes...', 'cyan');
  
  const headers = session ? { 'Authorization': `Bearer ${session.access_token}` } : {};
  
  try {
    const protectedResponse = await makeRequest(`${BASE_URL}/api/protected`, {
      headers
    });
    
    if (protectedResponse.status === 200) {
      logTest('Protected - GET /api/protected', 'PASS');
    } else {
      logTest('Protected - GET /api/protected', 'FAIL', `Status: ${protectedResponse.status}`);
    }
    
  } catch (error) {
    logTest('Protected Routes', 'FAIL', error.message);
  }
}

// Test utility endpoints
async function testUtilityEndpoints() {
  log('\n🛠️ Testing Utility Endpoints...', 'cyan');
  
  try {
    // Test OpenAI endpoint
    const openaiResponse = await makeRequest(`${BASE_URL}/api/test-openai`);
    
    if (openaiResponse.status === 200) {
      logTest('Utility - GET /api/test-openai', 'PASS');
    } else {
      logTest('Utility - GET /api/test-openai', 'FAIL', `Status: ${openaiResponse.status}`);
    }
    
    // Test OAuth test endpoint
    const oauthTestResponse = await makeRequest(`${BASE_URL}/api/test-oauth`);
    
    if (oauthTestResponse.status === 200) {
      logTest('Utility - GET /api/test-oauth', 'PASS');
    } else {
      logTest('Utility - GET /api/test-oauth', 'FAIL', `Status: ${oauthTestResponse.status}`);
    }
    
  } catch (error) {
    logTest('Utility Endpoints', 'FAIL', error.message);
  }
}

// Generate test report
function generateReport() {
  log('\n' + '='.repeat(60), 'bright');
  log('📊 TEST RESULTS SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`\nTotal Tests: ${testResults.total}`, 'bright');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'bright');
  
  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        log(`  - ${test.name}: ${test.details}`, 'red');
      });
  }
  
  log('\n✅ PASSED TESTS:', 'green');
  testResults.details
    .filter(test => test.status === 'PASS')
    .forEach(test => {
      log(`  - ${test.name}`, 'green');
    });
  
  // Save detailed report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
    },
    details: testResults.details
  };
  
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
}

// Main test runner
async function runTests() {
  log('🚀 Starting API Endpoint Tests...', 'bright');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Test User: ${TEST_USER_EMAIL}`, 'blue');
  
  try {
    // Test authentication first
    const session = await authenticate();
    
    // Run all test suites
    await testOAuthEndpoints();
    await testUtilityEndpoints();
    await testProtectedRoutes(session);
    await testTeamsAPI(session);
    await testInvoicesAPI(session);
    await testChatAPI(session);
    await testAIInvoicesAPI(session);
    await testQuickBooksAPI(session);
    
    // Generate final report
    generateReport();
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    log(`\n💥 Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`
API Endpoint Testing Script

Usage: node test-endpoints.js [options]

Options:
  --base-url <url>     Base URL for testing (default: http://localhost:3000)
  --email <email>      Test user email (default: test@example.com)
  --password <pass>    Test user password (default: testpassword123)
  --help, -h          Show this help message

Environment Variables:
  NEXT_PUBLIC_APP_URL    Base URL for the application
  TEST_USER_EMAIL        Test user email
  TEST_USER_PASSWORD     Test user password

Examples:
  node test-endpoints.js
  node test-endpoints.js --base-url https://myapp.vercel.app
  node test-endpoints.js --email admin@example.com --password secret123
`, 'cyan');
  process.exit(0);
}

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--base-url':
      process.env.NEXT_PUBLIC_APP_URL = args[++i];
      break;
    case '--email':
      process.env.TEST_USER_EMAIL = args[++i];
      break;
    case '--password':
      process.env.TEST_USER_PASSWORD = args[++i];
      break;
  }
}

// Run the tests
runTests();
