'use client'

import { useState } from 'react'
import { useTeam } from '@/components/TeamContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import * as Lucide from 'lucide-react'
const FileText: any = (Lucide as any).FileText || ((props: any) => <i {...props} />)
const Plus: any = (Lucide as any).Plus || ((props: any) => <i {...props} />)
const Trash2: any = (Lucide as any).Trash2 || ((props: any) => <i {...props} />)
const Save: any = (Lucide as any).Save || ((props: any) => <i {...props} />)
const ArrowLeft: any = (Lucide as any).ArrowLeft || ((props: any) => <i {...props} />)
const DollarSign: any = (Lucide as any).DollarSign || ((props: any) => <i {...props} />)
const Calendar: any = (Lucide as any).Calendar || ((props: any) => <i {...props} />)
const User: any = (Lucide as any).User || ((props: any) => <i {...props} />)
const Building: any = (Lucide as any).Building || ((props: any) => <i {...props} />)
import Link from 'next/link'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface InvoiceForm {
  customer_name: string
  customer_email: string
  customer_address: string
  invoice_date: string
  due_date: string
  items: InvoiceItem[]
  notes: string
  terms: string
}

export default function NewInvoicePage() {
  const { currentTeam, canEditInvoices } = useTeam()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<InvoiceForm>({
    customer_name: '',
    customer_email: '',
    customer_address: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [
      {
        id: '1',
        description: '',
        quantity: 1,
        unit_price: 0,
        amount: 0
      }
    ],
    notes: '',
    terms: 'Net 30'
  })

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (id: string) => {
    if (form.items.length > 1) {
      setForm(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.amount = updatedItem.quantity * updatedItem.unit_price
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const calculateSubtotal = () => {
    return form.items.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.08 // 8% tax rate
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEditInvoices) return

    setLoading(true)
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: currentTeam?.team_id,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_address: form.customer_address,
          invoice_date: form.invoice_date,
          due_date: form.due_date,
          items: form.items,
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          total_amount: calculateTotal(),
          balance: calculateTotal(),
          status: 'draft',
          notes: form.notes,
          terms: form.terms
        }),
      })

      if (response.ok) {
        router.push('/invoices')
      } else {
        throw new Error('Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!canEditInvoices) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Access Restricted</h1>
            <p className="text-purple-200 mb-8 max-w-md mx-auto">
              You need admin or accountant permissions to create invoices. Please contact your team admin to request access.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/invoices">
              <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 p-2 rounded-lg">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Invoice</h1>
              <p className="text-purple-200">
                Generate a new invoice for {currentTeam?.team_name}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <User className="w-6 h-6" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="customer@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Customer Address
                </label>
                <textarea
                  value={form.customer_address}
                  onChange={(e) => setForm(prev => ({ ...prev, customer_address: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter customer address"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6" />
              Invoice Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => setForm(prev => ({ ...prev, invoice_date: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <DollarSign className="w-6 h-6" />
                Invoice Items
              </h2>
              <Button
                type="button"
                onClick={addItem}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {form.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end p-4 bg-white/5 rounded-xl">
                  <div className="col-span-5">
                    <label className="block text-purple-200 text-sm font-medium mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-purple-200 text-sm font-medium mb-2">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-purple-200 text-sm font-medium mb-2">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-purple-200 text-sm font-medium mb-2">
                      Amount
                    </label>
                    <div className="px-3 py-2 bg-white/5 rounded-lg text-white font-medium">
                      ${item.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {form.items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 hover:bg-red-500/30 transition-all duration-300 p-2 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <DollarSign className="w-6 h-6" />
              Invoice Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-purple-200">
                <span>Subtotal:</span>
                <span className="text-white font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-purple-200">
                <span>Tax (8%):</span>
                <span className="text-white font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white text-xl font-bold border-t border-white/20 pt-4">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Building className="w-6 h-6" />
              Additional Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Additional notes for the customer"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={form.terms}
                  onChange={(e) => setForm(prev => ({ ...prev, terms: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Net 30"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link href="/invoices">
              <Button
                type="button"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 py-3 px-6 rounded-xl"
              >
                Cancel
              </Button>
            </Link>
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Invoice
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
