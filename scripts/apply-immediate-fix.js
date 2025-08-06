#!/usr/bin/env node

/**
 * Immediate Database Fix Script
 * 
 * This script applies the immediate fix for the quickbooks_tokens table
 * to resolve the foreign key constraint issue.
 * 
 * Usage:
 * 1. Run: node scripts/apply-immediate-fix.js
 * 2. Copy the SQL output and paste it into your Supabase SQL Editor
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Immediate Database Fix for QuickBooks Tokens');
console.log('===============================================\n');

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_fix_quickbooks_tokens_immediate.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Fix SQL Content:');
console.log('===================');
console.log(migrationSQL);
console.log('\n');

console.log('📝 Instructions:');
console.log('================');
console.log('1. Open your Supabase Dashboard');
console.log('2. Go to the SQL Editor');
console.log('3. Copy the SQL content above');
console.log('4. Paste it into the SQL Editor');
console.log('5. Click "Run" to execute the fix');
console.log('\n');

console.log('🔍 What This Fix Does:');
console.log('======================');
console.log('• Drops the existing quickbooks_tokens table');
console.log('• Recreates it with proper foreign key to auth.users');
console.log('• Adds Row Level Security (RLS) policies');
console.log('• Creates utility functions for token management');
console.log('• Fixes the foreign key constraint violation error');
console.log('\n');

console.log('⚠️  Important Notes:');
console.log('===================');
console.log('• This will DELETE any existing QuickBooks tokens');
console.log('• Users will need to reconnect their QuickBooks accounts');
console.log('• This is a temporary fix until the full multi-tenant schema is applied');
console.log('\n');

console.log('✅ Fix ready to apply!');
console.log('Copy the SQL content above and paste it into your Supabase SQL Editor.'); 