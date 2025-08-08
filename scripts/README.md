# Scripts Directory

This directory contains various utility scripts for the invoice management project.

## Testing Scripts

### Quick Test
```bash
npm run test:quick
```
**File**: `quick-test.js`

A fast test to verify basic server connectivity and endpoint availability. Tests 9 key endpoints in under 10 seconds.

**What it tests**:
- Main page (`/`)
- Login page (`/auth/login`)
- Signup page (`/auth/signup`)
- OAuth endpoint (`/api/oauth`)
- Test endpoints (`/api/test-openai`, `/api/test-oauth`)
- Protected routes (should return 401)

### Simple Endpoint Test
```bash
npm run test:endpoints
```
**File**: `test-endpoints-simple.js`

Comprehensive testing of all API endpoints without authentication requirements. Tests security by ensuring protected endpoints return 401.

**What it tests**:
- Server connectivity
- Frontend pages
- OAuth endpoints
- Utility endpoints
- All protected API endpoints (should return 401)
- Generates detailed JSON report

### Full Endpoint Test
```bash
npm run test:endpoints:full
```
**File**: `test-endpoints.js`

Complete testing with authentication. Requires test user credentials and proper environment setup.

**What it tests**:
- All endpoints with authentication
- Full API functionality
- Team creation and management
- Invoice operations
- AI chat functionality
- QuickBooks integration

### Get Help
```bash
npm run test:endpoints:help
```
Shows all available options and usage examples for the testing scripts.

## Database Scripts

### Apply Immediate Fix
```bash
node scripts/apply-immediate-fix.js
```
**File**: `apply-immediate-fix.js`

Applies immediate database fixes for QuickBooks tokens issues.

### Apply Migration Manually
```bash
node scripts/apply-migration-manually.js
```
**File**: `apply-migration-manually.js`

Manually applies database migrations when automatic migration fails.

### Apply Team Migration
```bash
node scripts/apply-team-migration.js
```
**File**: `apply-team-migration.js`

Applies team-related database migrations.

### Check Foreign Key Constraint
```bash
node scripts/check-foreign-key-constraint.js
```
**File**: `check-foreign-key-constraint.js`

Verifies foreign key constraints in the database.

### Fix QuickBooks Tokens Issue
```bash
node scripts/fix-quickbooks-tokens-issue.js
```
**File**: `fix-quickbooks-tokens-issue.js`

Fixes issues with QuickBooks token storage and encryption.

### Generate Encryption Key
```bash
node scripts/generate-encryption-key.js
```
**File**: `generate-encryption-key.js`

Generates encryption keys for secure data storage.

### Verify Database Schema
```bash
node scripts/verify-database-schema.js
```
**File**: `verify-database-schema.js`

Verifies that the database schema matches expected structure.

## Usage Examples

### Basic Testing
```bash
# Quick test to verify server is running
npm run test:quick

# Comprehensive test without auth
npm run test:endpoints

# Full test with authentication
npm run test:endpoints:full
```

### Custom Configuration
```bash
# Test against different server
npm run test:endpoints -- --base-url https://myapp.vercel.app

# Quick test with custom URL
npm run test:quick -- --base-url http://localhost:3001
```

### Database Operations
```bash
# Generate new encryption key
node scripts/generate-encryption-key.js

# Verify database schema
node scripts/verify-database-schema.js

# Apply team migrations
node scripts/apply-team-migration.js
```

## Environment Variables

### Testing Scripts
- `NEXT_PUBLIC_APP_URL` - Base URL for testing (default: http://localhost:3000)
- `TEST_USER_EMAIL` - Test user email (for full tests)
- `TEST_USER_PASSWORD` - Test user password (for full tests)

### Database Scripts
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ENCRYPTION_KEY` - Encryption key for sensitive data

## Output Files

### Test Reports
- `test-report-simple.json` - Results from simple endpoint tests
- `test-report.json` - Results from full endpoint tests

### Database Scripts
- Generated encryption keys
- Migration logs
- Schema verification reports

## Troubleshooting

### Common Issues

1. **Server Not Running**
   ```
   Error: connect ECONNREFUSED
   ```
   **Solution**: Start your Next.js server with `npm run dev`

2. **Authentication Errors**
   ```
   Error: 401 Unauthorized
   ```
   **Solution**: Check your test credentials and environment variables

3. **Database Connection Issues**
   ```
   Error: Invalid API key
   ```
   **Solution**: Verify your Supabase credentials

### Getting Help

- Run `npm run test:endpoints:help` for testing script options
- Check the main project documentation
- Review the generated JSON reports for detailed error information

## Contributing

When adding new scripts:

1. Follow the existing naming convention
2. Add proper error handling
3. Include help text and usage examples
4. Update this README with new script information
5. Add appropriate npm scripts to `package.json`

## Security Notes

- Never commit sensitive credentials to version control
- Use environment variables for all sensitive configuration
- Test scripts should not expose production data
- Database scripts should be run with appropriate permissions
