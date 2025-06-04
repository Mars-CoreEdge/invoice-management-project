declare module 'node-quickbooks' {
  interface QuickBooksOptions {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    tokenSecret?: string;
    realmId: string;
    useSandbox?: boolean;
    debug?: boolean;
    minorVersion?: string;
    oauthVersion?: string;
    refreshToken?: string;
  }

  class QuickBooks {
    constructor(
      clientId: string,
      clientSecret: string,
      accessToken: string,
      tokenSecret: boolean | string,
      realmId: string,
      useSandbox?: boolean,
      debug?: boolean,
      minorVersion?: string,
      oauthVersion?: string,
      refreshToken?: string
    );

    getInvoice(id: string, callback: (err: any, invoice: any) => void): void;
    findInvoices(query: any, callback: (err: any, invoices: any[]) => void): void;
    findInvoices(callback: (err: any, invoices: any[]) => void): void;
    createInvoice(invoice: any, callback: (err: any, invoice: any) => void): void;
    updateInvoice(invoice: any, callback: (err: any, invoice: any) => void): void;
    deleteInvoice(idOrEntity: string | any, callback: (err: any) => void): void;
    sendInvoicePdf(id: string, sendTo: string, callback: (err: any) => void): void;
    getCompanyInfo(realmId: string, callback: (err: any, companyInfo: any) => void): void;
    findCustomers(callback: (err: any, customers: any[]) => void): void;
    findItems(callback: (err: any, items: any[]) => void): void;
  }

  export = QuickBooks;
}

declare module 'intuit-oauth' {
  interface OAuthClientOptions {
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'production';
    redirectUri: string;
  }

  interface AuthorizeUriOptions {
    scope: string[];
    state?: string;
  }

  interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  }

  class OAuthClient {
    static scopes: {
      Accounting: string;
      Payment: string;
      Payroll: string;
      TimeTracking: string;
      Profile: string;
    };

    constructor(options: OAuthClientOptions);
    
    authorizeUri(options: AuthorizeUriOptions): string;
    createToken(authCode: string): Promise<TokenResponse>;
    refresh(): Promise<TokenResponse>;
    revoke(): Promise<void>;
    isAccessTokenValid(): boolean;
    getToken(): TokenResponse;
  }

  export = OAuthClient;
} 