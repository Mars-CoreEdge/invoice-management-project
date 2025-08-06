# Secure Supabase Session Management with QuickBooks OAuth Integration

This document outlines the secure implementation of multi-tenant QuickBooks OAuth integration using Supabase Auth and encrypted token storage.

## 🏗️ Architecture Overview

### Multi-Tenant Design
- **User Isolation**: Each user's QuickBooks tokens are isolated and encrypted
- **Session Management**: Supabase Auth handles user authentication and session persistence
- **Secure Storage**: AES-256-GCM encryption for sensitive token data
- **Row Level Security**: Database-level access control ensures users can only access their own data

### Security Features
- ✅ Encrypted token storage using AES-256-GCM
- ✅ Row Level Security (RLS) policies
- ✅ Automatic token refresh with expiration handling
- ✅ Secure session validation on every API request
- ✅ Multi-tenant data isolation
- ✅ Comprehensive error handling

## 📋 Database Schema

### QuickBooks Tokens Table
```sql
CREATE TABLE quickbooks_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  realm_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one token record per user
  UNIQUE(user_id)
);
```

### Security Features
- **Foreign Key Constraint**: Links to Supabase auth.users table
- **Cascade Delete**: Tokens are automatically deleted when user is deleted
- **Unique Constraint**: One token record per user
- **Row Level Security**: Users can only access their own tokens
- **Automatic Timestamps**: Created and updated timestamps

## 🔐 Encryption Implementation

### Token Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 64-byte random salt per encryption
- **IV**: 16-byte random initialization vector
- **Auth Tag**: 16-byte authentication tag for integrity

### Security Benefits
- **Authenticated Encryption**: Prevents tampering and ensures data integrity
- **Unique Salt**: Each encryption uses a unique salt
- **High Entropy**: 256-bit encryption keys
- **Forward Secrecy**: Compromised keys don't affect previously encrypted data

## 🚀 Setup Instructions

### 1. Environment Configuration

Add the following to your `.env` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# QuickBooks Configuration
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/auth/quickbooks/callback

# QuickBooks Token Encryption (REQUIRED)
QUICKBOOKS_ENCRYPTION_KEY=your_secure_encryption_key_here
```

### 2. Generate Encryption Key

Run the provided script to generate a secure encryption key:

```bash
node scripts/generate-encryption-key.js
```

### 3. Database Migration

Apply the database migration to create the `quickbooks_tokens` table:

```bash
# Copy the SQL from supabase/migrations/001_create_quickbooks_tokens_table.sql
# and run it in your Supabase SQL editor
```

## 🔄 OAuth Flow

### 1. User Authentication
```typescript
// User must be authenticated with Supabase
const { data: { user }, error } = await supabase.auth.getUser()
if (!user) {
  throw new Error('Unauthorized: User not authenticated')
}
```

### 2. QuickBooks OAuth Initiation
```typescript
// Redirect user to QuickBooks OAuth
const authUri = qbs.getAuthUri()
window.location.href = authUri
```

### 3. OAuth Callback Processing
```typescript
// In callback route
await qbs.createToken(authCode, realmId, user.id)
// Tokens are automatically encrypted and stored
```

### 4. Token Retrieval
```typescript
// Load tokens for authenticated user
const tokensLoaded = await qbs.loadTokensForUser(user.id)
if (!tokensLoaded) {
  // Handle missing or expired tokens
}
```

## 🛡️ Security Best Practices

### 1. Environment Variables
- ✅ Store encryption keys securely
- ✅ Use different keys for each environment
- ✅ Never commit keys to version control
- ✅ Use environment-specific configurations

### 2. Token Management
- ✅ Automatic token refresh before expiration
- ✅ Secure token deletion on disconnect
- ✅ Validation of token integrity
- ✅ Cleanup of expired tokens

### 3. API Security
- ✅ Session validation on every request
- ✅ User-specific data isolation
- ✅ Comprehensive error handling
- ✅ Secure error messages (no sensitive data exposure)

### 4. Database Security
- ✅ Row Level Security enabled
- ✅ Proper foreign key constraints
- ✅ Automatic cleanup on user deletion
- ✅ Encrypted sensitive data

## 🔧 API Endpoints

### QuickBooks Status
```typescript
GET /api/quickbooks/status
// Returns connection status for authenticated user

DELETE /api/quickbooks/status
// Disconnects QuickBooks for authenticated user
```

### Invoices
```typescript
GET /api/invoices
// Returns invoices for authenticated user's QuickBooks account
```

### OAuth Callback
```typescript
GET /api/auth/quickbooks/callback
// Handles QuickBooks OAuth callback and token storage
```

## 🚨 Error Handling

### Authentication Errors
- **401 Unauthorized**: User not authenticated
- **401 QuickBooks Required**: QuickBooks not connected
- **403 Forbidden**: Insufficient permissions

### Token Errors
- **Token Expired**: Automatic refresh attempt
- **Refresh Failed**: Cleanup and re-authentication required
- **Decryption Failed**: Token corruption or key mismatch

### API Errors
- **QuickBooks API Errors**: Proper error propagation
- **Network Errors**: Retry logic and user feedback
- **Validation Errors**: Input validation and sanitization

## 🔍 Monitoring and Logging

### Security Events
- Token creation and storage
- Token refresh attempts
- Authentication failures
- Decryption errors
- User disconnections

### Performance Metrics
- API response times
- Token refresh frequency
- Error rates by endpoint
- User activity patterns

## 🧪 Testing

### Security Testing
```bash
# Test encryption/decryption
npm run test:encryption

# Test token management
npm run test:tokens

# Test authentication flows
npm run test:auth
```

### Integration Testing
```bash
# Test QuickBooks API integration
npm run test:quickbooks

# Test OAuth flow
npm run test:oauth
```

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [QuickBooks API Documentation](https://developer.intuit.com/app/developer/qbo/docs/api)
- [AES-256-GCM Security](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [OAuth 2.0 Best Practices](https://tools.ietf.org/html/rfc6819)

## 🔄 Migration Guide

### From Previous Implementation
1. **Backup existing tokens** (if any)
2. **Apply database migration**
3. **Generate encryption key**
4. **Update environment variables**
5. **Test OAuth flow**
6. **Verify token encryption**

### Rollback Plan
1. **Database backup** before migration
2. **Environment variable backup**
3. **Feature flag for gradual rollout**
4. **Monitoring for issues**

## 🆘 Troubleshooting

### Common Issues
- **Encryption Key Missing**: Check `QUICKBOOKS_ENCRYPTION_KEY` environment variable
- **Token Decryption Failed**: Verify encryption key consistency
- **Authentication Errors**: Check Supabase session validity
- **OAuth Failures**: Verify QuickBooks app configuration

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG = 'quickbooks:*,encryption:*,auth:*'
```

---

**⚠️ Security Notice**: This implementation follows security best practices but should be reviewed by security professionals before production deployment. Regular security audits and updates are recommended. 