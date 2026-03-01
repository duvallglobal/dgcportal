'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Loader2, CreditCard, User } from 'lucide-react'

interface ClientDetail {
  client: any
  intake: any
  agreements: any[]
  tickets: any[]
  invoices: any[]
  addons: any[]
  inventory: any[]
}

export default function AdminClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  const [data, setData] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`)
      if (res.ok) setData(await res.json())
    } catch (_err) { console.error(err) }
    finally { setLoading(false) }
  }, [clientId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!data) return <div className="text-center py-20 text-gray-500">Client not found.</div>

  const { client, intake, agreements, tickets, invoices, addons, inventory } = data

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center"><User className="h-6 w-6 text-gray-500" /></div>
        <div>
          <h1 className="text-xl font-bold">{client.full_name}</h1>
          <p className="text-sm text-gray-500">{client.email} {client.business_name && `· ${client.business_name}`}</p>
        </div>
        <Badge variant="outline" className="ml-auto">{client.onboarding_status}</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{agreements.length}</div><div className="text-xs text-gray-500">Agreements</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{tickets.length}</div><div className="text-xs text-gray-500">Tickets</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{addons.length}</div><div className="text-xs text-gray-500">Add-ons</div></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{inventory.length}</div><div className="text-xs text-gray-500">Products</div></CardContent></Card>
          </div>
          {agreements.length > 0 && (
            <Card><CardHeader><CardTitle className="text-sm">Recent Agreements</CardTitle></CardHeader><CardContent>
              {agreements.slice(0, 5).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{a.service_name || 'Service Agreement'}</span>
                  <Badge variant="outline">{a.status}</Badge>
                </div>
              ))}
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="intake" className="mt-4">
          {intake ? (
            <Card><CardContent className="pt-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries(intake).filter(([k]) => !['id', 'client_id', 'created_at', 'updated_at', 'clerk_user_id'].includes(k)).map(([key, val]) => (
                  <div key={key}>
                    <dt className="font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="mt-1 text-gray-800">{typeof val === 'object' ? JSON.stringify(val) : String(val || '—')}</dd>
                  </div>
                ))}
              </dl>
            </CardContent></Card>
          ) : <div className="text-center py-8 text-gray-400">No intake submitted yet.</div>}
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          <div className="flex gap-2 mb-4">
            <Link href={`/admin/clients/${clientId}/billing`}>
              <Button size="sm"><CreditCard className="h-4 w-4 mr-1" /> Manage Subscription</Button>
            </Link>
          </div>
          {invoices.length > 0 ? (
            <Card><CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Amount</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr></thead>
                <tbody className="divide-y">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2">${((inv.amount || 0) / 100).toFixed(2)}</td>
                      <td className="px-4 py-2"><Badge variant="outline">{inv.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          ) : <div className="text-center py-8 text-gray-400">No billing history yet.</div>}
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          {tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.map((t: any) => (
                <Card key={t.id}><CardContent className="py-3 flex items-center justify-between">
                  <div><div className="text-sm font-medium">{t.subject}</div><div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</div></div>
                  <div className="flex gap-2"><Badge variant="outline">{t.status}</Badge><Badge variant="outline">{t.priority}</Badge></div>
                </CardContent></Card>
              ))}
            </div>
          ) : <div className="text-center py-8 text-gray-400">No tickets.</div>}
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          {inventory.length > 0 ? (
            <div className="space-y-2">
              {inventory.map((p: any) => (
                <Card key={p.id}><CardContent className="py-3 flex items-center justify-between">
                  <div><div className="text-sm font-medium">{p.product_name}</div><div className="text-xs text-gray-400">{p.category || ''} {p.sku ? `· ${p.sku}` : ''}</div></div>
                  <Badge variant="outline">{p.status}</Badge>
                </CardContent></Card>
              ))}
            </div>
          ) : <div className="text-center py-8 text-gray-400">No inventory.</div>}
        </TabsContent>
      </Tabs>
    </div>
  )
}
