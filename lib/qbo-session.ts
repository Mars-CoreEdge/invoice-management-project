import { createServerSupabaseClient } from './supabase-server';
import { TokenEncryption, getEncryptionKey } from './encryption';
import { getQuickBooksService } from './quickbooks';

export interface QBOSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: Date;
  companyInfo?: {
    CompanyName: string;
    LegalName: string;
    Id: string;
  };
}

export interface QBOOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  session?: QBOSession;
}

export class QBOSessionManager {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = getEncryptionKey();
  }

  /**
   * Get or create QBO session for a user
   */
  async getSession(userId: string): Promise<QBOSession | null> {
    try {
      const supabase = createServerSupabaseClient();

      // Fetch encrypted tokens from database
      const { data, error } = await supabase
        .from('quickbooks_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      // Decrypt tokens
      const accessToken = TokenEncryption.decrypt(data.encrypted_access_token, this.encryptionKey);
      const refreshToken = TokenEncryption.decrypt(data.encrypted_refresh_token, this.encryptionKey);

      // Check if tokens are expired (with 5-minute buffer)
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      const expiresAt = new Date(data.expires_at);
      const expiresAtWithBuffer = new Date(expiresAt.getTime() - bufferTime);

      if (now >= expiresAtWithBuffer) {
        // Tokens are expired, try to refresh
        const refreshed = await this.refreshSession(userId, refreshToken);
        if (!refreshed) {
          return null;
        }
        return refreshed;
      }

      return {
        userId,
        accessToken,
        refreshToken,
        realmId: data.realm_id,
        expiresAt: new Date(data.expires_at)
      };
    } catch (error) {
      console.error('Error getting QBO session:', error);
      return null;
    }
  }

  /**
   * Refresh QBO session tokens
   */
  private async refreshSession(userId: string, refreshToken: string): Promise<QBOSession | null> {
    try {
      const qbs = getQuickBooksService();
      
      // Set current tokens for refresh
      qbs.setTokens(refreshToken, '', userId);
      
      // Refresh tokens
      await qbs.refreshAccessToken();
      
      // Get updated session
      return await this.getSession(userId);
    } catch (error) {
      console.error('Error refreshing QBO session:', error);
      return null;
    }
  }

  /**
   * Get company information for a session
   */
  async getCompanyInfo(session: QBOSession): Promise<QBOOperationResult> {
    try {
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/companyinfo/${session.realmId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      return {
        success: true,
        data: data.CompanyInfo,
        session
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get company info: ${error.message}`
      };
    }
  }

  /**
   * Get invoices for a session
   */
  async getInvoices(session: QBOSession, limit: number = 50, offset: number = 0): Promise<QBOOperationResult> {
    try {
      const query = 'SELECT * FROM Invoice';
      const startposition = offset + 1;
      const maxresults = limit;
      const minorversion = 65;
      
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/query?query=${encodeURIComponent(query)}&startposition=${startposition}&maxresults=${maxresults}&minorversion=${minorversion}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      return {
        success: true,
        data: data.QueryResponse?.Invoice || [],
        session
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get invoices: ${error.message}`
      };
    }
  }

  /**
   * Get a single invoice by Id
   */
  async getInvoiceById(session: QBOSession, id: string): Promise<QBOOperationResult> {
    try {
      const query = `SELECT * FROM Invoice WHERE Id = '${id.replace(/'/g, "''")}'`;
      const minorversion = 65;
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/query?query=${encodeURIComponent(query)}&minorversion=${minorversion}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      const invoice = (data.QueryResponse?.Invoice || [])[0] || null;
      return { success: true, data: invoice, session };
    } catch (error: any) {
      return { success: false, error: `Failed to get invoice: ${error.message}` };
    }
  }

  /**
   * Get a single invoice by DocNumber
   */
  async getInvoiceByDocNumber(session: QBOSession, docNumber: string): Promise<QBOOperationResult> {
    try {
      const query = `SELECT * FROM Invoice WHERE DocNumber = '${docNumber.replace(/'/g, "''")}'`;
      const minorversion = 65;
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/query?query=${encodeURIComponent(query)}&minorversion=${minorversion}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      const invoice = (data.QueryResponse?.Invoice || [])[0] || null;
      return { success: true, data: invoice, session };
    } catch (error: any) {
      return { success: false, error: `Failed to get invoice: ${error.message}` };
    }
  }

  /**
   * Get customers for a session
   */
  async getCustomers(session: QBOSession, limit: number = 50, offset: number = 0): Promise<QBOOperationResult> {
    try {
      const query = 'SELECT * FROM Customer';
      const startposition = offset + 1;
      const maxresults = limit;
      const minorversion = 65;
      
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/query?query=${encodeURIComponent(query)}&startposition=${startposition}&maxresults=${maxresults}&minorversion=${minorversion}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      return {
        success: true,
        data: data.QueryResponse?.Customer || [],
        session
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get customers: ${error.message}`
      };
    }
  }

  /**
   * Get items for a session
   */
  async getItems(session: QBOSession, limit: number = 50, offset: number = 0): Promise<QBOOperationResult> {
    try {
      const query = 'SELECT * FROM Item';
      const startposition = offset + 1;
      const maxresults = limit;
      const minorversion = 65;
      
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/query?query=${encodeURIComponent(query)}&startposition=${startposition}&maxresults=${maxresults}&minorversion=${minorversion}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      return {
        success: true,
        data: data.QueryResponse?.Item || [],
        session
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get items: ${error.message}`
      };
    }
  }

  /**
   * Get a default income account to attach to created items
   */
  async getDefaultIncomeAccount(session: QBOSession): Promise<QBOOperationResult> {
    try {
      const query = `SELECT Id, Name, AccountType FROM Account WHERE AccountType = 'Income'`;
      const minorversion = 65;
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/query?query=${encodeURIComponent(query)}&minorversion=${minorversion}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.Fault) {
        return { success: false, error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}` };
      }
      const acct = (data.QueryResponse?.Account || [])[0] || null;
      return { success: true, data: acct, session };
    } catch (error: any) {
      return { success: false, error: `Failed to get income account: ${error.message}` };
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(session: QBOSession, payload: any): Promise<QBOOperationResult> {
    try {
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/customer?minorversion=65`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.Fault) {
        return { success: false, error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}` };
      }
      return { success: true, data: data.Customer, session };
    } catch (error: any) {
      return { success: false, error: `Failed to create customer: ${error.message}` };
    }
  }

  /**
   * Create an item (Service)
   */
  async createItem(session: QBOSession, payload: any): Promise<QBOOperationResult> {
    try {
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/item?minorversion=65`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.Fault) {
        return { success: false, error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}` };
      }
      return { success: true, data: data.Item, session };
    } catch (error: any) {
      return { success: false, error: `Failed to create item: ${error.message}` };
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(session: QBOSession, invoiceData: any): Promise<QBOOperationResult> {
    try {
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/invoice?minorversion=65`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      return {
        success: true,
        data: data.Invoice,
        session
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create invoice: ${error.message}`
      };
    }
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(session: QBOSession, invoiceId: string, invoiceData: any): Promise<QBOOperationResult> {
    try {
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/invoice?minorversion=65`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...invoiceData,
          Id: invoiceId
        })
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      return {
        success: true,
        data: data.Invoice,
        session
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to update invoice: ${error.message}`
      };
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(session: QBOSession, invoiceId: string): Promise<QBOOperationResult> {
    try {
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/invoice?operation=delete&minorversion=65`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Id: invoiceId,
          sparse: true
        })
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      return {
        success: true,
        data: data.Invoice,
        session
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to delete invoice: ${error.message}`
      };
    }
  }

  /**
   * Send invoice PDF via email
   */
  async sendInvoicePDF(session: QBOSession, invoiceId: string, emailAddress: string): Promise<QBOOperationResult> {
    try {
      const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${session.realmId}/invoice/${invoiceId}/send?minorversion=65`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          EmailAddress: emailAddress
        })
      });

      const data = await response.json();

      if (data.Fault) {
        return {
          success: false,
          error: `QuickBooks API Error: ${JSON.stringify(data.Fault)}`
        };
      }

      return {
        success: true,
        data: data,
        session
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to send invoice PDF: ${error.message}`
      };
    }
  }
}

// Singleton instance
let qboSessionManager: QBOSessionManager | null = null;

export function getQBOSessionManager(): QBOSessionManager {
  if (!qboSessionManager) {
    qboSessionManager = new QBOSessionManager();
  }
  return qboSessionManager;
} 