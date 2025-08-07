const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '../supabase/migrations/008_fix_team_rls_policies.sql');

if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('=== Team RLS Policies Fix SQL ===');
  console.log(sql);
  console.log('\n=== Instructions ===');
  console.log('1. Copy the SQL above');
  console.log('2. Go to your Supabase dashboard');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Paste and execute the SQL');
  console.log('5. This will fix the infinite recursion error in team policies');
  console.log('\n=== What This Fixes ===');
  console.log('- Removes infinite recursion in team_members RLS policies');
  console.log('- Simplifies the policies to avoid self-referencing queries');
  console.log('- Maintains security while fixing the performance issue');
} else {
  console.error('Migration file not found:', migrationPath);
}
