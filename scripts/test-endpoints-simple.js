#!/usr/bin/env node

/**
 * Simple API Endpoint Testing Script
 * Tests all endpoints in the invoice management system
 * This version works without authentication requirements
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

// Test protected routes (should return 401 without auth)
async function testProtectedRoutes() {
  log('\n🔒 Testing Protected Routes (Unauthenticated)...', 'cyan');
  
  try {
    const protectedResponse = await makeRequest(`${BASE_URL}/api/protected`);
    
    if (protectedResponse.status === 401) {
      logTest('Protected - GET /api/protected (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('Protected - GET /api/protected (unauth)', 'FAIL', `Expected 401, got ${protectedResponse.status}`);
    }
    
  } catch (error) {
    logTest('Protected Routes', 'FAIL', error.message);
  }
}

// Test Teams API (should return 401 without auth)
async function testTeamsAPI() {
  log('\n👥 Testing Teams API (Unauthenticated)...', 'cyan');
  
  try {
    // Test GET /api/teams
    const getTeamsResponse = await makeRequest(`${BASE_URL}/api/teams`);
    
    if (getTeamsResponse.status === 401) {
      logTest('Teams - GET /api/teams (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('Teams - GET /api/teams (unauth)', 'FAIL', `Expected 401, got ${getTeamsResponse.status}`);
    }
    
    // Test POST /api/teams (create team)
    const createTeamResponse = await makeRequest(`${BASE_URL}/api/teams`, {
      method: 'POST',
      body: {
        team_name: 'Test Team',
        description: 'Test team for API testing'
      }
    });
    
    if (createTeamResponse.status === 401) {
      logTest('Teams - POST /api/teams (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('Teams - POST /api/teams (unauth)', 'FAIL', `Expected 401, got ${createTeamResponse.status}`);
    }
    
  } catch (error) {
    logTest('Teams API', 'FAIL', error.message);
  }
}

// Test Invoices API (should return 401 without auth)
async function testInvoicesAPI() {
  log('\n📄 Testing Invoices API (Unauthenticated)...', 'cyan');
  
  const teamId = 'test-team-id';
  
  try {
    // Test GET /api/invoices
    const getInvoicesResponse = await makeRequest(`${BASE_URL}/api/invoices?teamId=${teamId}`);
    
    if (getInvoicesResponse.status === 401) {
      logTest('Invoices - GET /api/invoices (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('Invoices - GET /api/invoices (unauth)', 'FAIL', `Expected 401, got ${getInvoicesResponse.status}`);
    }
    
    // Test POST /api/invoices
    const createInvoiceResponse = await makeRequest(`${BASE_URL}/api/invoices`, {
      method: 'POST',
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
    
    if (createInvoiceResponse.status === 401) {
      logTest('Invoices - POST /api/invoices (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('Invoices - POST /api/invoices (unauth)', 'FAIL', `Expected 401, got ${createInvoiceResponse.status}`);
    }
    
  } catch (error) {
    logTest('Invoices API', 'FAIL', error.message);
  }
}

// Test Chat API (should return 401 without auth)
async function testChatAPI() {
  log('\n💬 Testing Chat API (Unauthenticated)...', 'cyan');
  
  const teamId = 'test-team-id';
  
  try {
    const chatResponse = await makeRequest(`${BASE_URL}/api/chat`, {
      method: 'POST',
      body: {
        message: 'Hello, can you help me with invoice management?',
        teamId,
        history: []
      }
    });
    
    if (chatResponse.status === 401) {
      logTest('Chat - POST /api/chat (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('Chat - POST /api/chat (unauth)', 'FAIL', `Expected 401, got ${chatResponse.status}`);
    }
    
  } catch (error) {
    logTest('Chat API', 'FAIL', error.message);
  }
}

// Test AI Invoices API (should return 401 without auth)
async function testAIInvoicesAPI() {
  log('\n🤖 Testing AI Invoices API (Unauthenticated)...', 'cyan');
  
  const teamId = 'test-team-id';
  
  try {
    const aiResponse = await makeRequest(`${BASE_URL}/api/ai/invoices`, {
      method: 'POST',
      body: {
        query: 'Show me invoice analytics for this month',
        teamId,
        analysisType: 'overview'
      }
    });
    
    if (aiResponse.status === 401) {
      logTest('AI Invoices - POST /api/ai/invoices (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('AI Invoices - POST /api/ai/invoices (unauth)', 'FAIL', `Expected 401, got ${aiResponse.status}`);
    }
    
  } catch (error) {
    logTest('AI Invoices API', 'FAIL', error.message);
  }
}

// Test QuickBooks API (should return 401 without auth)
async function testQuickBooksAPI() {
  log('\n📊 Testing QuickBooks API (Unauthenticated)...', 'cyan');
  
  try {
    // Test QuickBooks status
    const statusResponse = await makeRequest(`${BASE_URL}/api/quickbooks/status`);
    
    if (statusResponse.status === 401) {
      logTest('QuickBooks - GET /api/quickbooks/status (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('QuickBooks - GET /api/quickbooks/status (unauth)', 'FAIL', `Expected 401, got ${statusResponse.status}`);
    }
    
    // Test QBO company info
    const companyResponse = await makeRequest(`${BASE_URL}/api/qbo/company`);
    
    if (companyResponse.status === 401) {
      logTest('QBO - GET /api/qbo/company (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('QBO - GET /api/qbo/company (unauth)', 'FAIL', `Expected 401, got ${companyResponse.status}`);
    }
    
    // Test QBO customers
    const customersResponse = await makeRequest(`${BASE_URL}/api/qbo/customers`);
    
    if (customersResponse.status === 401) {
      logTest('QBO - GET /api/qbo/customers (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('QBO - GET /api/qbo/customers (unauth)', 'FAIL', `Expected 401, got ${customersResponse.status}`);
    }
    
    // Test QBO items
    const itemsResponse = await makeRequest(`${BASE_URL}/api/qbo/items`);
    
    if (itemsResponse.status === 401) {
      logTest('QBO - GET /api/qbo/items (unauth)', 'PASS', 'Correctly returns 401');
    } else {
      logTest('QBO - GET /api/qbo/items (unauth)', 'FAIL', `Expected 401, got ${itemsResponse.status}`);
    }
    
  } catch (error) {
    logTest('QuickBooks API', 'FAIL', error.message);
  }
}

// Test frontend pages (should return 200)
async function testFrontendPages() {
  log('\n🌐 Testing Frontend Pages...', 'cyan');
  
  try {
    // Test main page
    const mainPageResponse = await makeRequest(`${BASE_URL}/`);
    
    if (mainPageResponse.status === 200) {
      logTest('Frontend - GET /', 'PASS');
    } else {
      logTest('Frontend - GET /', 'FAIL', `Status: ${mainPageResponse.status}`);
    }
    
    // Test login page
    const loginPageResponse = await makeRequest(`${BASE_URL}/auth/login`);
    
    if (loginPageResponse.status === 200) {
      logTest('Frontend - GET /auth/login', 'PASS');
    } else {
      logTest('Frontend - GET /auth/login', 'FAIL', `Status: ${loginPageResponse.status}`);
    }
    
    // Test signup page
    const signupPageResponse = await makeRequest(`${BASE_URL}/auth/signup`);
    
    if (signupPageResponse.status === 200) {
      logTest('Frontend - GET /auth/signup', 'PASS');
    } else {
      logTest('Frontend - GET /auth/signup', 'FAIL', `Status: ${signupPageResponse.status}`);
    }
    
  } catch (error) {
    logTest('Frontend Pages', 'FAIL', error.message);
  }
}

// Test server connectivity
async function testServerConnectivity() {
  log('\n🔌 Testing Server Connectivity...', 'cyan');
  
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    
    if (response.status === 200) {
      logTest('Server Connectivity', 'PASS', 'Server is running and responding');
    } else {
      logTest('Server Connectivity', 'FAIL', `Server responded with status: ${response.status}`);
    }
    
  } catch (error) {
    logTest('Server Connectivity', 'FAIL', `Cannot connect to server: ${error.message}`);
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
  
  const reportPath = path.join(__dirname, 'test-report-simple.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
}

// Main test runner
async function runTests() {
  log('🚀 Starting Simple API Endpoint Tests...', 'bright');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log('Note: This test runs without authentication', 'yellow');
  
  try {
    // Test server connectivity first
    await testServerConnectivity();
    
    // Run all test suites
    await testFrontendPages();
    await testOAuthEndpoints();
    await testUtilityEndpoints();
    await testProtectedRoutes();
    await testTeamsAPI();
    await testInvoicesAPI();
    await testChatAPI();
    await testAIInvoicesAPI();
    await testQuickBooksAPI();
    
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
Simple API Endpoint Testing Script

Usage: node test-endpoints-simple.js [options]

Options:
  --base-url <url>     Base URL for testing (default: http://localhost:3000)
  --help, -h          Show this help message

Environment Variables:
  NEXT_PUBLIC_APP_URL    Base URL for the application

Examples:
  node test-endpoints-simple.js
  node test-endpoints-simple.js --base-url https://myapp.vercel.app
`, 'cyan');
  process.exit(0);
}

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--base-url':
      process.env.NEXT_PUBLIC_APP_URL = args[++i];
      break;
  }
}

// Run the tests
runTests();
