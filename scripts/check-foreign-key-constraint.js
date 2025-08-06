const fs = require('fs');
const path = require('path');

console.log('🔍 Foreign Key Constraint Verification');
console.log('======================================\n');

console.log('📋 VERIFICATION QUERIES TO RUN IN SUPABASE SQL EDITOR:');
console.log('Run these queries one by one to diagnose the foreign key issue:');

console.log('\n1️⃣ CHECK TABLE STRUCTURE:');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'quickbooks_tokens'
ORDER BY ordinal_position;
`);
console.log('────────────────────────────────────────────────────────────────────────────────');

console.log('\n2️⃣ CHECK FOREIGN KEY CONSTRAINTS:');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'quickbooks_tokens';
`);
console.log('────────────────────────────────────────────────────────────────────────────────');

console.log('\n3️⃣ CHECK IF AUTH.USERS TABLE EXISTS:');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'users' 
  AND table_schema = 'auth';
`);
console.log('────────────────────────────────────────────────────────────────────────────────');

console.log('\n4️⃣ CHECK CURRENT USER SESSION:');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;
`);
console.log('────────────────────────────────────────────────────────────────────────────────');

console.log('\n5️⃣ TEST INSERT WITH SAMPLE DATA:');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`
-- First, get your current user ID
SELECT auth.uid() as current_user_id;

-- Then test insert (replace USER_ID_HERE with your actual user ID)
INSERT INTO public.quickbooks_tokens (
  user_id,
  encrypted_access_token,
  encrypted_refresh_token,
  realm_id,
  expires_at
) VALUES (
  'USER_ID_HERE', -- Replace with your actual user ID
  'test_encrypted_access_token',
  'test_encrypted_refresh_token',
  'test_realm_id',
  NOW() + INTERVAL '1 hour'
) ON CONFLICT (user_id) DO UPDATE SET
  encrypted_access_token = EXCLUDED.encrypted_access_token,
  encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
  realm_id = EXCLUDED.realm_id,
  expires_at = EXCLUDED.expires_at;
`);
console.log('────────────────────────────────────────────────────────────────────────────────');

console.log('\n🔧 POSSIBLE ISSUES AND SOLUTIONS:');

console.log('\n❌ ISSUE 1: Foreign key constraint not properly created');
console.log('SOLUTION: Re-run the migration with explicit constraint name');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`
-- Drop and recreate with explicit constraint
ALTER TABLE public.quickbooks_tokens 
DROP CONSTRAINT IF EXISTS quickbooks_tokens_user_id_fkey;

ALTER TABLE public.quickbooks_tokens 
ADD CONSTRAINT quickbooks_tokens_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
`);
console.log('────────────────────────────────────────────────────────────────────────────────');

console.log('\n❌ ISSUE 2: RLS policy blocking the insert');
console.log('SOLUTION: Check and fix RLS policies');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`
-- Check current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'quickbooks_tokens';

-- Drop and recreate RLS policy if needed
DROP POLICY IF EXISTS "quickbooks_tokens_access_policy" ON public.quickbooks_tokens;

CREATE POLICY "quickbooks_tokens_access_policy" ON public.quickbooks_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`);
console.log('────────────────────────────────────────────────────────────────────────────────');

console.log('\n❌ ISSUE 3: User ID format mismatch');
console.log('SOLUTION: Verify user ID format and ensure it exists in auth.users');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`
-- Check if your user exists in auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE id = auth.uid();
`);
console.log('────────────────────────────────────────────────────────────────────────────────');

console.log('\n📝 INSTRUCTIONS:');
console.log('1. Run the verification queries above in your Supabase SQL Editor');
console.log('2. Check the results to identify the specific issue');
console.log('3. Apply the appropriate solution based on the findings');
console.log('4. Test the QuickBooks OAuth flow again');

console.log('\n🔍 EXPECTED RESULTS:');
console.log('- Query 1: Should show user_id column with UUID data type');
console.log('- Query 2: Should show foreign key constraint to auth.users(id)');
console.log('- Query 3: Should show auth.users table exists');
console.log('- Query 4: Should return your current user ID');
console.log('- Query 5: Should insert/update successfully without errors'); 