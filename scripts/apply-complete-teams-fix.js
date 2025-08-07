const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '../supabase/migrations/009_complete_teams_fix.sql');

if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('=== Complete Teams Fix SQL ===');
  console.log(sql);
  console.log('\n=== Instructions ===');
  console.log('1. Copy the SQL above');
  console.log('2. Go to your Supabase dashboard');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Paste and execute the SQL');
  console.log('5. This will create all team tables and fix RLS policies');
  console.log('\n=== What This Fixes ===');
  console.log('- Creates all team tables if they don\'t exist');
  console.log('- Removes infinite recursion in RLS policies');
  console.log('- Ensures proper indexes for performance');
  console.log('- Creates utility functions for team management');
  console.log('- Fixes the 500 error on /api/teams endpoint');
  console.log('\n=== After Applying ===');
  console.log('- The teams API should work correctly');
  console.log('- You can create and manage teams');
  console.log('- No more infinite recursion errors');
} else {
  console.error('Migration file not found:', migrationPath);
}
