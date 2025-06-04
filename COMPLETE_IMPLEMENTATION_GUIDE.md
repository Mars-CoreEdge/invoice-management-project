# Complete AI-Powered Invoice Management Tool Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Environment Setup](#environment-setup)
4. [QuickBooks Integration](#quickbooks-integration)
5. [Vercel AI SDK Implementation](#vercel-ai-sdk-implementation)
6. [UI Components](#ui-components)
7. [Data Schemas & Validation](#data-schemas--validation)
8. [Error Handling](#error-handling)
9. [Analytics & Reporting](#analytics--reporting)
10. [Security Implementation](#security-implementation)
11. [Testing Strategy](#testing-strategy)
12. [Performance Optimization](#performance-optimization)
13. [Deployment Guide](#deployment-guide)

## Overview

This document provides a complete implementation guide for building an invoice management application that integrates the Vercel AI SDK with QuickBooks Online. The application features a dual-panel interface displaying invoice data alongside an AI chat interface, allowing users to interact with their invoices through natural language.

## Architecture

The application consists of:
- **QuickBooks OAuth 2.0 Connector** - Secure authentication and API access
- **AI Tools Layer** - Built with Vercel AI SDK for natural language processing
- **React UI Layer** - Dual-panel interface with real-time updates
- **Business Logic Layer** - Invoice operations and data management
- **Security Layer** - Authentication, validation, and rate limiting

## Environment Setup

### Package Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.24",
    "openai": "^4.20.1",
    "zod": "^3.22.4",
    "node-quickbooks": "^2.0.34",
    "intuit-oauth": "^4.0.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.303.0",
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4"
  }
}
```

### Environment Variables Configuration
```javascript
// next.config.js
const nextConfig = {
  env: {
    QUICKBOOKS_CLIENT_ID: process.env.QUICKBOOKS_CLIENT_ID,
    QUICKBOOKS_CLIENT_SECRET: process.env.QUICKBOOKS_CLIENT_SECRET,
    QUICKBOOKS_SANDBOX_BASE_URL: process.env.QUICKBOOKS_SANDBOX_BASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  experimental: {
    serverComponentsExternalPackages: ['node-quickbooks', 'intuit-oauth'],
  },
}
```

### Required Environment Variables
```bash
# .env.local
QUICKBOOKS_CLIENT_ID=ABRZKV0y73YEqiuQNZYwZm7ycQspsMJwlO8TWwD3XDj8D3zqhY
QUICKBOOKS_CLIENT_SECRET=MS1VHy2IWJWwYvCCoVHoHLgaCbD5ghCktrL9xcTn
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=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
QUICKBOOKS_SANDBOX_BASE_URL=https://sandbox-quickbooks.api.intuit.com
```

## QuickBooks Integration

### OAuth 2.0 Authentication Flow

#### 1. QuickBooks App Registration
```typescript
// Steps to register QuickBooks app:
// 1. Visit https://developer.intuit.com/
// 2. Create new app for QuickBooks Online
// 3. Set redirect URI: http://localhost:3000/api/auth/quickbooks/callback
// 4. Note down Client ID and Client Secret
// 5. Enable sandbox mode for development
```

#### 2. OAuth Service Implementation
```typescript
// lib/quickbooks.ts
import QuickBooks from 'node-quickbooks';
import OAuthClient from 'intuit-oauth';

export class QuickBooksService {
  private oauthClient: OAuthClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private realmId: string | null = null;

  constructor(config: QuickBooksConfig) {
    this.oauthClient = new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
      redirectUri: config.redirectUri,
    });
  }

  // OAuth flow methods
  getAuthUri(): string {
    return this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'invoice-management-state',
    });
  }

  async createToken(authCode: string, realmId: string): Promise<void> {
    const authResponse = await this.oauthClient.createToken(authCode);
    this.accessToken = authResponse.access_token;
    this.refreshToken = authResponse.refresh_token;
    this.realmId = realmId;
    this.initializeQBO();
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    const authResponse = await this.oauthClient.refresh();
    this.accessToken = authResponse.access_token;
    this.refreshToken = authResponse.refresh_token;
    this.initializeQBO();
  }
}
```

#### 3. API Routes for OAuth
```typescript
// app/api/auth/quickbooks/route.ts
export async function GET(request: Request) {
  try {
    const qbs = getQuickBooksService();
    const authUri = qbs.getAuthUri();
    return NextResponse.redirect(authUri);
  } catch (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=oauth_failed&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
```

```typescript
// app/api/auth/quickbooks/callback/route.ts
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const realmId = url.searchParams.get('realmId');
    const state = url.searchParams.get('state');
    
    if (!code || !realmId || state !== 'invoice-management-state') {
      throw new Error('Invalid OAuth callback parameters');
    }
    
    const qbs = getQuickBooksService();
    await qbs.createToken(code, realmId);
    
    return NextResponse.redirect(new URL('/dashboard?connected=true', request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url));
  }
}
```

### Invoice CRUD Operations

#### Complete CRUD Implementation
```typescript
// Invoice Operations
async getInvoice(invoiceId: string): Promise<Invoice> {
  return new Promise((resolve, reject) => {
    this.qbo.getInvoice(invoiceId, (err: any, invoice: Invoice) => {
      if (err) reject(new Error(`Failed to get invoice: ${err.message}`));
      else resolve(invoice);
    });
  });
}

async findInvoices(criteria: InvoiceSearchCriteria = {}): Promise<Invoice[]> {
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

    this.qbo.findInvoices(query, (err: any, invoices: Invoice[]) => {
      if (err) reject(new Error(`Failed to find invoices: ${err.message}`));
      else resolve(invoices || []);
    });
  });
}

async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
  return new Promise((resolve, reject) => {
    this.qbo.createInvoice(invoiceData, (err: any, invoice: Invoice) => {
      if (err) reject(new Error(`Failed to create invoice: ${err.message}`));
      else resolve(invoice);
    });
  });
}

async updateInvoice(invoiceData: Invoice): Promise<Invoice> {
  return new Promise((resolve, reject) => {
    this.qbo.updateInvoice(invoiceData, (err: any, invoice: Invoice) => {
      if (err) reject(new Error(`Failed to update invoice: ${err.message}`));
      else resolve(invoice);
    });
  });
}

async voidInvoice(invoiceId: string): Promise<Invoice> {
  const invoice = await this.getInvoice(invoiceId);
  const voidedInvoice = { ...invoice, void: true };
  return await this.updateInvoice(voidedInvoice);
}

async deleteInvoice(invoiceId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    this.qbo.deleteInvoice(invoiceId, (err: any) => {
      if (err) reject(new Error(`Failed to delete invoice: ${err.message}`));
      else resolve();
    });
  });
}

async sendInvoicePdf(invoiceId: string, emailAddress: string): Promise<void> {
  return new Promise((resolve, reject) => {
    this.qbo.sendInvoicePdf(invoiceId, emailAddress, (err: any) => {
      if (err) reject(new Error(`Failed to send invoice PDF: ${err.message}`));
      else resolve();
    });
  });
}
``` 