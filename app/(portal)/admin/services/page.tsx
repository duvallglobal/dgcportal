'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Package, DollarSign, Loader2, CheckCircle, Tag, Plus } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  tagline: string | null
  capabilities: string | null
  industries: string | null
  category: string
  is_active: boolean
  stripe_product_id: string | null
  stripe_price_id: string | null
  price_amount: number | null
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newService, setNewService] = useState({ name: '', description: '', category: 'core', price: '' })

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services || [])
      }
    } catch (err) {
      console.error('Failed to fetch services:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])

  const updateService = async (serviceId: string, updates: Partial<Service>) => {
    setSaving(serviceId)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, ...updates }),
      })
      if (res.ok) {
        const data = await res.json()
        setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, ...data.service } : s)))
        setSaved(serviceId)
        setTimeout(() => setSaved(null), 2000)
      }
    } catch (err) {
      console.error('Update error:', err)
    } finally {
      setSaving(null)
    }
  }

  const setPrice = async (serviceId: string) => {
    const amount = Math.round(parseFloat(priceInput) * 100)
    if (isNaN(amount) || amount <= 0) return

    setSaving(serviceId)
    try {
      const res = await fetch('/api/admin/services/set-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, amount }),
      })
      if (res.ok) {
        const data = await res.json()
        setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, price_amount: amount, stripe_price_id: data.stripePriceId } : s)))
        setEditingPrice(null)
        setPriceInput('')
        setSaved(serviceId)
        setTimeout(() => setSaved(null), 2000)
      }
    } catch (err) {
      console.error('Price set error:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleCreateService = async () => {
    if (!newService.name) return
    setCreating(true)
    try {
      const priceVal = parseFloat(newService.price)
      const priceAmount = !isNaN(priceVal) && priceVal > 0 ? Math.round(priceVal * 100) : undefined

      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newService.name,
          description: newService.description,
          category: newService.category,
          price: priceAmount,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setServices((prev) => [data.service, ...prev])
        setIsCreateOpen(false)
        setNewService({ name: '', description: '', category: 'core', price: '' })
      } else {
        alert('Failed to create service')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating service')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Service Management</h1>
          <p className="text-gray-500 mt-1">Manage DGC services synced from Stripe. Set prices, toggle active status, and assign categories.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 gap-2 shrink-0">
              <Plus className="h-4 w-4" /> New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Service Name *</label>
                <Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} placeholder="e.g. Website Development" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} placeholder="Brief description..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newService.category} onValueChange={(v) => setNewService({ ...newService, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core Service</SelectItem>
                      <SelectItem value="addon">Add-on</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Initial Price ($)</label>
                  <Input type="number" step="0.01" min="0" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateService} disabled={!newService.name || creating} className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Services Found</h3>
            <p className="text-sm text-gray-500 mt-2">Run the seed script: <code className="bg-gray-100 px-2 py-0.5 rounded">npx tsx scripts/seed-stripe-products.ts --test</code></p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <Badge variant={service.category === 'core' ? 'default' : 'outline'}>{service.category}</Badge>
                      {saved === service.id && <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Saved</span>}
                    </div>
                    {service.tagline && <p className="text-sm text-[#e2b714] font-medium mb-1">{service.tagline}</p>}
                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>

                    {service.capabilities && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {service.capabilities.split(',').map((cap, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cap.trim()}</span>
                        ))}
                      </div>
                    )}

                    {service.stripe_product_id && (
                      <p className="text-xs text-gray-400 font-mono">Stripe: {service.stripe_product_id}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    {/* Price */}
                    <div className="text-right">
                      {editingPrice === service.id ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <DollarSign className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" />
                            <Input
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              placeholder="0.00"
                              className="pl-7 w-28"
                              type="number"
                              step="0.01"
                            />
                          </div>
                          <Button size="sm" onClick={() => setPrice(service.id)} disabled={saving === service.id}>
                            {saving === service.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingPrice(null); setPriceInput('') }}>✕</Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPrice(service.id)
                            setPriceInput(service.price_amount ? (service.price_amount / 100).toFixed(2) : '')
                          }}
                          className="text-sm font-bold hover:text-blue-600 transition-colors"
                        >
                          {service.price_amount ? `$${(service.price_amount / 100).toFixed(2)}` : 'Set Price'}
                        </button>
                      )}
                    </div>

                    {/* Category */}
                    <Select
                      value={service.category}
                      onValueChange={(v) => updateService(service.id, { category: v })}
                    >
                      <SelectTrigger className="w-32">
                        <Tag className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">Core Service</SelectItem>
                        <SelectItem value="addon">Add-on</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{service.is_active ? 'Active' : 'Inactive'}</span>
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={(checked) => updateService(service.id, { is_active: checked })}
                      />
                    </div>
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
