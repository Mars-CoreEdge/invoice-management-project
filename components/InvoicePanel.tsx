'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  docNumber: string
  txnDate: string
  dueDate: string
  totalAmount: number
  balance: number
  customer: string
  status: 'paid' | 'unpaid' | 'overdue'
}

interface InvoicePanelProps {
  selectedInvoice: Invoice | null
  onInvoiceSelect: (invoice: Invoice) => void
}

// Hardcoded mock invoices for demonstration
const mockInvoices: Invoice[] = [
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

export function InvoicePanel({ selectedInvoice, onInvoiceSelect }: InvoicePanelProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all')

  // Simulate loading and set mock data
  const loadMockInvoices = () => {
    setLoading(true)
    // Simulate API delay
    setTimeout(() => {
      console.log('✅ Loaded mock invoices:', mockInvoices.length)
      setInvoices(mockInvoices)
      setLoading(false)
    }, 800)
  }

  // Load mock invoices on component mount
  useEffect(() => {
    loadMockInvoices()
  }, [])

  const getStatusColor = (status: string, balance: number) => {
    if (balance === 0) return 'bg-gradient-to-r from-emerald-500 to-green-500'
    if (status === 'overdue') return 'bg-gradient-to-r from-red-500 to-pink-500'
    return 'bg-gradient-to-r from-amber-500 to-orange-500'
  }

  const getStatusText = (status: string, balance: number) => {
    if (balance === 0) return 'Paid'
    if (status === 'overdue') return 'Overdue'
    return 'Pending'
  }

  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const matchesSearch = invoice.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'paid' && invoice.balance === 0) ||
                         (filterStatus === 'unpaid' && invoice.balance > 0 && invoice.status !== 'overdue') ||
                         (filterStatus === 'overdue' && invoice.status === 'overdue')
    return matchesSearch && matchesFilter
  })

  // Limit to 4 invoices for display
  const displayInvoices = filteredInvoices.slice(0, 4)

  // Calculate summary statistics from all 4 mock invoices (not filtered)
  const totalAmount = mockInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const paidCount = mockInvoices.filter(invoice => invoice.balance === 0).length
  const unpaidCount = mockInvoices.filter(invoice => invoice.balance > 0).length

  const handleRefresh = () => {
    loadMockInvoices()
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl h-full flex flex-col border border-white/20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
      
      {/* Header */}
      <div className="p-6 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-sm">📄</span>
            </div>
            Invoices
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/20 transition-all disabled:opacity-50"
              title="Refresh invoices"
            >
              {loading ? '⏳' : '🔄'}
            </button>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/80">
              {displayInvoices.length} of 4 invoices
            </div>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">🔍</div>
            <input
              type="text"
              placeholder="Search invoices or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'paid', 'unpaid', 'overdue'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                  filterStatus === status 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Invoice List */}
      <div className="flex-1 overflow-auto p-6 space-y-4 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-white/80">Loading invoices...</p>
          </div>
        ) : displayInvoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-white/80 text-lg">No invoices found</p>
            <p className="text-white/60 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          displayInvoices.map((invoice: Invoice) => (
            <div
              key={invoice.id}
              onClick={() => onInvoiceSelect(invoice)}
              className={`group cursor-pointer bg-white/5 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:bg-white/10 hover:shadow-xl hover:scale-[1.02] ${
                selectedInvoice?.id === invoice.id 
                  ? 'border-purple-500/50 bg-purple-500/10 shadow-lg' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">{invoice.docNumber.slice(-2)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{invoice.docNumber}</h3>
                    <p className="text-white/70 flex items-center gap-2">
                      👤 {invoice.customer}
                    </p>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(invoice.status, invoice.balance)}`}>
                  {getStatusText(invoice.status, invoice.balance)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-green-400">💰</span>
                  <span className="font-semibold text-green-400">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-blue-400">📅</span>
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
                
                {invoice.balance > 0 && (
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="text-amber-400">⚠️</span>
                    <span className="text-amber-400">Due: {formatCurrency(invoice.balance)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-purple-400">🕒</span>
                  <span>{formatDate(invoice.txnDate)}</span>
                </div>
              </div>
              
              {/* Hover Effect Indicator */}
              <div className="mt-4 text-purple-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Click to select and view details →
              </div>
            </div>
          ))
        )}

        {filteredInvoices.length > 4 && (
          <div className="text-center py-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80">
                📋 Showing 4 of {filteredInvoices.length} invoices
              </p>
              <p className="text-white/60 text-sm mt-2">
                Use search or filters to find specific invoices
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Selected Invoice Details */}
      {selectedInvoice && (
        <div className="border-t border-white/10 p-6 bg-white/5 backdrop-blur-sm relative z-10">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            📄 Invoice Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/60">Customer:</span>
              <p className="text-white font-medium">{selectedInvoice.customer}</p>
            </div>
            <div>
              <span className="text-white/60">Amount:</span>
              <p className="text-white font-medium">{formatCurrency(selectedInvoice.totalAmount)}</p>
            </div>
            <div>
              <span className="text-white/60">Issue Date:</span>
              <p className="text-white font-medium">{formatDate(selectedInvoice.txnDate)}</p>
            </div>
            <div>
              <span className="text-white/60">Due Date:</span>
              <p className="text-white font-medium">{formatDate(selectedInvoice.dueDate)}</p>
            </div>
            {selectedInvoice.balance > 0 && (
              <div className="col-span-2">
                <span className="text-white/60">Outstanding Balance:</span>
                <p className="text-amber-400 font-medium">{formatCurrency(selectedInvoice.balance)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 