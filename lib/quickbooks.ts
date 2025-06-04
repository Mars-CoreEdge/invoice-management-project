import QuickBooks from 'node-quickbooks';
import OAuthClient from 'intuit-oauth';

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

export class QuickBooksService {
  private qbo: any;
  private oauthClient: OAuthClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private realmId: string | null = null;
  private config: QuickBooksConfig;

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

  async createToken(authCode: string, realmId: string): Promise<void> {
    try {
      console.log('Creating token with QuickBooks... 2' );
      const authResponse = await this.oauthClient.createToken(authCode);

      console.log('Auth response:', authResponse);

      // console.log('Token created successfully');
      // console.log('Access token:', authResponse.access_token);
      // console.log('Refresh token:', authResponse.refresh_token);
      // console.log('Realm ID:', realmId);


      this.accessToken = authResponse.access_token;
      this.refreshToken = authResponse.refresh_token;
      this.realmId = realmId;
      
      this.initializeQBO();

      // console.log('Token created successfully');
      // console.log('Access token:', this.accessToken);
      // console.log('Refresh token:', this.refreshToken);
      // console.log('Realm ID:', this.realmId);

    } catch (error) {
      console.error('Error creating token:', error);
      // throw new Error(`QuickBooks OAuth failed: ${error}`);
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const authResponse = await this.oauthClient.refresh();
      this.accessToken = authResponse.access_token;
      this.refreshToken = authResponse.refresh_token;
      
      this.initializeQBO();
    } catch (error) {
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
      // true, // enable debugging
      undefined, // minor version
      '2.0', // oauth version
      this.refreshToken || undefined
    );
  }

  // Helper method to check if authenticated
  private checkAuthentication(): void {
    if (!this.accessToken || !this.realmId || !this.qbo) {
      throw new Error('QuickBooks authentication required. Please connect your QuickBooks account first.');
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
    
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM Invoice";
      const conditions: string[] = [];

      if (criteria.customerId) {
        conditions.push(`CustomerRef = '${criteria.customerId}'`);
      }

      if (criteria.startDate) {
        conditions.push(`TxnDate >= '${criteria.startDate}'`);
      }

      if (criteria.endDate) {
        conditions.push(`TxnDate <= '${criteria.endDate}'`);
      }

      if (criteria.status === 'paid') {
        conditions.push(`Balance = '0'`);
      } else if (criteria.status === 'unpaid') {
        conditions.push(`Balance > '0'`);
      } else if (criteria.status === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        conditions.push(`Balance > '0' AND DueDate < '${today}'`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (criteria.limit) {
        query += ` MAXRESULTS ${criteria.limit}`;
      }

      if (criteria.offset) {
        query += ` STARTPOSITION ${criteria.offset + 1}`;
      }

      this.qbo.findInvoices(query, (err: any, invoices: Invoice[]) => {
        if (err) {
          reject(new Error(`Failed to find invoices: ${err.message}`));
        } else {
          resolve(invoices || []);
        }
      });
    });
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
    // Hardcoded credentials - replace environment variable loading
    const clientId = 'ABRZKV0y73YEqiuQNZYwZm7ycQspsMJwlO8TWwD3XDj8D3zqhY';
    const clientSecret = 'MS1VHy2IWJWwYvCCoVHoHLgaCbD5ghCktrL9xcTn';
    const nextAuthUrl = 'http://localhost:3000';

    console.log('Using hardcoded credentials:', {
      clientId: clientId.substring(0, 8) + '...',
      nextAuthUrl
    });

    quickBooksService = new QuickBooksService({
      clientId,
      clientSecret,
      environment: 'sandbox',
      redirectUri: `${nextAuthUrl}/api/auth/quickbooks/callback`,
    });
  }
  return quickBooksService;
} 