'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTeam } from '@/components/TeamContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import * as Lucide from 'lucide-react'
const FileText: any = (Lucide as any).FileText || ((props: any) => <i {...props} />)
const Edit: any = (Lucide as any).Edit || ((props: any) => <i {...props} />)
const Download: any = (Lucide as any).Download || ((props: any) => <i {...props} />)
const ArrowLeft: any = (Lucide as any).ArrowLeft || ((props: any) => <i {...props} />)
const DollarSign: any = (Lucide as any).DollarSign || ((props: any) => <i {...props} />)
const Calendar: any = (Lucide as any).Calendar || ((props: any) => <i {...props} />)
const User: any = (Lucide as any).User || ((props: any) => <i {...props} />)
const Building: any = (Lucide as any).Building || ((props: any) => <i {...props} />)
const CheckCircle: any = (Lucide as any).CheckCircle || ((props: any) => <i {...props} />)
const Clock: any = (Lucide as any).Clock || ((props: any) => <i {...props} />)
const AlertTriangle: any = (Lucide as any).AlertTriangle || ((props: any) => <i {...props} />)
const Printer: any = (Lucide as any).Printer || ((props: any) => <i {...props} />)

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string
  customer_address: string
  invoice_date: string
  due_date: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total_amount: number
  balance: number
  status: string
  notes: string
  terms: string
  created_at: string
  updated_at: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentTeam, canEditInvoices, canDeleteInvoices } = useTeam()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      // For now, we'll use mock data
      // In a real implementation, you would fetch from the API
      const mockInvoice: Invoice = {
        id: params.id as string,
        invoice_number: 'INV-2024-001',
        customer_name: 'Acme Corporation',
        customer_email: 'billing@acme.com',
        customer_address: '123 Business St, Suite 100\nNew York, NY 10001',
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        items: [
          {
            id: '1',
            description: 'Web Development Services',
            quantity: 40,
            unit_price: 50.00,
            amount: 2000.00
          },
          {
            id: '2',
            description: 'UI/UX Design',
            quantity: 10,
            unit_price: 50.00,
            amount: 500.00
          }
        ],
        subtotal: 2500.00,
        tax: 200.00,
        total_amount: 2700.00,
        balance: 2700.00,
        status: 'pending',
        notes: 'Thank you for your business. Please include invoice number with payment.',
        terms: 'Net 30',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      setInvoice(mockInvoice)
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5" />
      case 'overdue':
        return <AlertTriangle className="w-5 h-5" />
      case 'pending':
        return <Clock className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading invoice...</div>
        </div>
      </AppLayout>
    )
  }

  if (!invoice) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <div className="text-red-400 text-xl mb-4">Invoice Not Found</div>
          <div className="text-purple-200 mb-8">The invoice you're looking for doesn't exist.</div>
          <Link href="/invoices">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300">
              Back to Invoices
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/invoices">
                <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 p-2 rounded-lg">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">{invoice.invoice_number}</h1>
                <p className="text-purple-200">
                  Invoice for {currentTeam?.team_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(invoice.status)} flex items-center gap-2`}>
                {getStatusIcon(invoice.status)}
                {invoice.status}
              </span>
              <Button
                onClick={handlePrint}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 p-2 rounded-lg"
              >
                <Printer className="w-4 h-4" />
              </Button>
              {canEditInvoices && (
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Button className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-200 hover:bg-blue-500/30 transition-all duration-300 p-2 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 print:bg-white print:text-black">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white print:text-black mb-2">
                {currentTeam?.team_name}
              </h2>
              <p className="text-purple-200 print:text-gray-600">
                Professional Invoice Management
              </p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-white print:text-black mb-2">
                INVOICE
              </h1>
              <p className="text-purple-200 print:text-gray-600">
                {invoice.invoice_number}
              </p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Bill To */}
            <div>
              <h3 className="text-lg font-semibold text-white print:text-black mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Bill To
              </h3>
              <div className="bg-white/5 rounded-xl p-4 print:bg-gray-50">
                <div className="text-white print:text-black font-medium mb-2">
                  {invoice.customer_name}
                </div>
                {invoice.customer_email && (
                  <div className="text-purple-200 print:text-gray-600 mb-2">
                    {invoice.customer_email}
                  </div>
                )}
                {invoice.customer_address && (
                  <div className="text-purple-200 print:text-gray-600 whitespace-pre-line">
                    {invoice.customer_address}
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Info */}
            <div>
              <h3 className="text-lg font-semibold text-white print:text-black mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Details
              </h3>
              <div className="bg-white/5 rounded-xl p-4 print:bg-gray-50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-200 print:text-gray-600">Invoice Date:</span>
                  <span className="text-white print:text-black font-medium">
                    {formatDate(invoice.invoice_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200 print:text-gray-600">Due Date:</span>
                  <span className="text-white print:text-black font-medium">
                    {formatDate(invoice.due_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200 print:text-gray-600">Status:</span>
                  <span className={`font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200 print:text-gray-600">Terms:</span>
                  <span className="text-white print:text-black font-medium">
                    {invoice.terms}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white print:text-black mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Items
            </h3>
            <div className="bg-white/5 rounded-xl overflow-hidden print:bg-gray-50">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 print:border-gray-300">
                    <th className="text-left p-4 text-purple-200 print:text-gray-600 font-medium">Description</th>
                    <th className="text-right p-4 text-purple-200 print:text-gray-600 font-medium">Qty</th>
                    <th className="text-right p-4 text-purple-200 print:text-gray-600 font-medium">Unit Price</th>
                    <th className="text-right p-4 text-purple-200 print:text-gray-600 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 print:border-gray-200">
                      <td className="p-4 text-white print:text-black">{item.description}</td>
                      <td className="p-4 text-right text-white print:text-black">{item.quantity}</td>
                      <td className="p-4 text-right text-white print:text-black">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="p-4 text-right text-white print:text-black font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-purple-200 print:text-gray-600">
                <span>Subtotal:</span>
                <span className="text-white print:text-black">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-purple-200 print:text-gray-600">
                <span>Tax (8%):</span>
                <span className="text-white print:text-black">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-white print:text-black text-xl font-bold border-t border-white/20 print:border-gray-300 pt-3">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-purple-200 print:text-gray-600">
                <span>Balance Due:</span>
                <span className={`font-medium ${
                  invoice.balance > 0 ? 'text-yellow-400 print:text-yellow-600' : 'text-green-400 print:text-green-600'
                }`}>
                  {formatCurrency(invoice.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {invoice.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-white print:text-black mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Notes
                  </h3>
                  <div className="bg-white/5 rounded-xl p-4 print:bg-gray-50">
                    <p className="text-purple-200 print:text-gray-600 whitespace-pre-line">
                      {invoice.notes}
                    </p>
                  </div>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h3 className="text-lg font-semibold text-white print:text-black mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Payment Terms
                  </h3>
                  <div className="bg-white/5 rounded-xl p-4 print:bg-gray-50">
                    <p className="text-purple-200 print:text-gray-600">
                      {invoice.terms}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-purple-300 print:text-gray-500 text-sm border-t border-white/10 print:border-gray-300 pt-8">
            <p>Thank you for your business!</p>
            <p className="mt-2">
              Created on {formatDate(invoice.created_at)} • 
              Last updated on {formatDate(invoice.updated_at)}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
