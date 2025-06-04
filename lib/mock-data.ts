export interface Invoice {
  id: string
  docNumber: string
  txnDate: string
  dueDate: string
  totalAmount: number
  balance: number
  customer: string
  status: 'paid' | 'unpaid' | 'overdue'
  customerId?: string
  emailStatus?: string
  printStatus?: string
  syncToken?: string
  lineItems?: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
    accountId?: string
    accountName?: string
  }>
}

// Hardcoded mock invoices for demonstration
export const mockInvoices: Invoice[] = [
  {
    id: '1',
    docNumber: 'INV-1001',
    txnDate: '2024-01-15',
    dueDate: '2024-02-14',
    totalAmount: 2500.00,
    balance: 0,
    customer: 'Acme Corporation',
    status: 'paid'
  },
  {
    id: '2',
    docNumber: 'INV-1002',
    txnDate: '2024-01-20',
    dueDate: '2024-02-19',
    totalAmount: 1800.50,
    balance: 1800.50,
    customer: 'TechStart Inc.',
    status: 'unpaid'
  },
  {
    id: '3',
    docNumber: 'INV-1003',
    txnDate: '2024-01-10',
    dueDate: '2024-02-09',
    totalAmount: 3200.75,
    balance: 3200.75,
    customer: 'Global Dynamics',
    status: 'overdue'
  },
  {
    id: '4',
    docNumber: 'INV-1004',
    txnDate: '2024-01-25',
    dueDate: '2024-02-24',
    totalAmount: 950.00,
    balance: 0,
    customer: 'Sunrise Solutions',
    status: 'paid'
  }
]

// Calculate invoice statistics
export const getInvoiceStats = () => {
  const totalRevenue = mockInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const paidCount = mockInvoices.filter(invoice => invoice.balance === 0).length
  const unpaidCount = mockInvoices.filter(invoice => invoice.balance > 0 && invoice.status !== 'overdue').length
  const overdueCount = mockInvoices.filter(invoice => invoice.status === 'overdue').length
  const totalInvoices = mockInvoices.length

  return {
    totalRevenue,
    totalInvoices,
    paidCount,
    unpaidCount,
    overdueCount
  }
}

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
} 