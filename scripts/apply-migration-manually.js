const fs = require('fs');
const path = require('path');

console.log('🚀 QuickBooks Tokens Table Fix - Manual Migration Application');
console.log('================================================================\n');

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_fix_quickbooks_tokens_immediate.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 MIGRATION SQL CONTENT:');
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

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('- This will DROP and RECREATE the quickbooks_tokens table');
console.log('- Any existing tokens will be lost (this is expected for the fix)');
console.log('- The new table will reference auth.users directly');
console.log('- RLS policies will be created for security');

console.log('\n✅ AFTER MIGRATION:');
console.log('- Try the QuickBooks OAuth flow again');
console.log('- Tokens should now be stored successfully');
console.log('- The foreign key constraint error should be resolved');

console.log('\n🔍 VERIFICATION:');
console.log('After running the migration, you can verify it worked by running:');
console.log('SELECT * FROM public.quickbooks_tokens LIMIT 1;');
console.log('This should return an empty result (no error) if the table was created correctly.\n'); 