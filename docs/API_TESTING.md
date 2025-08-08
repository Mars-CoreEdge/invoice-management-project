# API Endpoint Testing Documentation

This document describes the testing scripts available for verifying that all API endpoints in the invoice management system are working correctly.

## Overview

The testing system includes three main scripts:

1. **Authentication Test Script** (`test-auth.js`) - Tests Supabase authentication setup
2. **Simple Test Script** (`test-endpoints-simple.js`) - Tests endpoints without authentication
3. **Full Test Script** (`test-endpoints.js`) - Tests endpoints with authentication (requires setup)

## Quick Start

### Prerequisites

1. **Set up your environment variables:**
   ```bash
   npm run setup:env
   ```

2. Make sure your Next.js application is running:
   ```bash
   npm run dev
   ```

3. The application should be accessible at `http://localhost:3000` (or your configured URL)

### Running Tests

#### Authentication Testing (First Step)

Test your Supabase authentication setup:

```bash
npm run test:auth
```

This will verify:
- Environment variables are set correctly
- Supabase connection is working
- Test user can be created/authenticated

#### Simple Testing (Recommended)

Test all endpoints without authentication requirements:

```bash
npm run test:endpoints
```

This will test:
- Server connectivity
- Frontend pages
- OAuth endpoints (expects 307 redirects)
- Utility endpoints
- Protected routes (should return 401)
- All API endpoints (should return 401 when unauthenticated)

#### Full Testing (Advanced)

Test all endpoints with authentication:

```bash
npm run test:endpoints:full
```

**Note**: This requires setting up test credentials and may need additional configuration.

#### Get Help

View all available options:

```bash
npm run test:endpoints:help
```

## Test Scripts Details

### Simple Test Script (`scripts/test-endpoints-simple.js`)

This script tests endpoints without requiring authentication. It's designed to verify:

- **Server Connectivity**: Ensures the server is running and responding
- **Frontend Pages**: Tests that main pages load correctly
- **OAuth Endpoints**: Verifies OAuth routes are accessible
- **Utility Endpoints**: Tests utility and debugging endpoints
- **Protected Routes**: Verifies that protected endpoints correctly return 401 when accessed without authentication
- **API Security**: Ensures all API endpoints properly reject unauthenticated requests

#### What It Tests

| Category | Endpoints | Expected Result |
|----------|-----------|-----------------|
| Server | `/` | 200 OK |
| Frontend | `/auth/login`, `/auth/signup` | 200 OK |
| OAuth | `/api/oauth`, `/api/auth/quickbooks/callback` | 307 Redirect or 400/302 |
| Utility | `/api/test-openai`, `/api/test-oauth` | 200 OK |
| Protected | `/api/protected` | 401 Unauthorized |
| Teams | `/api/teams` (GET/POST) | 401 Unauthorized |
| Invoices | `/api/invoices` (GET/POST) | 401 Unauthorized |
| Chat | `/api/chat` (POST) | 401 Unauthorized |
| AI | `/api/ai/invoices` (POST) | 401 Unauthorized |
| QuickBooks | `/api/quickbooks/status`, `/api/qbo/*` | 401 Unauthorized |

### Full Test Script (`scripts/test-endpoints.js`)

This script tests endpoints with authentication. It requires:

- Valid test user credentials
- Proper environment setup
- Authentication tokens

#### Configuration

Set environment variables:

```bash
export TEST_USER_EMAIL="your-test-email@example.com"
export TEST_USER_PASSWORD="your-test-password"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Or use command line arguments:

```bash
node scripts/test-endpoints.js --email test@example.com --password secret123 --base-url http://localhost:3000
```

## Test Results

### Console Output

The scripts provide colored console output:

- ✅ **Green**: Tests that passed
- ❌ **Red**: Tests that failed
- 📊 **Summary**: Overall test results

Example output:
```
🚀 Starting Simple API Endpoint Tests...
Base URL: http://localhost:3000
Note: This test runs without authentication

🔌 Testing Server Connectivity...
✓ Server Connectivity PASS
   Server is running and responding

🌐 Testing Frontend Pages...
✓ Frontend - GET / PASS
✓ Frontend - GET /auth/login PASS
✓ Frontend - GET /auth/signup PASS

