'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Bot, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Reply {
  id: string
  sender_role: 'client' | 'admin'
  content: string
  created_at: string
  sender_name: string | null
}

interface TicketDetail {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  created_at: string
  attachment_url: string | null
  replies: Reply[]
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
}

export default function TicketDetailPage() {
  const params = useParams()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`)
      if (res.ok) {
        const data = await res.json()
        setTicket(data.ticket)
      }
    } catch (_err) {
      console.error('Failed to fetch ticket:', _err)
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => { fetchTicket() }, [fetchTicket])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket?.replies])

  const handleReply = async () => {
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply.trim() }),
      })
      if (res.ok) {
        setReply('')
        await fetchTicket()
      }
    } catch (_err) {
      console.error('Reply error:', _err)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!ticket) return <div className="text-center py-20 text-gray-500">Ticket not found.</div>

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved'

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/support" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
            <div className="flex gap-2">
              <Badge className={STATUS_COLORS[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
              <Badge variant="outline">{ticket.priority}</Badge>
            </div>
          </div>
          <p className="text-xs text-gray-400">Created {new Date(ticket.created_at).toLocaleString()}</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          {ticket.attachment_url && (
            <a href={ticket.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-3">View Attachment</a>
          )}
        </CardContent>
      </Card>

      {/* Thread */}
      <div className="space-y-4 mb-6">
        {(ticket.replies || []).map((r) => (
          <div key={r.id} className={cn('flex gap-3', r.sender_role === 'client' ? 'justify-end' : 'justify-start')}>
            {r.sender_role === 'admin' && (
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-purple-600" />
              </div>
            )}
            <div className={cn(
              'max-w-[80%] rounded-lg px-4 py-3',
              r.sender_role === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
            )}>
              <div className="text-xs opacity-70 mb-1">{r.sender_name || (r.sender_role === 'admin' ? 'DGC Team' : 'You')} · {new Date(r.created_at).toLocaleString()}</div>
              <div className="text-sm whitespace-pre-wrap">{r.content}</div>
            </div>
            {r.sender_role === 'client' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply Box */}
      {!isClosed ? (
        <Card>
          <CardContent className="pt-4">
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." rows={3} />
            <div className="flex justify-end mt-3">
              <Button onClick={handleReply} disabled={!reply.trim() || sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center text-sm text-gray-500 py-4">This ticket is {ticket.status}. Open a new ticket if you need further help.</div>
      )}
    </div>
  )
}
