'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Loader2, FileText, CreditCard, LifeBuoy, MessageCircle, Wand2, User } from 'lucide-react'

export default function AdminClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/full`)
      if (res.ok) setData(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [clientId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!data) return <div className="text-center py-20 text-gray-500">Client not found.</div>

  const { client, intakes, agreements, payments, tickets, chatMessages } = data

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{client.full_name || client.email}</h1>
          <p className="text-gray-500">{client.business_name || 'No business name'} · {client.email}</p>
          {client.phone && <p className="text-sm text-gray-400">{client.phone}</p>}
        </div>
        <Link href={`/admin/clients/${clientId}/generate`}>
          <Button><Wand2 className="h-4 w-4 mr-2" /> AI Generate</Button>
        </Link>
      </div>

      <Tabs defaultValue="intake">
        <TabsList className="mb-6">
          <TabsTrigger value="intake"><FileText className="h-4 w-4 mr-1" /> Intake</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="h-4 w-4 mr-1" /> Billing</TabsTrigger>
          <TabsTrigger value="tickets"><LifeBuoy className="h-4 w-4 mr-1" /> Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="chat"><MessageCircle className="h-4 w-4 mr-1" /> Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="intake">
          {intakes.length === 0 ? <p className="text-gray-500 text-sm">No intake submitted.</p> : (
            intakes.map((intake: any) => (
              <Card key={intake.id} className="mb-4">
                <CardHeader><CardTitle className="text-base">Intake: {intake.business_name}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Status:</span> <Badge variant="outline">{intake.status}</Badge></div>
                    <div><span className="text-gray-500">Industry:</span> {intake.industry || 'N/A'}</div>
                    <div><span className="text-gray-500">Budget:</span> {intake.budget_range || 'N/A'}</div>
                    <div><span className="text-gray-500">Timeline:</span> {intake.timeline || 'N/A'}</div>
                    <div className="col-span-2"><span className="text-gray-500">Services:</span> {(intake.services_interested || []).join(', ')}</div>
                    {intake.goals && <div className="col-span-2"><span className="text-gray-500">Goals:</span> {intake.goals}</div>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            {agreements.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Agreements</CardTitle></CardHeader>
                <CardContent>
                  {agreements.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">Service Agreement</span>
                      <Badge variant="outline">{a.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
              <CardContent>
                {payments.length === 0 ? <p className="text-sm text-gray-500">No payments.</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="pb-2 text-left text-gray-500">Date</th><th className="pb-2 text-left text-gray-500">Type</th><th className="pb-2 text-right text-gray-500">Amount</th><th className="pb-2 text-right text-gray-500">Status</th></tr></thead>
                    <tbody>
                      {payments.map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="py-2 capitalize">{p.payment_type}</td>
                          <td className="py-2 text-right font-medium">${(p.amount / 100).toFixed(2)}</td>
                          <td className="py-2 text-right"><Badge variant="outline" className="text-xs">{p.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          {tickets.length === 0 ? <p className="text-sm text-gray-500">No tickets.</p> : (
            <div className="space-y-3">
              {tickets.map((t: any) => (
                <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{t.subject}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{t.status}</Badge>
                        <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat">
          {chatMessages.length === 0 ? <p className="text-sm text-gray-500">No chat history.</p> : (
            <Card>
              <CardContent className="pt-6 max-h-96 overflow-y-auto space-y-3">
                {chatMessages.map((m: any, i: number) => (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                      <div className="text-xs opacity-60 mb-0.5">{m.role} · {new Date(m.created_at).toLocaleString()}</div>
                      {m.content}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
