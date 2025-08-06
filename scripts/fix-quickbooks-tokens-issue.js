const fs = require('fs');
const path = require('path');

console.log('🔧 QuickBooks Tokens Foreign Key Fix');
console.log('====================================\n');

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_fix_quickbooks_tokens_immediate.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 DIAGNOSIS:');
console.log('The error "violates foreign key constraint quickbooks_tokens_user_id_fkey"');
console.log('indicates that the quickbooks_tokens table is trying to reference a user');
console.log('that doesn\'t exist in the auth.users table.\n');

console.log('🔍 POSSIBLE CAUSES:');
console.log('1. The 005_fix_quickbooks_tokens_immediate.sql migration was not applied');
console.log('2. The user ID from the session doesn\'t exist in auth.users');
console.log('3. There\'s a mismatch between the table structure and the foreign key');
console.log('4. The existing quickbooks_tokens table has the wrong foreign key reference\n');

console.log('📋 FIX SQL:');
console.log('Copy and paste this SQL into your Supabase SQL Editor:\n');
console.log('─'.repeat(80));
console.log(migrationContent);
console.log('─'.repeat(80));

console.log('\n📝 INSTRUCTIONS:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy the SQL content above');
console.log('4. Paste it into the SQL Editor');
console.log('5. Click "Run" to execute the migration');
console.log('6. Wait for the migration to complete');

console.log('\n🔍 VERIFICATION QUERIES:');
console.log('After running the migration, run these queries to verify:');
console.log('');
console.log('-- Check if the table was created correctly:');
console.log('SELECT table_name, column_name, data_type, is_nullable');
console.log('FROM information_schema.columns');
console.log('WHERE table_name = \'quickbooks_tokens\' AND table_schema = \'public\';');
console.log('');
console.log('-- Check if the foreign key constraint exists:');
console.log('SELECT conname, confrelid::regclass as referenced_table');
console.log('FROM pg_constraint');
console.log('WHERE conrelid = \'public.quickbooks_tokens\'::regclass AND contype = \'f\';');
console.log('');
console.log('-- Check if your user exists in auth.users:');
console.log('SELECT id, email, created_at FROM auth.users WHERE id = \'0d4cfb9c-aa99-4d5b-925a-db944182c1bf\';');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('- This migration will DROP and RECREATE the quickbooks_tokens table');
console.log('- Any existing QuickBooks tokens will be lost');
console.log('- Users will need to re-authenticate with QuickBooks after this fix');
console.log('- Make sure to backup any important data before running this migration');

console.log('\n✅ AFTER FIX:');
console.log('- The foreign key constraint will be properly set up');
console.log('- QuickBooks OAuth tokens will be stored successfully');
console.log('- The "no token available for user" error should be resolved');
console.log('- Users can complete the OAuth flow without issues\n');

console.log('🚀 NEXT STEPS:');
console.log('1. Apply the migration above');
console.log('2. Test the QuickBooks OAuth flow again');
console.log('3. Verify that tokens are being stored successfully');
console.log('4. Check that the dashboard shows the correct connection status'); 