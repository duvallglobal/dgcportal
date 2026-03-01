'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ChevronDown, ChevronUp, Send, LifeBuoy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  created_at: string
  clients: { full_name: string; email: string; business_name: string | null } | null
  replies?: any[]
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = useCallback(async () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (priorityFilter !== 'all') params.set('priority', priorityFilter)
    try {
      const res = await fetch(`/api/admin/tickets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [statusFilter, priorityFilter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const updateStatus = async (ticketId: string, status: string) => {
    await fetch(`/api/admin/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchTickets()
  }

  const sendReply = async (ticketId: string) => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply.trim() }),
      })
      setReply('')
      await fetchTickets()
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const loadReplies = async (ticketId: string) => {
    if (expanded === ticketId) { setExpanded(null); return }
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/replies`)
      if (res.ok) {
        const data = await res.json()
        setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, replies: data.replies } : t))
      }
    } catch (err) { console.error(err) }
    setExpanded(ticketId)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Support Tickets</h1>
      <p className="text-gray-500 mb-6">Manage all client support tickets.</p>

      <div className="flex gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tickets.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <LifeBuoy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tickets found.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{t.subject}</span>
                      <Badge className={STATUS_COLORS[t.status]}>{t.status.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{t.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{t.clients?.full_name} ({t.clients?.email}) · {new Date(t.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                      <SelectTrigger className="w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => loadReplies(t.id)}>
                      {expanded === t.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {expanded === t.id && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    {(t.replies || []).map((r: any) => (
                      <div key={r.id} className={cn('text-sm p-3 rounded', r.sender_role === 'admin' ? 'bg-purple-50' : 'bg-gray-50')}>
                        <div className="text-xs text-gray-500 mb-1">{r.sender_name || r.sender_role} · {new Date(r.created_at).toLocaleString()}</div>
                        <div>{r.content}</div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply as admin..." rows={2} className="flex-1" />
                      <Button onClick={() => sendReply(t.id)} disabled={!reply.trim() || sending} className="self-end">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
