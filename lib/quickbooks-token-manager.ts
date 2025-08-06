import { createServerSupabaseClient } from './supabase-server';
import { TokenEncryption, getEncryptionKey } from './encryption';
import { User } from '@supabase/supabase-js';

export interface QuickBooksTokens {
  id: string;
  user_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  realm_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DecryptedTokens {
  access_token: string;
  refresh_token: string;
  realm_id: string;
  expires_at: Date;
}

export class QuickBooksTokenManager {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = getEncryptionKey();
  }

  /**
   * Store QuickBooks tokens for a user with idempotency
   */
  async storeTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    realmId: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      const supabase = createServerSupabaseClient();

      // Encrypt sensitive tokens
      const encryptedAccessToken = TokenEncryption.encrypt(accessToken, this.encryptionKey);
      const encryptedRefreshToken = TokenEncryption.encrypt(refreshToken, this.encryptionKey);

      // console.log(`Storing tokens for user: ${userId}, realm: ${realmId}`);

      // First, check if tokens already exist for this user
      const { data: existingTokens, error: checkError } = await supabase
        .from('quickbooks_tokens')
        .select('id, realm_id')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // console.error('Error checking existing tokens:', checkError);
        throw new Error(`Failed to check existing tokens: ${checkError.message}`);
      }

      if (existingTokens) {
        // console.log(`Updating existing tokens for user: ${userId}`);
        // Update existing record
        const { error: updateError } = await supabase
          .from('quickbooks_tokens')
          .update({
            encrypted_access_token: encryptedAccessToken,
            encrypted_refresh_token: encryptedRefreshToken,
            realm_id: realmId,
            expires_at: expiresAt.toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          // console.error('Error updating QuickBooks tokens:', updateError);
          throw new Error(`Failed to update tokens: ${updateError.message}`);
        }
      } else {
        // console.log(`Creating new tokens for user: ${userId}`);
        // Insert new record
        const { error: insertError } = await supabase
          .from('quickbooks_tokens')
          .insert({
            user_id: userId,
            encrypted_access_token: encryptedAccessToken,
            encrypted_refresh_token: encryptedRefreshToken,
            realm_id: realmId,
            expires_at: expiresAt.toISOString(),
          });

        if (insertError) {
          // console.error('Error inserting QuickBooks tokens:', insertError);
          throw new Error(`Failed to insert tokens: ${insertError.message}`);
        }
      }

      // console.log(`QuickBooks tokens stored successfully for user: ${userId}`);
    } catch (error) {
      console.error('Error in storeTokens:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt QuickBooks tokens for a user
   */
  async getTokens(userId: string): Promise<DecryptedTokens | null> {
    try {
      const supabase = createServerSupabaseClient();

      // Fetch encrypted tokens from database
      const { data, error } = await supabase
        .from('quickbooks_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No tokens found for user
          return null;
        }
        console.error('Error retrieving QuickBooks tokens:', error);
        throw new Error(`Failed to retrieve tokens: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      // Decrypt tokens
      const accessToken = TokenEncryption.decrypt(data.encrypted_access_token, this.encryptionKey);
      const refreshToken = TokenEncryption.decrypt(data.encrypted_refresh_token, this.encryptionKey);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        realm_id: data.realm_id,
        expires_at: new Date(data.expires_at),
      };
    } catch (error) {
      console.error('Error in getTokens:', error);
      throw error;
    }
  }

  /**
   * Update tokens (for refresh scenarios)
   */
  async updateTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      const supabase = createServerSupabaseClient();

      // Encrypt new tokens
      const encryptedAccessToken = TokenEncryption.encrypt(accessToken, this.encryptionKey);
      const encryptedRefreshToken = TokenEncryption.encrypt(refreshToken, this.encryptionKey);

      // Update existing record
      const { error } = await supabase
        .from('quickbooks_tokens')
        .update({
          encrypted_access_token: encryptedAccessToken,
          encrypted_refresh_token: encryptedRefreshToken,
          expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating QuickBooks tokens:', error);
        throw new Error(`Failed to update tokens: ${error.message}`);
      }

      console.log(`QuickBooks tokens updated successfully for user: ${userId}`);
    } catch (error) {
      console.error('Error in updateTokens:', error);
      throw error;
    }
  }

  /**
   * Delete tokens for a user
   */
  async deleteTokens(userId: string): Promise<void> {
    try {
      const supabase = createServerSupabaseClient();

      const { error } = await supabase
        .from('quickbooks_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting QuickBooks tokens:', error);
        throw new Error(`Failed to delete tokens: ${error.message}`);
      }

      console.log(`QuickBooks tokens deleted successfully for user: ${userId}`);
    } catch (error) {
      console.error('Error in deleteTokens:', error);
      throw error;
    }
  }

  /**
   * Check if tokens exist and are valid for a user
   */
  async hasValidTokens(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) {
        return false;
      }

      // Check if tokens are expired (with 5-minute buffer)
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const expiresAt = new Date(tokens.expires_at.getTime() - bufferTime);

      return now < expiresAt;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }

  /**
   * Get user ID from Supabase JWT token
   */
  async getUserIdFromRequest(request: Request): Promise<string> {
    try {
      const supabase = createServerSupabaseClient();
      
      // Get the current user from the session
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        throw new Error('Unauthorized: Invalid or missing session');
      }

      return user.id;
    } catch (error) {
      console.error('Error getting user ID from request:', error);
      throw new Error('Unauthorized: Unable to identify user');
    }
  }

  /**
   * Clean up expired tokens (utility method for maintenance)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const supabase = createServerSupabaseClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('quickbooks_tokens')
        .delete()
        .lt('expires_at', now)
        .select('id');

      if (error) {
        console.error('Error cleaning up expired tokens:', error);
        throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
      }

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} expired QuickBooks tokens`);
      return deletedCount;
    } catch (error) {
      console.error('Error in cleanupExpiredTokens:', error);
      throw error;
    }
  }
}

// Singleton instance
let tokenManager: QuickBooksTokenManager | null = null;

export function getQuickBooksTokenManager(): QuickBooksTokenManager {
  if (!tokenManager) {
    tokenManager = new QuickBooksTokenManager();
  }
  return tokenManager;
} 