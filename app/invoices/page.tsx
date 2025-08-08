'use client'

import { useState, useEffect } from 'react'
import { useTeam } from '@/components/TeamContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import * as Icons from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  total_amount: number
  balance: number
  status: string
  due_date: string
  created_at: string
  updated_at: string
}

export default function InvoicesPage() {
  const team: any = useTeam() as any
  const currentTeam = team?.currentTeam
  const canEditInvoices = team?.canEditInvoices
  const canDeleteInvoices = team?.canDeleteInvoices
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchInvoices()
  }, [currentTeam])

  const fetchInvoices = async () => {
    if (!currentTeam) return

    try {
      const response = await fetch(`/api/invoices?teamId=${currentTeam.team_id}`)
      const result = await response.json()
      
      if (result.success) {
        setInvoices(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  // removed duplicate handleDelete

  const filteredInvoices = invoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof Invoice]
      let bValue = b[sortBy as keyof Invoice]
      
      if (sortBy === 'total_amount' || sortBy === 'balance') {
        aValue = Number(aValue)
        bValue = Number(bValue)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-600/30 text-green-200'
      case 'overdue':
        return 'bg-red-600/30 text-red-200'
      case 'pending':
        return 'bg-yellow-600/30 text-yellow-200'
      case 'draft':
        return 'bg-gray-600/30 text-gray-200'
      default:
        return 'bg-gray-600/30 text-gray-200'
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentTeam) return
    if (!confirm('Delete this invoice?')) return
    try {
      await fetch(`/api/invoices?teamId=${currentTeam.team_id}&id=${id}`, { method: 'DELETE' })
      setInvoices(prev => prev.filter(inv => inv.id !== id))
    } catch (e) {
      console.error('Delete invoice failed', e)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading invoices...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Invoices</h1>
              <p className="text-purple-200">
                Manage and track all invoices for {currentTeam?.team_name}
              </p>
            </div>
            {canEditInvoices && (
              <Link href="/invoices/new">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0">
                  <span className="w-5 h-5 mr-2">➕</span>
                  New Invoice
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300">🔍</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoices by number or customer..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
              >
                <option className="bg-slate-900" value="all">All Status</option>
                <option className="bg-slate-900" value="draft">Draft</option>
                <option className="bg-slate-900" value="pending">Pending</option>
                <option className="bg-slate-900" value="paid">Paid</option>
                <option className="bg-slate-900" value="overdue">Overdue</option>
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="due_date-asc">Due Date (Earliest)</option>
                <option value="due_date-desc">Due Date (Latest)</option>
                <option value="total_amount-desc">Amount (High to Low)</option>
                <option value="total_amount-asc">Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-4xl">📄</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Invoices Found</h2>
            <p className="text-purple-200 mb-8 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first invoice.'
              }
            </p>
            {canEditInvoices && !searchTerm && statusFilter === 'all' && (
              <Link href="/invoices/new">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0">
                  <span className="w-5 h-5 mr-2">➕</span>
                  Create First Invoice
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-purple-200 font-medium">Invoice</th>
                    <th className="text-left p-4 text-purple-200 font-medium">Customer</th>
                    <th className="text-left p-4 text-purple-200 font-medium">Amount</th>
                    <th className="text-left p-4 text-purple-200 font-medium">Balance</th>
                    <th className="text-left p-4 text-purple-200 font-medium">Status</th>
                    <th className="text-left p-4 text-purple-200 font-medium">Due Date</th>
                    <th className="text-left p-4 text-purple-200 font-medium">Created</th>
                    <th className="text-right p-4 text-purple-200 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="text-white font-medium">{invoice.invoice_number}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-white">{invoice.customer_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">{formatCurrency(invoice.total_amount)}</div>
                      </td>
                      <td className="p-4">
                        <div className={`font-medium ${
                          invoice.balance > 0 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {formatCurrency(invoice.balance)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-purple-200 text-sm">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-purple-200 text-sm">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 p-2 rounded-lg">
                              <span className="w-4 h-4">👁️</span>
                            </Button>
                          </Link>
                          {canEditInvoices && (
                            <Link href={`/invoices/${invoice.id}/edit`}>
                              <Button className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-200 hover:bg-blue-500/30 transition-all duration-300 p-2 rounded-lg">
                                <span className="w-4 h-4">✏️</span>
                              </Button>
                            </Link>
                          )}
                          {canDeleteInvoices && (
                            <Button onClick={() => handleDelete(invoice.id)} className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 hover:bg-red-500/30 transition-all duration-300 p-2 rounded-lg">
                              <span className="w-4 h-4">🗑️</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {filteredInvoices.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 text-emerald-400">💵</span>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
                  </div>
                  <div className="text-purple-200 text-sm">Total Amount</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 text-yellow-400">💵</span>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0))}
                  </div>
                  <div className="text-purple-200 text-sm">Outstanding</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 text-blue-400">📄</span>
                <div>
                  <div className="text-2xl font-bold text-white">{filteredInvoices.length}</div>
                  <div className="text-purple-200 text-sm">Invoices</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 text-purple-400">👤</span>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {new Set(filteredInvoices.map(inv => inv.customer_name)).size}
                  </div>
                  <div className="text-purple-200 text-sm">Customers</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
