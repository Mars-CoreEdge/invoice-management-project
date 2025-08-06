#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Generate a secure encryption key for QuickBooks token encryption
 * Run this script to generate a new encryption key for your environment
 */
function generateEncryptionKey() {
  // Generate a 32-byte (256-bit) random key
  const key = crypto.randomBytes(32);
  
  // Convert to base64 for easy storage in environment variables
  const base64Key = key.toString('base64');
  
  console.log('🔐 QuickBooks Encryption Key Generated');
  console.log('=====================================');
  console.log('');
  console.log('Add this to your .env file:');
  console.log('');
  console.log(`QUICKBOOKS_ENCRYPTION_KEY=${base64Key}`);
  console.log('');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('• Keep this key secure and never commit it to version control');
  console.log('• Use different keys for development, staging, and production');
  console.log('• If you change this key, all existing QuickBooks tokens will be invalidated');
  console.log('• Store this key securely in your production environment (e.g., in a vault)');
  console.log('');
  console.log('🔑 Key Details:');
  console.log(`• Length: ${base64Key.length} characters`);
  console.log(`• Algorithm: AES-256-GCM`);
  console.log(`• Entropy: ${crypto.randomBytes(32).length * 8} bits`);
  console.log('');
}

// Generate the key
generateEncryptionKey(); 