import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export class TokenEncryption {
  private static getEncryptionKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  }

  /**
   * Encrypt sensitive data (access token, refresh token)
   */
  static encrypt(text: string, secretKey: string): string {
    try {
      // Generate salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Derive encryption key
      const key = this.getEncryptionKey(secretKey, salt);
      
      // Create cipher using modern API
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine salt + iv + encrypted data
      const result = Buffer.concat([salt, iv, Buffer.from(encrypted, 'hex')]);
      
      return result.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt token data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string, secretKey: string): string {
    try {
      // Convert from base64
      const data = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = data.subarray(0, SALT_LENGTH);
      const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH);
      
      // Derive decryption key
      const key = this.getEncryptionKey(secretKey, salt);
      
      // Create decipher using modern API
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt token data');
    }
  }

  /**
   * Generate a secure encryption key for the application
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Validate if a string is properly encrypted
   */
  static isValidEncryptedData(data: string): boolean {
    try {
      const buffer = Buffer.from(data, 'base64');
      return buffer.length >= SALT_LENGTH + IV_LENGTH + 1;
    } catch {
      return false;
    }
  }
}

/**
 * Get the encryption key from environment variables
 * In production, this should be stored securely (e.g., in a vault)
 */
export function getEncryptionKey(): string {
  const key = process.env.QUICKBOOKS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('QUICKBOOKS_ENCRYPTION_KEY environment variable is required for token encryption');
  }
  return key;
}