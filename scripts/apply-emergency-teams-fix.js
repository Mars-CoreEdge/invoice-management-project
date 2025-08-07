const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '../supabase/migrations/010_emergency_teams_fix.sql');

if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('=== EMERGENCY TEAMS FIX SQL ===');
  console.log(sql);
  console.log('\n=== URGENT INSTRUCTIONS ===');
  console.log('1. Copy the SQL above');
  console.log('2. Go to your Supabase dashboard');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Paste and execute the SQL IMMEDIATELY');
  console.log('5. This will break the infinite recursion cycle');
  console.log('\n=== What This Does ===');
  console.log('- Temporarily disables RLS to break recursion');
  console.log('- Drops all problematic policies');
  console.log('- Re-enables RLS with ultra-simple policies');
  console.log('- Allows basic functionality to work');
  console.log('\n=== After Applying ===');
  console.log('- The teams API should work immediately');
  console.log('- You can create and view teams');
  console.log('- No more infinite recursion errors');
  console.log('- Basic security is maintained (auth required)');
  console.log('\n=== IMPORTANT ===');
  console.log('This is a temporary fix. We can add proper security later.');
  console.log('The main goal is to get your app working again.');
} else {
  console.error('Migration file not found:', migrationPath);
}
