# QuickBooks Token Issues and Fixes

## 🔍 Issues Identified

### 1. Foreign Key Constraint Violation
**Error**: `insert or update on table "quickbooks_tokens" violates foreign key constraint "quickbooks_tokens_user_id_fkey"`

**Root Cause**: The `quickbooks_tokens` table was trying to reference a `profiles` table that doesn't exist yet. The table was created with a foreign key to `profiles(id)` but the `profiles` table hasn't been created.

**Impact**: Users cannot connect their QuickBooks accounts because tokens cannot be stored in the database.

### 2. Authorization Code Reuse
**Error**: `{"error":"invalid_grant","error_description":"Authorization code incorrect"}`

**Root Cause**: The OAuth callback was using retry logic that attempted to use the same authorization code multiple times. QuickBooks authorization codes can only be used once.

**Impact**: OAuth flow fails after the first attempt, preventing successful QuickBooks connections.

### 3. Token Expiration Handling
**Issue**: Token expiration calculations and refresh logic needed improvement.

**Impact**: Tokens might expire unexpectedly or refresh logic might not work properly.

## 🛠️ Fixes Applied

### 1. Database Schema Fix

**File**: `supabase/migrations/005_fix_quickbooks_tokens_immediate.sql`

**Changes**:
- Fixed foreign key constraint to reference `auth.users(id)` instead of `profiles(id)`
- Added proper indexes for performance
- Added Row Level Security (RLS) policies
- Added utility functions for token management
- Added automatic timestamp updates

**SQL to Apply**:
```sql
-- Drop existing quickbooks_tokens table if it exists
DROP TABLE IF EXISTS public.quickbooks_tokens CASCADE;

-- Create the quickbooks_tokens table with proper foreign key to auth.users
CREATE TABLE IF NOT EXISTS public.quickbooks_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  realm_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one token record per user with named constraint
  CONSTRAINT quickbooks_tokens_user_id_unique UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_user_id ON public.quickbooks_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_realm_id ON public.quickbooks_tokens(realm_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_expires_at ON public.quickbooks_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_created_at ON public.quickbooks_tokens(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quickbooks_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to only see/modify their own tokens
DROP POLICY IF EXISTS "quickbooks_tokens_access_policy" ON public.quickbooks_tokens;
CREATE POLICY "quickbooks_tokens_access_policy" ON public.quickbooks_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to update quickbooks_tokens updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_quickbooks_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update quickbooks_tokens updated_at timestamp
DROP TRIGGER IF EXISTS on_quickbooks_tokens_updated ON public.quickbooks_tokens;
CREATE TRIGGER on_quickbooks_tokens_updated
  BEFORE UPDATE ON public.quickbooks_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_quickbooks_tokens_updated_at();

-- Function to get user's QuickBooks connection status
CREATE OR REPLACE FUNCTION public.get_user_quickbooks_status(user_uuid UUID)
RETURNS TABLE(
  is_connected BOOLEAN,
  realm_id TEXT,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qt.user_id IS NOT NULL as is_connected,
    qt.realm_id,
    qt.expires_at,
    qt.expires_at < NOW() as is_expired
  FROM auth.users u
  LEFT JOIN public.quickbooks_tokens qt ON u.id = qt.user_id
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.quickbooks_tokens 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. OAuth Callback Fix

**File**: `app/api/auth/quickbooks/callback/route.ts`

**Changes**:
- Removed retry logic that caused authorization code reuse
- Improved error handling
- Added better logging for debugging

**Before**:
```typescript
// Add retry logic for token creation
let retryCount = 0;
const maxRetries = 3;

while (retryCount < maxRetries) {
  try {
    await qbs.createToken(code, realmId, user.id);
    break;
  } catch (error: any) {
    retryCount++;
    if (retryCount >= maxRetries) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
  }
}
```

**After**:
```typescript
// Create token with QuickBooks (no retry - authorization codes can only be used once)
try {
  await qbs.createToken(code, realmId, user.id);
} catch (error: any) {
  throw error;
}
```

### 3. Token Expiration Improvements

**File**: `lib/quickbooks.ts`

**Changes**:
- Improved token expiration calculation with better logging
- Enhanced refresh token logic
- Added proper error handling for expiration

**Token Creation**:
```typescript
// Calculate expiration time with proper handling
const expiresAt = new Date();
const expiresIn = tokenResponse.expires_in || 3600; // Default to 1 hour if not provided
expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

console.log('Token expiration calculated:', {
  expiresIn,
  expiresAt: expiresAt.toISOString(),
  currentTime: new Date().toISOString()
});
```

**Token Refresh**:
```typescript
// Calculate new expiration time with proper handling
const expiresAt = new Date();
const expiresIn = authResponse.expires_in || 3600; // Default to 1 hour if not provided
expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

console.log('Token refresh successful:', {
  expiresIn,
  expiresAt: expiresAt.toISOString(),
  currentTime: new Date().toISOString()
});
```

## 📋 How to Apply the Fixes

### Step 1: Apply Database Fix
1. Run the script: `node scripts/apply-immediate-fix.js`
2. Copy the SQL output
3. Paste it into your Supabase SQL Editor
4. Click "Run" to execute

### Step 2: Verify the Fix
After applying the database fix, test the QuickBooks connection:
1. Go to your application
2. Try connecting QuickBooks
3. Check that tokens are stored successfully
4. Verify that the connection status shows as connected

### Step 3: Test Token Expiration
Run the test script to verify token handling:
```bash
node test-token-expiration.js
```

## 🔍 Verification Queries

After applying the fix, you can verify it worked with these queries:

```sql
-- Check if the table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'quickbooks_tokens';

-- Check if RLS policies were created
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'quickbooks_tokens';

-- Check if functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name IN ('get_user_quickbooks_status', 'cleanup_expired_tokens');

-- Test the connection status function (replace with actual user ID)
SELECT * FROM get_user_quickbooks_status('your-user-id-here');
```

## ⚠️ Important Notes

1. **Data Loss**: The fix will delete any existing QuickBooks tokens. Users will need to reconnect their accounts.

2. **Temporary Solution**: This is a temporary fix. The full multi-tenant schema with `profiles` table should be applied later.

3. **Authorization Codes**: Authorization codes can only be used once. If the OAuth flow fails, users need to start over.

4. **Token Expiration**: QuickBooks tokens typically expire in 1 hour. The system will automatically refresh them when needed.

## 🚀 Next Steps

1. Apply the immediate fix using the provided SQL
2. Test the QuickBooks connection flow
3. Monitor token expiration and refresh behavior
4. Later, apply the full multi-tenant schema when ready

## 📞 Troubleshooting

If you encounter issues after applying the fix:

1. **Check Database**: Verify the table was created correctly
2. **Check Logs**: Look for any error messages in the console
3. **Test OAuth**: Try the QuickBooks connection flow again
4. **Verify Tokens**: Check if tokens are being stored in the database

The fixes should resolve the token storage and OAuth flow issues you were experiencing. 