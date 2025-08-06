#!/usr/bin/env node

const crypto = require('crypto');

// Test encryption configuration (same as in lib/encryption.ts)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

class TestTokenEncryption {
  static getEncryptionKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  }

  static encrypt(text, secretKey) {
    try {
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      const key = this.getEncryptionKey(secretKey, salt);
      
      const cipher = crypto.createCipher(ALGORITHM, key);
      cipher.setAAD(Buffer.from('quickbooks-token', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
      
      return result.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  static decrypt(encryptedData, secretKey) {
    try {
      const data = Buffer.from(encryptedData, 'base64');
      
      const salt = data.subarray(0, SALT_LENGTH);
      const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      
      const key = this.getEncryptionKey(secretKey, salt);
      
      const decipher = crypto.createDecipher(ALGORITHM, key);
      decipher.setAAD(Buffer.from('quickbooks-token', 'utf8'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}

// Test the encryption
function testEncryption() {
  console.log('🔐 Testing QuickBooks Token Encryption');
  console.log('=====================================');
  console.log('');

  // Generate a test encryption key
  const testKey = crypto.randomBytes(32).toString('base64');
  console.log(`Test Key: ${testKey.substring(0, 20)}...`);
  console.log('');

  // Test data
  const testData = {
    access_token: 'test_access_token_12345',
    refresh_token: 'test_refresh_token_67890',
    realm_id: 'test_realm_123'
  };

  console.log('Original Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');

  try {
    // Test encryption
    console.log('🔒 Encrypting data...');
    const encryptedAccessToken = TestTokenEncryption.encrypt(testData.access_token, testKey);
    const encryptedRefreshToken = TestTokenEncryption.encrypt(testData.refresh_token, testKey);
    
    console.log('Encrypted Access Token:', encryptedAccessToken.substring(0, 50) + '...');
    console.log('Encrypted Refresh Token:', encryptedRefreshToken.substring(0, 50) + '...');
    console.log('');

    // Test decryption
    console.log('🔓 Decrypting data...');
    const decryptedAccessToken = TestTokenEncryption.decrypt(encryptedAccessToken, testKey);
    const decryptedRefreshToken = TestTokenEncryption.decrypt(encryptedRefreshToken, testKey);
    
    console.log('Decrypted Access Token:', decryptedAccessToken);
    console.log('Decrypted Refresh Token:', decryptedRefreshToken);
    console.log('');

    // Verify data integrity
    const isAccessTokenValid = decryptedAccessToken === testData.access_token;
    const isRefreshTokenValid = decryptedRefreshToken === testData.refresh_token;
    
    console.log('✅ Data Integrity Check:');
    console.log(`Access Token Match: ${isAccessTokenValid ? 'PASS' : 'FAIL'}`);
    console.log(`Refresh Token Match: ${isRefreshTokenValid ? 'PASS' : 'FAIL'}`);
    console.log('');

    if (isAccessTokenValid && isRefreshTokenValid) {
      console.log('🎉 All tests passed! Encryption is working correctly.');
    } else {
      console.log('❌ Some tests failed. Check the implementation.');
    }

    // Test with wrong key
    console.log('');
    console.log('🔍 Testing with wrong key...');
    const wrongKey = crypto.randomBytes(32).toString('base64');
    
    try {
      TestTokenEncryption.decrypt(encryptedAccessToken, wrongKey);
      console.log('❌ Decryption with wrong key should have failed!');
    } catch (error) {
      console.log('✅ Decryption with wrong key correctly failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEncryption(); 