const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '../supabase/migrations/007_create_profiles_table.sql');

if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('=== Profiles Table Migration SQL ===');
  console.log(sql);
  console.log('\n=== Instructions ===');
  console.log('1. Copy the SQL above');
  console.log('2. Go to your Supabase dashboard');
  console.log('3. Navigate to SQL Editor');
  console.log('4. Paste and execute the SQL');
  console.log('5. This will create the profiles table and set up automatic profile creation');
} else {
  console.error('Migration file not found:', migrationPath);
}
