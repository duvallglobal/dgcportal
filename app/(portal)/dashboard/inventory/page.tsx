'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Upload, Download, Loader2, Image as ImageIcon, Wand2, X } from 'lucide-react'

interface Product {
  id: string
  product_name: string
  description: string | null
  price: number | null
  sku: string | null
  category: string | null
  variant_size: string | null
  variant_color: string | null
  condition: string | null
  status: string
  admin_notes: string | null
  image_urls: string[] | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  listed: 'bg-green-100 text-green-800',
  needs_revision: 'bg-red-100 text-red-700',
}

const CATEGORIES = ['Clothing', 'Electronics', 'Home & Garden', 'Accessories', 'Shoes', 'Collectibles', 'Books', 'Toys', 'Sports', 'Other']
const CONDITIONS = ['New with Tags', 'New without Tags', 'Like New', 'Good', 'Fair', 'Poor']

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [csvUploading, setCsvUploading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState<string | null>(null)

  const [form, setForm] = useState({
    product_name: '', description: '', price: '', sku: '', category: '',
    variant_size: '', variant_color: '', condition: '',
  })
  const [images, setImages] = useState<File[]>([])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (_err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_name.trim()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      images.forEach((img) => fd.append('images', img))
      const res = await fetch('/api/inventory', { method: 'POST', body: fd })
      if (res.ok) {
        setForm({ product_name: '', description: '', price: '', sku: '', category: '', variant_size: '', variant_color: '', condition: '' })
        setImages([])
        setShowForm(false)
        await fetchProducts()
      }
    } catch (_err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleCsvUpload = async (file: File) => {
    setCsvUploading(true)
    try {
      const fd = new FormData()
      fd.append('csv', file)
      const res = await fetch('/api/inventory/bulk', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        alert(`Imported ${data.count} products successfully!`)
        await fetchProducts()
      } else {
        alert('CSV import failed. Check format and try again.')
      }
    } catch (_err) { console.error(err) }
    finally { setCsvUploading(false) }
  }

  const handleAiDescription = async (productId: string) => {
    setAiGenerating(productId)
    try {
      const res = await fetch('/api/inventory/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        await fetchProducts()
      }
    } catch (_err) { console.error(err) }
    finally { setAiGenerating(null) }
  }

  const downloadTemplate = () => {
    const csv = 'product_name,description,price,sku,category,variant_size,variant_color,condition,image_urls\n"Example Product","A great product",29.99,SKU-001,Clothing,M,Blue,"New with Tags",""\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'inventory_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Content Inventory</h1>
          <p className="text-gray-500 mt-1">Submit products for listing on your e-commerce platforms.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}><Download className="h-4 w-4 mr-2" /> CSV Template</Button>
          <label>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])} />
            <Button variant="outline" asChild disabled={csvUploading}>
              <span>{csvUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Bulk CSV</span>
            </Button>
          </label>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">New Product</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Product Name *</Label><Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} /></div>
                <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Size</Label><Input value={form.variant_size} onChange={(e) => setForm({ ...form, variant_size: e.target.value })} /></div>
                <div><Label>Color</Label><Input value={form.variant_color} onChange={(e) => setForm({ ...form, variant_color: e.target.value })} /></div>
              </div>
              <div><Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Images (multi-file)</Label>
                <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} className="hidden" id="product-images" />
                  <label htmlFor="product-images" className="cursor-pointer text-center block">
                    <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">{images.length > 0 ? `${images.length} files selected` : 'Click to upload images'}</p>
                  </label>
                </div>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {images.map((img, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                        {img.name}
                        <button onClick={() => setImages(images.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Add Product</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Products Yet</h3>
            <p className="text-sm text-gray-500 mt-2">Add products individually or import via CSV.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{p.product_name}</span>
                      <Badge className={STATUS_COLORS[p.status] || STATUS_COLORS.pending}>{p.status.replace('_', ' ')}</Badge>
                      {p.sku && <span className="text-xs text-gray-400 font-mono">SKU: {p.sku}</span>}
                    </div>
                    {p.description && <p className="text-sm text-gray-600 mb-1">{p.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {p.price && <span>${(p.price / 100).toFixed(2)}</span>}
                      {p.category && <span>{p.category}</span>}
                      {p.variant_size && <span>Size: {p.variant_size}</span>}
                      {p.variant_color && <span>Color: {p.variant_color}</span>}
                      {p.condition && <span>{p.condition}</span>}
                    </div>
                    {p.admin_notes && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                        <strong>Admin Note:</strong> {p.admin_notes}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAiDescription(p.id)} disabled={aiGenerating === p.id}>
                    {aiGenerating === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                    AI Describe
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
