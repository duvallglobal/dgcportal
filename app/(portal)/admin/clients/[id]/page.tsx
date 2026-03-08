'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, Loader2, CreditCard, User, FileText,
  LifeBuoy, MessageCircle, FileSignature,
  Wand2, Clock, CheckCircle, Bot
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClientDetail {
  client: Record<string, string | null>
  intake: Record<string, unknown> | null
  agreements: Record<string, unknown>[]
  tickets: Record<string, unknown>[]
  invoices: Record<string, unknown>[]
  addons: Record<string, unknown>[]
}

interface ChatMessage {
  id: string
  role: string
  content: string
  created_at: string
}

const PROJECT_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-gray-100 text-gray-700' },
  { value: 'intake_submitted', label: 'Intake Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'agreement_signed', label: 'Agreement Signed', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-purple-100 text-purple-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-600' },
]

const AGREEMENT_STATUSES: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  unsigned: { label: 'Unsigned', color: 'bg-gray-100 text-gray-700', icon: FileSignature },
  signed_awaiting_deposit: { label: 'Signed — Awaiting Deposit', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  deposit_paid: { label: 'Deposit Paid', color: 'bg-blue-100 text-blue-800', icon: CreditCard },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
}

export default function AdminClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  const [data, setData] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatLoaded, setChatLoaded] = useState(false)
  const [statusValue, setStatusValue] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.client?.onboarding_status) {
          setStatusValue(json.client.onboarding_status)
        } else {
          setStatusValue('new')
        }
      }
    } catch (err) {
      console.error('Failed to load client:', err)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchData() }, [fetchData])

  const loadChatHistory = useCallback(async () => {
    if (chatLoaded) return
    setChatLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/full`)
      if (res.ok) {
        const fullData = await res.json()
        setChatMessages(fullData.chatMessages || fullData.chat_messages || [])
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
    } finally {
      setChatLoading(false)
      setChatLoaded(true)
    }
  }, [clientId, chatLoaded])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const handleUpdateStatus = async () => {
    if (!statusValue || statusValue === data?.client.onboarding_status) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_status: statusValue })
      })
      if (!res.ok) throw new Error('Failed to update status')
      const result = await res.json()
      setData(prev => prev ? { ...prev, client: result.client } : null)
      toast.success('Status updated successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-500">Client not found.</div>
  }

  const { client, intake, agreements, tickets, invoices, addons } = data
  const currentStatus = PROJECT_STATUSES.find((s) => s.value === (client.onboarding_status || 'new')) || PROJECT_STATUSES[0]

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      {/* Client Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#1a1a2e] flex items-center justify-center">
          <span className="text-white font-bold text-lg">
            {(client.full_name || '?')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{client.full_name}</h1>
          <p className="text-sm text-gray-500 truncate">
            {client.email} {client.business_name && `\u00B7 ${client.business_name}`}
          </p>
        </div>
        <Badge className={currentStatus.color}>{currentStatus.label}</Badge>
        <Link href={`/admin/clients/${clientId}/generate`}>
          <Button size="sm" variant="outline">
            <Wand2 className="h-4 w-4 mr-1" /> Generate
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">Project Status</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="agreements">Agreement</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="chat" onClick={loadChatHistory}>Chat History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
                <div><div className="text-2xl font-bold">{agreements.length}</div><div className="text-xs text-gray-500">Agreements</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg"><LifeBuoy className="h-5 w-5 text-orange-600" /></div>
                <div><div className="text-2xl font-bold">{tickets.length}</div><div className="text-xs text-gray-500">Tickets</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg"><MessageCircle className="h-5 w-5 text-green-600" /></div>
                <div><div className="text-2xl font-bold">{addons.length}</div><div className="text-xs text-gray-500">Add-ons</div></div>
              </CardContent>
            </Card>
          </div>
          {agreements.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Agreements</CardTitle></CardHeader>
              <CardContent>
                {agreements.slice(0, 5).map((a: Record<string, unknown>) => (
                  <div key={String(a.id)} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{String(a.service_name || 'Service Agreement')}</span>
                    <Badge variant="outline">{String(a.status)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Project Status Tab */}
        <TabsContent value="status" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Current Status</label>
                  <Select value={statusValue} onValueChange={setStatusValue}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="self-end bg-[#1a1a2e] hover:bg-[#1a1a2e]/90"
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus || statusValue === client.onboarding_status}
                >
                  {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Status'}
                </Button>
              </div>

              {/* Status Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Progress Timeline</h4>
                <div className="relative">
                  {PROJECT_STATUSES.map((status, idx) => {
                    const statusIdx = PROJECT_STATUSES.findIndex((s) => s.value === (client.onboarding_status || 'new'))
                    const isCompleted = idx <= statusIdx
                    const isCurrent = idx === statusIdx

                    return (
                      <div key={status.value} className="flex items-start gap-3 mb-4 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                            isCompleted
                              ? 'bg-[#e2b714] border-[#e2b714] text-[#1a1a2e]'
                              : 'bg-white border-gray-200 text-gray-400'
                          )}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                            )}
                          </div>
                          {idx < PROJECT_STATUSES.length - 1 && (
                            <div className={cn(
                              'w-0.5 h-6 mt-1',
                              idx < statusIdx ? 'bg-[#e2b714]' : 'bg-gray-200'
                            )} />
                          )}
                        </div>
                        <div className="pt-1">
                          <div className={cn(
                            'text-sm font-medium',
                            isCurrent ? 'text-[#1a1a2e]' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                          )}>
                            {status.label}
                            {isCurrent && (
                              <Badge className="ml-2 bg-[#e2b714]/10 text-[#1a1a2e] text-[10px]">Current</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intake Tab */}
        <TabsContent value="intake" className="mt-4">
          {intake ? (
            <Card>
              <CardContent className="pt-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {Object.entries(intake)
                    .filter(([k]) => !['id', 'client_id', 'created_at', 'updated_at', 'clerk_user_id'].includes(k))
                    .map(([key, val]) => (
                      <div key={key}>
                        <dt className="font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                        <dd className="mt-1 text-gray-800">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val || '\u2014')}
                        </dd>
                      </div>
                    ))}
                </dl>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-gray-400">No intake submitted yet.</div>
          )}
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements" className="mt-4 space-y-4">
          {agreements.length > 0 ? (
            agreements.map((agreement: Record<string, unknown>) => {
              const status = AGREEMENT_STATUSES[String(agreement.status)] || AGREEMENT_STATUSES.unsigned
              const StatusIcon = status.icon
              return (
                <Card key={String(agreement.id)}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Service Agreement</span>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                          <div><span className="text-gray-500">Created:</span> {new Date(String(agreement.created_at)).toLocaleDateString()}</div>
                          {Boolean(agreement.signed_at) && (
                            <div><span className="text-gray-500">Signed:</span> {new Date(String(agreement.signed_at)).toLocaleDateString()}</div>
                          )}
                          {Boolean(agreement.deposit_amount) && (
                            <div><span className="text-gray-500">Deposit:</span> ${((Number(agreement.deposit_amount) || 0) / 100).toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                      {Boolean(agreement.signed_pdf_url) && (
                        <a
                          href={String(agreement.signed_pdf_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileSignature className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No agreements yet. Generate one from the AI Agent page.</p>
                <Link href={`/admin/clients/${clientId}/generate`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Wand2 className="h-4 w-4 mr-1" /> Generate Agreement
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-4 space-y-4">
          <div className="flex gap-2 mb-4">
            <Link href={`/admin/clients/${clientId}/billing`}>
              <Button size="sm"><CreditCard className="h-4 w-4 mr-1" /> Manage Subscription</Button>
            </Link>
          </div>
          {invoices.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2">Date</th>
                      <th className="text-left px-4 py-2">Amount</th>
                      <th className="text-left px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((inv: Record<string, unknown>) => (
                      <tr key={String(inv.id)}>
                        <td className="px-4 py-2">{new Date(String(inv.created_at)).toLocaleDateString()}</td>
                        <td className="px-4 py-2">${((Number(inv.amount) || 0) / 100).toFixed(2)}</td>
                        <td className="px-4 py-2"><Badge variant="outline">{String(inv.status)}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-gray-400">No billing history yet.</div>
          )}
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="mt-4">
          {tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.map((t: Record<string, unknown>) => (
                <Card key={String(t.id)}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{String(t.subject)}</div>
                      <div className="text-xs text-gray-400">{new Date(String(t.created_at)).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{String(t.status)}</Badge>
                      <Badge variant="outline">{String(t.priority)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No tickets.</div>
          )}
        </TabsContent>

        {/* Chat History Tab */}
        <TabsContent value="chat" className="mt-4">
          {chatLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : chatMessages.length > 0 ? (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {chatMessages
                    .filter((m) => m.role !== 'system')
                    .map((msg) => (
                      <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-[#e2b714]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot className="h-3.5 w-3.5 text-[#e2b714]" />
                          </div>
                        )}
                        <div className={cn(
                          'max-w-[75%] rounded-xl px-3 py-2 text-sm',
                          msg.role === 'user'
                            ? 'bg-[#1a1a2e] text-white'
                            : 'bg-gray-100 text-gray-800'
                        )}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          <div className={cn(
                            'text-[10px] mt-1',
                            msg.role === 'user' ? 'text-white/50' : 'text-gray-400'
                          )}>
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No chat messages yet.</p>
                <p className="text-xs text-gray-400 mt-1">Messages will appear here when the client uses the AI assistant.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
