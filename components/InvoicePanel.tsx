'use client'

import { useState, useEffect } from 'react'
import { mockInvoices, getInvoiceStats, formatCurrency, type Invoice } from '../lib/mock-data'

interface InvoicePanelProps {
  selectedInvoice: Invoice | null
  onInvoiceSelect: (invoice: Invoice) => void
}

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

  // Get invoice statistics from shared function
  const stats = getInvoiceStats()

  const handleRefresh = () => {
    loadMockInvoices()
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl h-full flex flex-col border border-white/20 relative overflow-hidden max-h-[calc(100vh-8rem)]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
      
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-white/10 relative z-10 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-xs sm:text-sm">📄</span>
            </div>
            Invoices
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-white/80 hover:bg-white/20 transition-all disabled:opacity-50 flex-1 sm:flex-none"
              title="Refresh invoices"
            >
              {loading ? '⏳' : '🔄'}
            </button>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm text-white/80 flex-1 sm:flex-none text-center sm:text-left">
              {displayInvoices.length} of 4 invoices
            </div>
          </div>

        </div>
        
        {/* Search and Filter Controls */}
        <div className="space-y-3 sm:space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/60">🔍</div>
            <input
              type="text"
              placeholder="Search invoices or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm sm:text-base text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-2">
            {(['all', 'paid', 'unpaid', 'overdue'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                disabled={loading}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
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
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 relative z-10 min-h-0 scroll-smooth
                   scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-blue-500/50 
                   hover:scrollbar-thumb-blue-500/70 scrollbar-track-rounded-full scrollbar-thumb-rounded-full"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(255, 255, 255, 0.05)'
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-purple-500 border-t-transparent rounded-full mb-3 sm:mb-4"></div>
            <p className="text-white/80 text-sm sm:text-base">Loading invoices...</p>
          </div>
        ) : displayInvoices.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">📄</span>
            </div>
            <p className="text-white/80 text-base sm:text-lg">No invoices found</p>
            <p className="text-white/60 text-xs sm:text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          displayInvoices.map((invoice: Invoice) => (
            <div
              key={invoice.id}
              onClick={() => onInvoiceSelect(invoice)}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:bg-white/10 ${
                selectedInvoice?.id === invoice.id 
                  ? 'border-purple-400/50 bg-purple-500/10 shadow-lg ring-2 ring-purple-400/30' 
                  : 'border-white/20 hover:border-white/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {invoice.docNumber.split('-')[1]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                        {invoice.docNumber}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(invoice.status, invoice.balance)} shadow-sm`}>
                        {getStatusText(invoice.status, invoice.balance)}
                      </span>
                    </div>
                    <p className="text-white/80 text-xs sm:text-sm truncate">{invoice.customer}</p>
                    <p className="text-white/60 text-xs">
                      Due: {invoice.dueDate}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 w-full sm:w-auto">
                  <div className="font-bold text-white text-sm sm:text-base">
                    {formatCurrency(invoice.totalAmount)}
                  </div>
                  {invoice.balance > 0 && (
                    <div className="text-amber-400 text-xs sm:text-sm">
                      Outstanding: {formatCurrency(invoice.balance)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {!loading && filteredInvoices.length > 4 && (
          <div className="text-center pt-3 sm:pt-4">
            <p className="text-white/60 text-xs sm:text-sm">
              Showing first 4 invoices • {filteredInvoices.length - 4} more available
            </p>
          </div>
        )}
      </div>

      {/* Upcoming & Insights Footer */}
      <div className="p-4 sm:p-6 border-t border-white/10 bg-white/5 backdrop-blur-sm relative z-10 flex-shrink-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Upcoming Due Dates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
              <h3 className="text-white font-semibold text-sm">Upcoming Due Dates</h3>
            </div>
            
            <div className="space-y-2">
              {mockInvoices
                .filter(invoice => invoice.balance > 0)
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 2)
                .map((invoice) => {
                  const daysUntilDue = Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntilDue < 0;
                  const isUrgent = daysUntilDue <= 7 && daysUntilDue >= 0;
                  
                  return (
                    <div 
                      key={invoice.id} 
                      className={`p-3 rounded-lg border text-xs ${
                        isOverdue 
                          ? 'bg-red-500/10 border-red-400/30' 
                          : isUrgent 
                            ? 'bg-amber-500/10 border-amber-400/30' 
                            : 'bg-white/5 border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{invoice.docNumber}</div>
                          <div className="text-white/70 truncate">{invoice.customer}</div>
                        </div>
                        <div className="text-right ml-2">
                          <div className={`font-medium ${
                            isOverdue ? 'text-red-300' : isUrgent ? 'text-amber-300' : 'text-white'
                          }`}>
                            {formatCurrency(invoice.balance)}
                          </div>
                          <div className={`text-xs ${
                            isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white/60'
                          }`}>
                            {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <h3 className="text-white font-semibold text-sm">Quick Insights</h3>
            </div>
            
            <div className="space-y-2">
              <div className="p-3 bg-white/5 rounded-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <span className="text-white text-xs">Average Collection</span>
                  </div>
                  <span className="text-white font-medium text-xs">15 days</span>
                </div>
              </div>
              
              <div className="p-3 bg-white/5 rounded-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💰</span>
                    <span className="text-white text-xs">Collection Rate</span>
                  </div>
                  <span className="text-emerald-400 font-medium text-xs">75%</span>
                </div>
              </div>
              
              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <span className="text-purple-200 text-xs">Next Action</span>
                  </div>
                  <span className="text-purple-300 font-medium text-xs">Follow up</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
} 