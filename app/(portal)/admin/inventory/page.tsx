'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Package, MessageSquare, Save, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  product_name: string
  description: string | null
  price: number | null
  sku: string | null
  category: string | null
  status: string
  admin_notes: string | null
  clients: { full_name: string; business_name: string | null } | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  listed: 'bg-green-100 text-green-800',
  needs_revision: 'bg-red-100 text-red-700',
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
    try {
      const res = await fetch(`/api/admin/inventory${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const updateProduct = async (productId: string, updates: Record<string, any>) => {
    setSaving(productId)
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...updates }),
      })
      if (res.ok) {
        await fetchProducts()
        setSaved(productId)
        setTimeout(() => setSaved(null), 2000)
      }
    } catch (err) { console.error(err) }
    finally { setSaving(null); setEditingNotes(null) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Product Inventory</h1>
          <p className="text-gray-500 mt-1">Review and manage client product submissions.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="listed">Listed</SelectItem>
            <SelectItem value="needs_revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {products.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products found.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{p.product_name}</span>
                      <Badge className={STATUS_COLORS[p.status]}>{p.status.replace('_', ' ')}</Badge>
                      {saved === p.id && <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Saved</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {p.clients?.full_name || 'Unknown'} {p.clients?.business_name ? `· ${p.clients.business_name}` : ''}
                      {p.sku ? ` · SKU: ${p.sku}` : ''}
                      {p.price ? ` · $${(p.price / 100).toFixed(2)}` : ''}
                    </p>
                    {p.description && <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>}

                    {p.admin_notes && editingNotes !== p.id && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                        <strong>Your Note:</strong> {p.admin_notes}
                      </div>
                    )}

                    {editingNotes === p.id && (
                      <div className="mt-2 flex gap-2">
                        <Textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} placeholder="Add feedback/notes for this product..." rows={2} className="text-sm flex-1" />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => updateProduct(p.id, { admin_notes: notesInput })} disabled={saving === p.id}>
                            {saving === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Select value={p.status} onValueChange={(v) => updateProduct(p.id, { status: v })}>
                      <SelectTrigger className="w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="listed">Listed</SelectItem>
                        <SelectItem value="needs_revision">Needs Revision</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => { setEditingNotes(p.id); setNotesInput(p.admin_notes || '') }}>
                      <MessageSquare className="h-3 w-3 mr-1" /> Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
