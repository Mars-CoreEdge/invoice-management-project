import QuickBooks from 'node-quickbooks';
import OAuthClient from 'intuit-oauth';
import { getQuickBooksTokenManager, DecryptedTokens } from './quickbooks-token-manager';

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  redirectUri: string;
}

export interface Invoice {
  Id?: string;
  SyncToken?: string;
  MetaData?: any;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  CustomerRef?: {
    value: string;
    name?: string;
  };
  Line?: Array<{
    Id?: string;
    LineNum?: number;
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef: {
        value: string;
        name?: string;
      };
      Qty?: number;
      UnitPrice?: number;
    };
  }>;
  BillEmail?: {
    Address: string;
  };
  EmailStatus?: string;
  PrintStatus?: string;
  void?: boolean;
}

export interface InvoiceSearchCriteria {
  customerId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'paid' | 'unpaid' | 'overdue' | 'all';
  limit?: number;
  offset?: number;
}

export interface QBOSession {
  realmId: string;
  access_token: string;
  refresh_token: string;
  QUICKBOOKS_CLIENT_ID: string;
  QUICKBOOKS_CLIENT_SECRET: string;
}

export class QuickBooksService {
  private qbo: any;
  private oauthClient: OAuthClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private realmId: string | null = null;
  private config: QuickBooksConfig;
  private userId: string | null = null;
  private tokenManager = getQuickBooksTokenManager();

