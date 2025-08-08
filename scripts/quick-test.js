#!/usr/bin/env node

/**
 * Quick API Endpoint Test
 * A simple script to quickly verify that the server is running and basic endpoints are accessible
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

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
}

// Simple HTTP request helper
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 5000
    };
    
    const req = client.request(requestOptions, (res) => {
      resolve({
        status: res.statusCode,
        url: url
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Quick tests
async function runQuickTests() {
  log('🚀 Quick API Endpoint Test', 'bright');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log('');
  
  const tests = [
    { name: 'Main Page', url: `${BASE_URL}/` },
    { name: 'Login Page', url: `${BASE_URL}/auth/login` },
    { name: 'Signup Page', url: `${BASE_URL}/auth/signup` },
    { name: 'OAuth Endpoint', url: `${BASE_URL}/api/oauth` },
    { name: 'Test OpenAI', url: `${BASE_URL}/api/test-openai` },
    { name: 'Test OAuth', url: `${BASE_URL}/api/test-oauth` },
    { name: 'Protected Route (should be 401)', url: `${BASE_URL}/api/protected` },
    { name: 'Teams API (should be 401)', url: `${BASE_URL}/api/teams` },
    { name: 'Invoices API (should be 401)', url: `${BASE_URL}/api/invoices` }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await makeRequest(test.url);
      
      // Determine expected status based on endpoint
      let expectedStatus = 200;
      if (test.name.includes('should be 401')) {
        expectedStatus = 401;
      } else if (test.name === 'OAuth Endpoint') {
        expectedStatus = 307; // OAuth endpoint should redirect
      }
      
      if (response.status === expectedStatus) {
        logTest(test.name, 'PASS', `Status: ${response.status}`);
        passed++;
      } else {
        logTest(test.name, 'FAIL', `Expected ${expectedStatus}, got ${response.status}`);
        failed++;
      }
    } catch (error) {
      logTest(test.name, 'FAIL', error.message);
      failed++;
    }
  }
  
  log('');
  log('='.repeat(50), 'bright');
  log(`📊 Quick Test Results: ${passed} passed, ${failed} failed`, 'bright');
  log('='.repeat(50), 'bright');
  
  if (failed === 0) {
    log('🎉 All tests passed! Your server is running correctly.', 'green');
    log('💡 Run "npm run test:endpoints" for a comprehensive test.', 'cyan');
  } else {
    log('⚠️  Some tests failed. Check your server configuration.', 'yellow');
    log('💡 Make sure your Next.js server is running with "npm run dev"', 'cyan');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`
Quick API Endpoint Test

Usage: node quick-test.js [options]

Options:
  --base-url <url>     Base URL for testing (default: http://localhost:3000)
  --help, -h          Show this help message

Environment Variables:
  NEXT_PUBLIC_APP_URL    Base URL for the application

Examples:
  node quick-test.js
  node quick-test.js --base-url https://myapp.vercel.app
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

// Run the quick tests
runQuickTests().catch(error => {
  log(`💥 Quick test failed: ${error.message}`, 'red');
  process.exit(1);
});