🔗 Testing OAuth Endpoints...
✓ OAuth - GET /api/oauth PASS
✓ Auth - GET /api/auth/callback PASS

...

============================================================
📊 TEST RESULTS SUMMARY
============================================================

Total Tests: 25
Passed: 25
Failed: 0
Success Rate: 100.0%

✅ PASSED TESTS:
  - Server Connectivity
  - Frontend - GET /
  - Frontend - GET /auth/login
  - Frontend - GET /auth/signup
  ...

📄 Detailed report saved to: scripts/test-report-simple.json
```

### JSON Report

A detailed JSON report is generated in the `scripts/` directory:

- `test-report-simple.json` - For simple tests
- `test-report.json` - For full tests

The report includes:
- Timestamp
- Base URL
- Summary statistics
- Detailed test results

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Base URL for testing | `http://localhost:3000` |
| `TEST_USER_EMAIL` | Test user email (full tests) | `test@example.com` |
| `TEST_USER_PASSWORD` | Test user password (full tests) | `testpassword123` |

### Command Line Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `--base-url` | Set base URL | `--base-url https://myapp.vercel.app` |
| `--email` | Set test email | `--email admin@example.com` |
| `--password` | Set test password | `--password secret123` |
| `--help` | Show help | `--help` |

## Troubleshooting

### Common Issues

1. **Server Not Running**
   ```
   Server Connectivity FAIL
   Cannot connect to server: connect ECONNREFUSED
   ```
   **Solution**: Start your Next.js development server with `npm run dev`

2. **Wrong Base URL**
   ```
   Server Connectivity FAIL
   Server responded with status: 404
   ```
   **Solution**: Check your `NEXT_PUBLIC_APP_URL` environment variable

3. **Authentication Issues (Full Tests)**
   ```
   Authentication - Login FAIL
   Status: 401, Response: {"error":"Invalid credentials"}
   ```
   **Solution**: Verify test user credentials and ensure the user exists in your database

### Debug Mode

For more detailed output, you can modify the scripts to include additional logging:

```javascript
// Add to the makeRequest function for debugging
console.log(`Making ${options.method || 'GET'} request to ${url}`);
console.log('Request options:', requestOptions);
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run start &
      - run: sleep 10
      - run: npm run test:endpoints
```

### Exit Codes

- `0` - All tests passed
- `1` - Some tests failed or script error

## Extending the Tests

### Adding New Endpoints

To test a new endpoint, add a new test function:

```javascript
async function testNewEndpoint() {
  log('\n🆕 Testing New Endpoint...', 'cyan');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/new-endpoint`);
    
    if (response.status === 200) {
      logTest('New Endpoint - GET /api/new-endpoint', 'PASS');
    } else {
      logTest('New Endpoint - GET /api/new-endpoint', 'FAIL', `Status: ${response.status}`);
    }
    
  } catch (error) {
    logTest('New Endpoint', 'FAIL', error.message);
  }
}
```

Then add it to the main test runner:

```javascript
async function runTests() {
  // ... existing tests ...
  await testNewEndpoint();
  // ... rest of tests ...
}
```

### Custom Test Data

You can modify the test data in the scripts to match your application's requirements:

```javascript
// In testInvoicesAPI function
const createInvoiceResponse = await makeRequest(`${BASE_URL}/api/invoices`, {
  method: 'POST',
  body: {
    teamId,
    customer_name: 'Your Test Customer',
    total_amount: 1500.00,
    items: [
      {
        description: 'Your Test Item',
        quantity: 2,
        unit_price: 750.00,
        amount: 1500.00
      }
    ]
  }
});
```

## Best Practices

1. **Run Simple Tests First**: Always start with the simple test script to verify basic connectivity
2. **Check Server Status**: Ensure your development server is running before testing
3. **Review Failed Tests**: Pay attention to the details of failed tests for debugging
4. **Use Environment Variables**: Configure your test environment properly
5. **Regular Testing**: Run tests regularly during development to catch issues early
6. **CI/CD Integration**: Include tests in your continuous integration pipeline

## Support

If you encounter issues with the testing scripts:

1. Check the troubleshooting section above
2. Verify your server is running and accessible
3. Review the generated JSON report for detailed error information
4. Check the console output for specific error messages
5. Ensure all environment variables are set correctly

For additional help, refer to the main project documentation or create an issue in the project repository.
