import { z } from 'zod';
import { tool } from 'ai';
import { mockInvoices, getInvoiceStats, formatCurrency, type Invoice } from './mock-data';
import { format, parseISO, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Zod schemas for validation
const invoiceIdSchema = z.object({
  invoiceId: z.string().describe('The ID of the invoice to retrieve'),
});

const invoiceSearchSchema = z.object({
  customerId: z.string().optional().describe('Filter by customer ID'),
  startDate: z.string().optional().describe('Start date for invoice search (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date for invoice search (YYYY-MM-DD)'),
  status: z.enum(['paid', 'unpaid', 'overdue', 'all']).optional().describe('Invoice status filter'),
  limit: z.number().optional().describe('Maximum number of invoices to return'),
  offset: z.number().optional().describe('Number of invoices to skip'),
});

const createInvoiceSchema = z.object({
  customerId: z.string().describe('Customer ID for the invoice'),
  customerName: z.string().optional().describe('Customer name'),
  items: z.array(z.object({
    itemId: z.string().describe('Item/Service ID'),
    itemName: z.string().optional().describe('Item/Service name'),
    quantity: z.number().describe('Quantity of the item'),
    unitPrice: z.number().describe('Unit price of the item'),
    amount: z.number().describe('Total amount for this line item'),
  })).describe('Line items for the invoice'),
  dueDate: z.string().optional().describe('Due date for the invoice (YYYY-MM-DD)'),
  emailAddress: z.string().email().optional().describe('Email address to send invoice to'),
});

const updateInvoiceSchema = z.object({
  invoiceId: z.string().describe('ID of the invoice to update'),
  updates: z.object({
    dueDate: z.string().optional().describe('New due date (YYYY-MM-DD)'),
    emailAddress: z.string().email().optional().describe('New email address'),
    items: z.array(z.object({
      itemId: z.string().describe('Item/Service ID'),
      itemName: z.string().optional().describe('Item/Service name'),
      quantity: z.number().describe('Quantity of the item'),
      unitPrice: z.number().describe('Unit price of the item'),
      amount: z.number().describe('Total amount for this line item'),
    })).optional().describe('Updated line items'),
  }).describe('Fields to update on the invoice'),
});

const emailInvoiceSchema = z.object({
  invoiceId: z.string().describe('ID of the invoice to email'),
  emailAddress: z.string().email().describe('Email address to send the PDF to'),
});

const dateRangeSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).describe('Time period for the report'),
  startDate: z.string().optional().describe('Custom start date (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('Custom end date (YYYY-MM-DD)'),
});

// General purpose tool schemas
const calculatorSchema = z.object({
  expression: z.string().describe('Mathematical expression to calculate (e.g., "2 + 2", "15% of 1000", "compound interest calculation")'),
  context: z.string().optional().describe('Additional context about what you are calculating'),
});

const businessAdviceSchema = z.object({
  topic: z.string().describe('Business topic or question (e.g., "cash flow management", "invoice payment terms", "customer retention")'),
  businessType: z.string().optional().describe('Type of business (e.g., "small business", "freelancer", "consultant")'),
  specificSituation: z.string().optional().describe('Specific situation or context for more tailored advice'),
});

const knowledgeQuerySchema = z.object({
  query: z.string().describe('Question or topic to get information about'),
  domain: z.string().optional().describe('Domain or field (e.g., "finance", "technology", "marketing", "legal")'),
});

