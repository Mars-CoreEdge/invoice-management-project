#!/usr/bin/env node

/**
 * Environment Setup Script for API Testing
 * This script helps users set up the required environment variables for testing
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if .env file exists
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    logSuccess('.env.local file found');
    return envPath;
  } else {
    logWarning('.env.local file not found');
    return null;
  }
}

// Check required environment variables
function checkRequiredEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = [];
  const present = [];
  
  for (const varName of required) {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  }
  
  return { missing, present };
}

// Create sample .env.local file
function createSampleEnvFile() {
  const sampleContent = `# Supabase Configuration
# Get these values from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration (optional for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# QuickBooks Configuration (optional for QuickBooks integration)
QUICKBOOKS_CLIENT_ID=your-quickbooks-client-id
QUICKBOOKS_CLIENT_SECRET=your-quickbooks-client-secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/auth/quickbooks/callback

# Test Configuration (optional)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, sampleContent);
    logSuccess('Created .env.local file with sample configuration');
    return envPath;
  } catch (error) {
    logError(`Failed to create .env.local file: ${error.message}`);
    return null;
  }
}

// Load environment variables from .env.local
function loadEnvFile(envPath) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    }
    
    logSuccess('Loaded environment variables from .env.local');
  } catch (error) {
    logError(`Failed to load .env.local: ${error.message}`);
  }
}

// Main setup function
function setupEnvironment() {
  log('\n🔧 Environment Setup for API Testing', 'bright');
  log('='.repeat(50), 'bright');
  
  // Check for .env.local file
  const envPath = checkEnvFile();
  
  if (envPath) {
    // Load existing environment variables
    loadEnvFile(envPath);
  } else {
    // Create sample file
    logInfo('Creating sample .env.local file...');
    createSampleEnvFile();
    logWarning('Please edit .env.local with your actual configuration values');
  }
  
  // Check required variables
  const { missing, present } = checkRequiredEnvVars();
  
  log('\n📋 Environment Variables Status:', 'bright');
  
  if (present.length > 0) {
    logSuccess(`Found ${present.length} required variables:`);
    present.forEach(varName => {
      log(`  - ${varName}`, 'green');
    });
  }
  
  if (missing.length > 0) {
    logError(`Missing ${missing.length} required variables:`);
    missing.forEach(varName => {
      log(`  - ${varName}`, 'red');
    });
    
    log('\n🔧 Setup Instructions:', 'bright');
    log('1. Go to your Supabase project dashboard', 'cyan');
    log('2. Navigate to Settings > API', 'cyan');
    log('3. Copy the "Project URL" and "anon public" key', 'cyan');
    log('4. Update your .env.local file with these values', 'cyan');
    log('5. Restart your development server', 'cyan');
    
    log('\n💡 Quick Setup:', 'bright');
    log('You can also run: npm run test:auth', 'cyan');
    log('This will help you verify your Supabase connection', 'cyan');
  }
  
  // Test Supabase connection if variables are present
  if (missing.length === 0) {
    log('\n🧪 Testing Supabase Connection...', 'bright');
    testSupabaseConnection();
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logError('Supabase URL or key not found in environment');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by checking if we can access the database
    const { data, error } = await supabase.from('teams').select('count').limit(1);
    
    if (error) {
      logError(`Supabase connection failed: ${error.message}`);
      logWarning('Please check your Supabase URL and key');
    } else {
      logSuccess('Supabase connection successful!');
      logInfo('Your environment is ready for API testing');
    }
  } catch (error) {
    logError(`Failed to test Supabase connection: ${error.message}`);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log(`
Environment Setup Script

Usage: node setup-env.js [options]

Options:
  --create-sample    Create a sample .env.local file
  --test-connection  Test Supabase connection
  --help, -h        Show this help message

Examples:
  node setup-env.js
  node setup-env.js --create-sample
  node setup-env.js --test-connection
`, 'cyan');
  process.exit(0);
}

if (args.includes('--create-sample')) {
  createSampleEnvFile();
  process.exit(0);
}

if (args.includes('--test-connection')) {
  testSupabaseConnection();
  process.exit(0);
}

// Run the setup
setupEnvironment();
