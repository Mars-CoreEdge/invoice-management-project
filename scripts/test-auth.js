#!/usr/bin/env node

/**
 * Simple Authentication Test Script
 * Tests Supabase authentication before running full endpoint tests
 */

// Load environment variables from .env.local if present (no external dependency)
(() => {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const [key, ...valueParts] = trimmed.split('=');
        if (!key || valueParts.length === 0) return;
        const value = valueParts.join('=').replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = value;
      });
    }
  } catch {}
})();

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuthentication() {
  log('🔐 Testing Supabase Authentication...', 'cyan');
  
  // Check environment variables
  if (!SUPABASE_URL) {
    log('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable', 'red');
    return false;
  }
  
  if (!SUPABASE_ANON_KEY) {
    log('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable', 'red');
    return false;
  }
  
  log(`✅ Environment variables found`, 'green');
  log(`   Supabase URL: ${SUPABASE_URL.substring(0, 30)}...`, 'blue');
  log(`   Test User: ${TEST_USER_EMAIL}`, 'blue');
  if (SERVICE_ROLE_KEY) {
    log('   Service role key detected (admin provisioning enabled)', 'blue');
  }
  
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    log('✅ Supabase client created successfully', 'green');
    
    // Test connection by getting auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      log(`❌ Failed to get session: ${sessionError.message}`, 'red');
      return false;
    }
    
    log('✅ Supabase connection successful', 'green');
    
    // Try to sign in with existing user
    log('🔄 Attempting to sign in...', 'yellow');
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (signInError) {
      log(`⚠️  Sign in failed: ${signInError.message}`, 'yellow');
      log('🔄 Attempting to create test user...', 'yellow');

      // Prefer admin provisioning if service role key available
      if (SERVICE_ROLE_KEY) {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const admin = createAdminClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { data: created, error: adminErr } = await admin.auth.admin.createUser({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
          email_confirm: true
        });
        if (adminErr) {
          log(`❌ Admin createUser failed: ${adminErr.message}`, 'red');
          return false;
        }
        log('✅ Admin user provisioned and confirmed', 'green');
        // Now sign in normally with anon key
        const { data: afterAdminSignIn, error: afterAdminErr } = await supabase.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        });
        if (afterAdminErr) {
          log(`❌ Sign in after admin provisioning failed: ${afterAdminErr.message}`, 'red');
          return false;
        }
        signInData = afterAdminSignIn;
      } else {
        // Fallback: normal sign up via anon key (may require email confirmation)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        });
        
        if (signUpError) {
          log(`❌ Sign up failed: ${signUpError.message}`, 'red');
          return false;
        }
        
        if (signUpData.user && !signUpData.user.email_confirmed_at) {
          log('⚠️  User created but email confirmation required', 'yellow');
          log('   In a real environment, you would need to confirm the email', 'yellow');
          return false;
        }
        
        signInData = signUpData;
      }
    }
    
    if (signInData.session) {
      log('✅ Authentication successful!', 'green');
      log(`   User ID: ${signInData.user.id}`, 'blue');
      log(`   Email: ${signInData.user.email}`, 'blue');
      log(`   Access Token: ${signInData.session.access_token.substring(0, 20)}...`, 'blue');
      return true;
    } else {
      log('❌ No session returned after authentication', 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Authentication test failed: ${error.message}`, 'red');
    return false;
  }
}

// Run the test
testAuthentication().then(success => {
  if (success) {
    log('\n🎉 Authentication test passed! You can now run the full endpoint tests.', 'green');
    process.exit(0);
  } else {
    log('\n💥 Authentication test failed! Please check your environment variables and Supabase setup.', 'red');
    process.exit(1);
  }
});