  constructor(config: QuickBooksConfig) {
    // Validate configuration
    if (!config.clientId) {
      throw new Error('QuickBooks Client ID is required. Please set QUICKBOOKS_CLIENT_ID in your environment variables.');
    }
    if (!config.clientSecret) {
      throw new Error('QuickBooks Client Secret is required. Please set QUICKBOOKS_CLIENT_SECRET in your environment variables.');
    }
    if (!config.redirectUri) {
      throw new Error('QuickBooks Redirect URI is required. Please set NEXTAUTH_URL in your environment variables.');
    }

    this.config = config;
    
    console.log('Initializing QuickBooks OAuth with:', {
      clientId: config.clientId.substring(0, 10) + '...',
      environment: config.environment,
      redirectUri: config.redirectUri
    });

    this.oauthClient = new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
      redirectUri: config.redirectUri,
    });
  }

  // Getter methods to access authentication state
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Set tokens manually (for session management)
   */
  setTokens(refreshToken: string, realmId: string, userId: string): void {
    this.refreshToken = refreshToken;
    this.realmId = realmId;
    this.userId = userId;
  }

  getRealmId(): string | null {
    return this.realmId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  isAuthenticated(): boolean {
    return !!(this.accessToken && this.realmId && this.userId);
  }

  // Get QBO session object
  getQBOSession(): QBOSession | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    
    return {
      realmId: this.realmId!,
      access_token: this.accessToken!,
      refresh_token: this.refreshToken!,
      QUICKBOOKS_CLIENT_ID: this.config.clientId,
      QUICKBOOKS_CLIENT_SECRET: this.config.clientSecret
    };
  }

  // OAuth flow methods
  getAuthUri(): string {
    try {
      if (!this.config.clientId) {
        throw new Error('Client ID is not configured');
      }

      const authUri = this.oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting],
        state: 'invoice-management-state',
      });

      console.log('Generated OAuth URI:', authUri);
      return authUri;
    } catch (error) {
      console.error('Error generating OAuth URI:', error);
      throw new Error(`Failed to generate OAuth URI: ${error}`);
    }
  }

  async createToken(authCode: string, realmId: string, userId: string): Promise<void> {
    try {
      console.log('Creating token with QuickBooks...');
      console.log('Auth code:', authCode ? `${authCode.substring(0, 20)}...` : 'null');
      console.log('Realm ID:', realmId);
      console.log('User ID:', userId);
      
      // Manual token exchange to fix the empty request body issue
      const tokenResponse = await this.exchangeCodeForToken(authCode);

      console.log('Token response received:', {
        hasAccessToken: !!tokenResponse.access_token,
        hasRefreshToken: !!tokenResponse.refresh_token,
        tokenType: tokenResponse.token_type,
        expiresIn: tokenResponse.expires_in
      });

      if (!tokenResponse.access_token) {
        throw new Error('No access token received from QuickBooks');
      }

      // Calculate expiration time with proper handling
      const expiresAt = new Date();
      const expiresIn = tokenResponse.expires_in || 3600; // Default to 1 hour if not provided
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      
      console.log('Token expiration calculated:', {
        expiresIn,
        expiresAt: expiresAt.toISOString(),
        currentTime: new Date().toISOString()
      });

      // Store tokens securely in database
      await this.tokenManager.storeTokens(
        userId,
        tokenResponse.access_token,
        tokenResponse.refresh_token,
        realmId,
        expiresAt
      );

      // Set local instance variables
      this.accessToken = tokenResponse.access_token;
      this.refreshToken = tokenResponse.refresh_token;
      this.realmId = realmId;
      this.userId = userId;
      
      console.log('Tokens stored successfully in database');
      console.log('Access token:', this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null');
      console.log('Refresh token:', this.refreshToken ? `${this.refreshToken.substring(0, 20)}...` : 'null');
      console.log('Realm ID:', this.realmId);
      console.log('User ID:', this.userId);
      
      this.initializeQBO();
      console.log('QuickBooks service initialized successfully');

    } catch (error) {
      console.error('Error creating token:', error);
      throw new Error(`QuickBooks OAuth failed: ${error}`);
    }
  }

  private async exchangeCodeForToken(authCode: string): Promise<any> {
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    
    // Create Basic Auth header
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    // Prepare the request body
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: this.config.redirectUri
    });

    console.log('Token exchange request:', {
      url: tokenUrl,
      grantType: 'authorization_code',
      code: authCode.substring(0, 20) + '...',
      redirectUri: this.config.redirectUri
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'User-Agent': 'InvoiceManagement/1.0'
      },
      body: requestBody.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const tokenData = await response.json();
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    });

    return tokenData;
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.userId) {
      throw new Error('No refresh token available or user not authenticated');
    }

    try {
      console.log('Refreshing QuickBooks access token...');
      
      const authResponse = await this.oauthClient.refresh();
      
      // Calculate new expiration time with proper handling
      const expiresAt = new Date();
      const expiresIn = authResponse.expires_in || 3600; // Default to 1 hour if not provided
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      
      console.log('Token refresh successful:', {
        expiresIn,
        expiresAt: expiresAt.toISOString(),
        currentTime: new Date().toISOString()
      });

      // Update tokens in database
      await this.tokenManager.updateTokens(
        this.userId,
        authResponse.access_token,
        authResponse.refresh_token,
        expiresAt
      );

      // Update local instance variables
      this.accessToken = authResponse.access_token;
      this.refreshToken = authResponse.refresh_token;
      
      this.initializeQBO();
      console.log('Access token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  private initializeQBO(): void {
    if (!this.accessToken || !this.realmId) {
      throw new Error('Missing access token or realm ID');
    }

    this.qbo = new QuickBooks(
      this.config.clientId,
      this.config.clientSecret,
      this.accessToken,
      false, // no token secret needed for OAuth 2.0
      this.realmId,
      true, // use sandbox
      true, // enable debugging
      '4', // minor version
      '2.0', // oauth version
      this.refreshToken || undefined
    );
  }

  /**
   * Load tokens from database for a specific user
   */
  async loadTokensForUser(userId: string): Promise<boolean> {
    try {
      console.log(`Loading QuickBooks tokens for user: ${userId}`);
      
      const tokens = await this.tokenManager.getTokens(userId);
      
      if (!tokens) {
        console.log('No tokens found for user');
        return false;
      }

      // Check if tokens are expired (with 5-minute buffer)
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const expiresAt = new Date(tokens.expires_at.getTime() - bufferTime);
      
      if (now >= expiresAt) {
        console.log('Tokens are expired or will expire soon, attempting refresh...');
        try {
          // Set current tokens for refresh
          this.accessToken = tokens.access_token;
          this.refreshToken = tokens.refresh_token;
          this.realmId = tokens.realm_id;
          this.userId = userId;
          
          await this.refreshAccessToken();
          return true;
        } catch (refreshError) {
          console.error('Failed to refresh expired tokens:', refreshError);
          // Clean up expired tokens
          await this.tokenManager.deleteTokens(userId);
          return false;
        }
      }

      // Set tokens for current session
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      this.realmId = tokens.realm_id;
      this.userId = userId;
      
      this.initializeQBO();
      console.log('QuickBooks tokens loaded successfully from database');
      return true;
      
    } catch (error) {
      console.error('Error loading tokens for user:', error);
      return false;
    }
  }

  /**
   * Disconnect QuickBooks for a user
   */
  async disconnectUser(userId: string): Promise<void> {
    try {
      await this.tokenManager.deleteTokens(userId);
      
      // Clear local instance variables
      this.accessToken = null;
      this.refreshToken = null;
      this.realmId = null;
      this.userId = null;
      this.qbo = null;
      
      console.log(`QuickBooks disconnected for user: ${userId}`);
    } catch (error) {
      console.error('Error disconnecting user:', error);
      throw error;
    }
  }

  // Helper method to check if authenticated
  private checkAuthentication(): void {
    if (!this.accessToken || !this.realmId || !this.qbo) {
      throw new Error('QuickBooks authentication required. Please connect your QuickBooks account first.');
    }
  }

  // Direct API method to fetch invoices (same as Express server)
  async fetchInvoicesDirect(limit: number = 1000): Promise<any[]> {
    if (!this.accessToken || !this.realmId) {
      throw new Error('QuickBooks authentication required. Please connect your QuickBooks account first.');
    }

    const minorversion = 65;
    const query = `SELECT * FROM Invoice STARTPOSITION 1 MAXRESULTS ${limit}`;
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${this.realmId}/query?query=${encodeURIComponent(query)}&minorversion=${minorversion}`;

    try {
      const apiRes = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/text'
        }
      });

      const data = await apiRes.json();

      if (data.Fault) {
        throw new Error(`QuickBooks API Error: ${JSON.stringify(data.Fault)}`);
      }

      return data.QueryResponse?.Invoice || [];
    } catch (error) {
      throw new Error(`Failed to fetch invoices: ${error}`);
    }
  }

  // Invoice CRUD Operations
  async getInvoice(invoiceId: string): Promise<Invoice> {
    this.checkAuthentication();
    
    return new Promise((resolve, reject) => {
      this.qbo.getInvoice(invoiceId, (err: any, invoice: Invoice) => {
        if (err) {
          reject(new Error(`Failed to get invoice: ${err.message}`));
        } else {
          resolve(invoice);
        }
      });
    });
  }

  async findInvoices(criteria: InvoiceSearchCriteria = {}): Promise<Invoice[]> {
    this.checkAuthentication();
    
    try {
      // Use the direct API approach that we know works
      const limit = criteria.limit || 1000;
      const minorversion = 65;
      const startposition = (criteria.offset || 0) + 1;
      const query = `SELECT * FROM Invoice STARTPOSITION ${startposition} MAXRESULTS ${limit}`;
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${this.realmId}/query?query=${encodeURIComponent(query)}&minorversion=${minorversion}`;

      console.log('Fetching invoices from QuickBooks API:', url);

      const apiRes = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/text'
        }
      });

      const data = await apiRes.json();

      if (data.Fault) {
        console.error('QuickBooks API Error:', data.Fault);
        throw new Error(`QuickBooks API Error: ${JSON.stringify(data.Fault)}`);
      }

      const invoices = data.QueryResponse?.Invoice || [];
      console.log(`Found ${invoices.length} invoices from QuickBooks`);

      return invoices;
    } catch (error) {
      console.error('Error in findInvoices:', error);
      throw new Error(`Failed to find invoices: ${error}`);
    }
  }

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    this.checkAuthentication();
    
    return new Promise((resolve, reject) => {
      this.qbo.createInvoice(invoiceData, (err: any, invoice: Invoice) => {
        if (err) {
          reject(new Error(`Failed to create invoice: ${err.message}`));
        } else {
          resolve(invoice);
        }
      });
    });
  }

  async updateInvoice(invoiceData: Invoice): Promise<Invoice> {
    this.checkAuthentication();
    
    return new Promise((resolve, reject) => {
      this.qbo.updateInvoice(invoiceData, (err: any, invoice: Invoice) => {
        if (err) {
          reject(new Error(`Failed to update invoice: ${err.message}`));
        } else {
          resolve(invoice);
        }
      });
    });
  }

  async voidInvoice(invoiceId: string): Promise<Invoice> {
    this.checkAuthentication();
    
    try {
      const invoice = await this.getInvoice(invoiceId);
      const voidedInvoice = { ...invoice, void: true };
      return await this.updateInvoice(voidedInvoice);
    } catch (error) {
      throw new Error(`Failed to void invoice: ${error}`);
    }
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    this.checkAuthentication();
    
    return new Promise((resolve, reject) => {
      this.qbo.deleteInvoice(invoiceId, (err: any) => {
        if (err) {
          reject(new Error(`Failed to delete invoice: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async sendInvoicePdf(invoiceId: string, emailAddress: string): Promise<void> {
    this.checkAuthentication();
    
    return new Promise((resolve, reject) => {
      this.qbo.sendInvoicePdf(invoiceId, emailAddress, (err: any) => {
        if (err) {
          reject(new Error(`Failed to send invoice PDF: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  // Utility methods
  async getCompanyInfo(): Promise<any> {
    this.checkAuthentication();
    
    return new Promise((resolve, reject) => {
      this.qbo.getCompanyInfo(this.realmId, (err: any, companyInfo: any) => {
        if (err) {
          reject(new Error(`Failed to get company info: ${err.message}`));
        } else {
          resolve(companyInfo);
        }
      });
    });
  }

  async getCustomers(): Promise<any[]> {
    this.checkAuthentication();
    
    return new Promise((resolve, reject) => {
      this.qbo.findCustomers((err: any, customers: any[]) => {
        if (err) {
          reject(new Error(`Failed to get customers: ${err.message}`));
        } else {
          resolve(customers || []);
        }
      });
    });
  }

  async getItems(): Promise<any[]> {
    this.checkAuthentication();
    
    return new Promise((resolve, reject) => {
      this.qbo.findItems((err: any, items: any[]) => {
        if (err) {
          reject(new Error(`Failed to get items: ${err.message}`));
        } else {
          resolve(items || []);
        }
      });
    });
  }
}

// Singleton instance
let quickBooksService: QuickBooksService | null = null;

export function getQuickBooksService(): QuickBooksService {
  if (!quickBooksService) {
    // Use environment variables for configuration
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;

    // Validate required environment variables
    if (!clientId) {
      throw new Error('QUICKBOOKS_CLIENT_ID environment variable is required');
    }
    if (!clientSecret) {
      throw new Error('QUICKBOOKS_CLIENT_SECRET environment variable is required');
    }
    if (!redirectUri) {
      throw new Error('QUICKBOOKS_REDIRECT_URI environment variable is required');
    }

    console.log('Creating new QuickBooks service instance:', {
      clientId: clientId.substring(0, 8) + '...',
      redirectUri
    });

    quickBooksService = new QuickBooksService({
      clientId,
      clientSecret,
      environment: 'sandbox',
      redirectUri,
    });
  }
  return quickBooksService;
}

// Reset function for testing/debugging
export function resetQuickBooksService(): void {
  quickBooksService = null;
  console.log('QuickBooks service reset');
} 