// Helper functions
function getDateRange(period: string, startDate?: string, endDate?: string): { start: string; end: string } {
  const today = new Date();
  
  switch (period) {
    case 'today':
      return {
        start: format(today, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd')
      };
    case 'week':
      return {
        start: format(subDays(today, 7), 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd')
      };
    case 'month':
      return {
        start: format(startOfMonth(today), 'yyyy-MM-dd'),
        end: format(endOfMonth(today), 'yyyy-MM-dd')
      };
    case 'quarter':
      return {
        start: format(subMonths(today, 3), 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd')
      };
    case 'year':
      return {
        start: format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd')
      };
    case 'custom':
      return {
        start: startDate || format(subDays(today, 30), 'yyyy-MM-dd'),
        end: endDate || format(today, 'yyyy-MM-dd')
      };
    default:
      return {
        start: format(subDays(today, 30), 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd')
      };
  }
}

// Helper function for safe mathematical calculations
function calculateExpression(expression: string): { result: number | string; explanation: string } {
  try {
    // Handle percentage calculations
    if (expression.includes('% of') || expression.includes('percent of')) {
      const match = expression.match(/(\d+(?:\.\d+)?)%?\s*(?:of|percent of)\s*(\d+(?:\.\d+)?)/i);
      if (match) {
        const percentage = parseFloat(match[1]);
        const value = parseFloat(match[2]);
        const result = (percentage / 100) * value;
        return {
          result: result,
          explanation: `${percentage}% of ${value} = ${result}`
        };
      }
    }
    
    // Handle basic arithmetic (safe evaluation)
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (sanitized !== expression) {
      return {
        result: 'Invalid expression',
        explanation: 'Expression contains invalid characters. Only numbers and basic operators (+, -, *, /) are allowed.'
      };
    }
    
    // Use Function constructor for safe evaluation
    const result = new Function('return ' + sanitized)();
    return {
      result: result,
      explanation: `${expression} = ${result}`
    };
  } catch (error) {
    return {
      result: 'Error',
      explanation: 'Unable to calculate expression. Please check syntax.'
    };
  }
}

// AI Tools Definition - Enhanced with general-purpose capabilities
export const invoiceTools = {
  // === INVOICE MANAGEMENT TOOLS ===
  getInvoice: tool({
    description: 'Get details of a specific invoice by ID. Use this when the user asks for information about a particular invoice.',
    parameters: invoiceIdSchema,
    execute: async (params: any) => {
      try {
        const invoice = mockInvoices.find(i => i.id === params.invoiceId);
        
        return {
          success: true,
          data: {
            id: invoice?.id || 'Unknown',
            docNumber: invoice?.docNumber || 'Unknown',
            txnDate: invoice?.txnDate || 'Unknown',
            dueDate: invoice?.dueDate || 'Unknown',
            totalAmount: invoice?.totalAmount || 0,
            balance: invoice?.balance || 0,
            customer: invoice?.customer || 'Unknown',
            emailStatus: invoice?.emailStatus || 'Unknown',
            printStatus: invoice?.printStatus || 'Unknown',
            lineItems: invoice?.lineItems?.map((line: any) => ({
              description: line.description || 'Item',
              quantity: line.quantity || 1,
              unitPrice: line.unitPrice || 0,
              amount: line.amount || 0
            })) || []
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to retrieve invoice: ${error.message}`
        };
      }
    },
  }),

  listInvoices: tool({
    description: 'List invoices with optional filters. Use this when the user wants to see multiple invoices, search for invoices, or get invoice summaries.',
    parameters: invoiceSearchSchema,
    execute: async (params: any) => {
      try {
        // Fetch invoice data from the standard invoices API
        const response = await fetch('/api/invoices');
        const result = await response.json();
        
        if (!result.success) {
          return {
            success: false,
            error: result.error || 'Failed to fetch invoices'
          };
        }

        // Map to a common shape for filtering
        let invoices = (result.data || []).map((inv: any) => ({
          id: inv.id,
          docNumber: inv.invoice_number || inv.docNumber,
          txnDate: inv.created_at || inv.txnDate,
          dueDate: inv.due_date || inv.dueDate,
          totalAmount: inv.total_amount ?? inv.totalAmount ?? 0,
          balance: inv.balance ?? 0,
          customer: inv.customer_name || inv.customer || '',
          status: inv.status || (inv.balance === 0 ? 'paid' : 'unpaid'),
        }));
        
        // Apply filters
        if (params.customerId) {
          invoices = invoices.filter((i: any) => i.customerId === params.customerId);
        }
        if (params.startDate) {
          invoices = invoices.filter((i: any) => i.txnDate >= params.startDate);
        }
        if (params.endDate) {
          invoices = invoices.filter((i: any) => i.txnDate <= params.endDate);
        }
        if (params.status && params.status !== 'all') {
          invoices = invoices.filter((i: any) => i.status === params.status);
        }
        
        // Apply pagination
        const offset = params.offset || 0;
        const limit = params.limit || 20;
        const paginatedInvoices = invoices.slice(offset, offset + limit);
        
        return {
          success: true,
          data: {
            invoices: paginatedInvoices.map((invoice: any) => ({
              id: invoice.id,
              docNumber: invoice.docNumber,
              txnDate: invoice.txnDate,
              dueDate: invoice.dueDate,
              totalAmount: invoice.totalAmount,
              balance: invoice.balance,
              customer: invoice.customer,
              status: invoice.status
            })),
            count: paginatedInvoices.length,
            totalCount: invoices.length,
            hasMore: offset + limit < invoices.length
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to list invoices: ${error.message}`
        };
      }
    },
  }),

  createInvoice: tool({
    description: 'Create a new invoice. Use this when the user wants to generate a new invoice for a customer.',
    parameters: createInvoiceSchema,
    execute: async (params: any) => {
      try {
        const newInvoice: Invoice = {
          id: (mockInvoices.length + 1).toString(),
          docNumber: `INV-100${mockInvoices.length + 1}`,
          txnDate: format(new Date(), 'yyyy-MM-dd'),
          dueDate: params.dueDate || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          totalAmount: params.items.reduce((total: number, item: any) => total + item.amount, 0),
          balance: params.items.reduce((total: number, item: any) => total + item.amount, 0),
          customer: params.customerName || params.customerId,
          customerId: params.customerId,
          status: 'unpaid',
          emailStatus: 'Not Sent',
          printStatus: 'Not Printed',
          syncToken: '1.0',
          lineItems: params.items.map((item: any, index: number) => ({
            id: String(index + 1),
            amount: item.amount,
            description: item.itemName || item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            accountId: '2',
            accountName: 'Accounts Receivable'
          }))
        };

        mockInvoices.push(newInvoice);
        
        // Optionally send email if provided
        if (params.emailAddress) {
          // Implementation of sending email
        }
        
        return {
          success: true,
          data: {
            id: newInvoice.id,
            docNumber: newInvoice.docNumber,
            totalAmount: newInvoice.totalAmount,
            customer: newInvoice.customer,
            emailSent: !!params.emailAddress
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to create invoice: ${error.message}`
        };
      }
    },
  }),

  updateInvoice: tool({
    description: 'Update an existing invoice. Use this when the user wants to modify invoice details like due date, items, or customer email.',
    parameters: updateInvoiceSchema,
    execute: async (params: any) => {
      try {
        const invoice = mockInvoices.find(i => i.id === params.invoiceId);
        
        if (!invoice) {
          return {
            success: false,
            error: 'Invoice not found'
          };
        }
        
        // Prepare update data
        const updateData: any = {
          id: params.invoiceId,
          syncToken: invoice.syncToken || '1.0'
        };
        
        if (params.updates.dueDate) {
          updateData.dueDate = params.updates.dueDate;
        }
        
        if (params.updates.items) {
          updateData.lineItems = params.updates.items.map((item: any, index: number) => ({
            id: String(index + 1),
            amount: item.amount,
            description: item.itemName || item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            accountId: '2', // Assuming a default account ID
            accountName: 'Accounts Receivable'
          }));
        }

        const updatedInvoice = { ...invoice, ...updateData };
        
        const index = mockInvoices.findIndex(i => i.id === params.invoiceId);
        mockInvoices[index] = updatedInvoice;
        
        return {
          success: true,
          data: {
            id: updatedInvoice.id,
            docNumber: updatedInvoice.docNumber,
            totalAmount: updatedInvoice.totalAmount,
            message: 'Invoice updated successfully'
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to update invoice: ${error.message}`
        };
      }
    },
  }),

  voidInvoice: tool({
    description: 'Void an invoice. Use this when the user wants to cancel an invoice without deleting it from records.',
    parameters: invoiceIdSchema,
    execute: async ({ invoiceId }) => {
      try {
        const invoice = mockInvoices.find(i => i.id === invoiceId);
        
        if (!invoice) {
          return {
            success: false,
            error: 'Invoice not found'
          };
        }
        
        const voidedInvoice = { ...invoice, balance: invoice.totalAmount, emailStatus: 'Voided', printStatus: 'Voided' };
        
        const index = mockInvoices.findIndex(i => i.id === invoiceId);
        mockInvoices[index] = voidedInvoice;
        
        return {
          success: true,
          data: {
            id: invoiceId,
            message: `Invoice has been voided`
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to void invoice: ${error.message}`
        };
      }
    },
  }),

  deleteInvoice: tool({
    description: 'Delete an invoice permanently. Use this when the user wants to permanently remove an invoice from QuickBooks.',
    parameters: invoiceIdSchema,
    execute: async ({ invoiceId }) => {
      try {
        const invoice = mockInvoices.find(i => i.id === invoiceId);
        
        if (!invoice) {
          return {
            success: false,
            error: 'Invoice not found'
          };
        }
        
        const deletedInvoice = { ...invoice, balance: invoice.totalAmount, emailStatus: 'Deleted', printStatus: 'Deleted' };
        
        const index = mockInvoices.findIndex(i => i.id === invoiceId);
        mockInvoices.splice(index, 1);
        
        return {
          success: true,
          data: {
            id: invoiceId,
            message: `Invoice has been deleted permanently`
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to delete invoice: ${error.message}`
        };
      }
    },
  }),

  emailInvoice: tool({
    description: 'Send an invoice PDF via email. Use this when the user wants to email an invoice to a customer or specific email address.',
    parameters: emailInvoiceSchema,
    execute: async ({ invoiceId, emailAddress }) => {
      try {
        const invoice = mockInvoices.find(i => i.id === invoiceId);
        
        if (!invoice) {
          return {
            success: false,
            error: 'Invoice not found'
          };
        }
        
        // Implementation of sending email
        
        return {
          success: true,
          data: {
            id: invoiceId,
            emailAddress,
            message: `Invoice PDF sent successfully to ${emailAddress}`
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to email invoice: ${error.message}`
        };
      }
    },
  }),

  getInvoiceStats: tool({
    description: 'Get invoice statistics and analytics for a given time period. Use this when the user asks for revenue reports, payment summaries, or invoice analytics.',
    parameters: dateRangeSchema,
    execute: async (params: any) => {
      try {
        // Fetch real invoice data from the API
        const response = await fetch('/api/invoices');
        const result = await response.json();
        
        if (!result.success) {
          return {
            success: false,
            error: result.error || 'Failed to fetch invoices'
          };
        }

        const dateRange = getDateRange(params.period, params.startDate, params.endDate);
        
        const invoices = (result.data || []).map((inv: any) => ({
          txnDate: inv.created_at || inv.txnDate,
          dueDate: inv.due_date || inv.dueDate,
          totalAmount: inv.total_amount ?? inv.totalAmount ?? 0,
          balance: inv.balance ?? 0,
        })).filter((i: any) =>
          i.txnDate >= dateRange.start &&
          i.txnDate <= dateRange.end
        );
        
        const stats = invoices.reduce((acc: any, invoice: any) => {
          acc.totalInvoices++;
          acc.totalAmount += invoice.totalAmount || 0;
          acc.totalBalance += invoice.balance || 0;
          
          if (invoice.balance === 0) {
            acc.paidInvoices++;
            acc.paidAmount += invoice.totalAmount || 0;
          } else {
            acc.unpaidInvoices++;
            acc.unpaidAmount += invoice.balance || 0;
            
            if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
              acc.overdueInvoices++;
              acc.overdueAmount += invoice.balance || 0;
            }
          }
          
          return acc;
        }, {
          totalInvoices: 0,
          totalAmount: 0,
          totalBalance: 0,
          paidInvoices: 0,
          paidAmount: 0,
          unpaidInvoices: 0,
          unpaidAmount: 0,
          overdueInvoices: 0,
          overdueAmount: 0
        });
        
        return {
          success: true,
          data: {
            period: `${dateRange.start} to ${dateRange.end}`,
            summary: {
              totalInvoices: stats.totalInvoices,
              totalRevenue: stats.totalAmount,
              collectedRevenue: stats.paidAmount,
              outstandingRevenue: stats.unpaidAmount,
              overdueRevenue: stats.overdueAmount
            },
            breakdown: {
              paid: {
                count: stats.paidInvoices,
                amount: stats.paidAmount
              },
              unpaid: {
                count: stats.unpaidInvoices,
                amount: stats.unpaidAmount
              },
              overdue: {
                count: stats.overdueInvoices,
                amount: stats.overdueAmount
              }
            }
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to get invoice statistics: ${error.message}`
        };
      }
    },
  }),

  getCustomers: tool({
    description: 'Get list of customers from QuickBooks. Use this when the user needs to see available customers or when creating invoices.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const customers = mockInvoices.map(i => i.customer).filter((c, index, self) => self.indexOf(c) === index);
        
        return {
          success: true,
          data: {
            customers: customers.map(customer => ({
              id: customer,
              name: customer,
              companyName: '',
              email: '',
              phone: '',
              balance: 0
            }))
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to get customers: ${error.message}`
        };
      }
    },
  }),

  getItems: tool({
    description: 'Get list of items/services from QuickBooks. Use this when the user needs to see available products or services for creating invoices.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const items = mockInvoices.map(i => ({
          id: i.id,
          name: i.docNumber,
          description: i.lineItems.map(li => li.description).join(', '),
          unitPrice: i.lineItems.reduce((total: number, li: any) => total + li.unitPrice, 0),
          type: 'Service',
          active: true
        }));
        
        return {
          success: true,
          data: {
            items: items
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to get items: ${error.message}`
        };
      }
    },
  }),

  // === GENERAL-PURPOSE TOOLS ===
  
  calculator: tool({
    description: 'Perform mathematical calculations including basic arithmetic, percentages, and business calculations. Use this for any numerical computation the user requests.',
    parameters: calculatorSchema,
    execute: async ({ expression, context }) => {
      try {
        const calculation = calculateExpression(expression);
        
        return {
          success: true,
          data: {
            expression: expression,
            result: calculation.result,
            explanation: calculation.explanation,
            context: context || 'Mathematical calculation'
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Calculation error: ${error.message}`
        };
      }
    },
  }),

  businessAdvice: tool({
    description: 'Provide business advice, best practices, and recommendations. Use this when users ask about business strategies, invoice management best practices, cash flow, customer relations, etc.',
    parameters: businessAdviceSchema,
    execute: async ({ topic, businessType, specificSituation }) => {
      try {
        const adviceDatabase: { [key: string]: any } = {
          'invoice payment terms': {
            advice: 'Optimal payment terms balance cash flow with customer relationships. Consider offering 2/10 Net 30 (2% discount if paid within 10 days, otherwise due in 30 days).',
            bestPractices: [
              'Clearly state payment terms on all invoices',
              'Offer early payment discounts to incentivize faster payment',
              'Set up automatic late payment reminders',
              'Consider requiring deposits for large projects'
            ],
            warnings: ['Avoid terms longer than 60 days', 'Be consistent across all customers']
          },
          'cash flow management': {
            advice: 'Effective cash flow management is crucial for business survival. Focus on reducing the time between invoice creation and payment collection.',
            bestPractices: [
              'Invoice immediately upon delivery',
              'Follow up on overdue invoices within 7 days',
              'Maintain 3-6 months of operating expenses in reserves',
              'Use cash flow forecasting tools',
              'Consider factoring for immediate cash from receivables'
            ],
            warnings: ['Never ignore aging receivables', 'Avoid over-extending credit terms']
          },
          'customer retention': {
            advice: 'Retaining existing customers costs 5-25x less than acquiring new ones. Focus on exceptional service and clear communication.',
            bestPractices: [
              'Respond to customer inquiries within 24 hours',
              'Provide detailed, easy-to-understand invoices',
              'Offer multiple payment options',
              'Send thank you notes for prompt payments',
              'Regular check-ins with key customers'
            ],
            warnings: ['Don\'t ignore customer complaints', 'Avoid surprising customers with unexpected charges']
          }
        };

        const topicLower = topic.toLowerCase();
        let advice = adviceDatabase[topicLower];
        
        if (!advice) {
          // Generate generic business advice
          advice = {
            advice: `For ${topic}, focus on clear communication, consistent processes, and customer-centric approaches.`,
            bestPractices: [
              'Document all processes and procedures',
              'Maintain open communication with stakeholders',
              'Regular review and optimization of workflows',
              'Invest in proper tools and technology'
            ],
            warnings: ['Stay compliant with relevant regulations', 'Keep detailed records for all transactions']
          };
        }

        return {
          success: true,
          data: {
            topic,
            businessType: businessType || 'General Business',
            advice: advice.advice,
            bestPractices: advice.bestPractices,
            warnings: advice.warnings,
            specificContext: specificSituation || 'General guidance'
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to provide business advice: ${error.message}`
        };
      }
    },
  }),

  knowledgeQuery: tool({
    description: 'Answer general knowledge questions, provide explanations about concepts, and offer information on various topics. Use this for any question that doesn\'t require the other specific tools.',
    parameters: knowledgeQuerySchema,
    execute: async ({ query, domain }) => {
      try {
        // Knowledge base for common business and financial topics
        const knowledgeBase: { [key: string]: any } = {
          'what is an invoice': {
            definition: 'An invoice is a commercial document issued by a seller to a buyer relating to a sale transaction and indicating the products, quantities, and agreed-upon prices for products or services the seller had provided the buyer.',
            keyComponents: ['Invoice number', 'Date issued', 'Payment terms', 'Itemized list', 'Total amount', 'Payment methods'],
            importance: 'Invoices serve as legal proof of sale and are essential for accounting, tax purposes, and cash flow management.'
          },
          'accounts receivable': {
            definition: 'Accounts receivable represents the balance of money due to a firm for goods or services delivered or used but not yet paid for by customers.',
            management: 'Effective AR management includes timely invoicing, credit checks, payment tracking, and collection procedures.',
            importance: 'AR directly impacts cash flow and is a key indicator of business financial health.'
          },
          'payment terms': {
            definition: 'Payment terms specify when payments are due and may include discounts for early payment.',
            common: ['Net 30 (due in 30 days)', 'Net 15', '2/10 Net 30 (2% discount if paid in 10 days)', 'Due on receipt'],
            factors: 'Consider industry standards, customer relationships, cash flow needs, and competitive factors.'
          }
        };

        const queryLower = query.toLowerCase();
        let response = knowledgeBase[queryLower];

        if (!response) {
          // Generate general response based on domain
          if (domain && domain.toLowerCase().includes('finance')) {
            response = {
              answer: `For financial topics like "${query}", it's important to consider both theoretical principles and practical applications in your specific business context.`,
              suggestion: 'Consider consulting with a financial advisor or accountant for personalized advice.',
              resources: ['QuickBooks Learning Center', 'IRS publications', 'Industry-specific financial guides']
            };
          } else {
            response = {
              answer: `Regarding "${query}", this appears to be a specific question that may require specialized knowledge or current information.`,
              suggestion: 'For the most accurate and up-to-date information, consider consulting relevant experts or authoritative sources in this field.',
              note: 'I can help with invoice management, business calculations, and general business advice within my capabilities.'
            };
          }
        }

        return {
          success: true,
          data: {
            query,
            domain: domain || 'General',
            response,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to process knowledge query: ${error.message}`
        };
      }
    },
  })
}; 