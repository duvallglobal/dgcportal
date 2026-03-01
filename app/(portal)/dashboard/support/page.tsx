'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LifeBuoy, Plus, Loader2, MessageCircle, Clock } from 'lucide-react'

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  reply_count?: number
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets')
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } catch (_err) {
      console.error('Failed to fetch tickets:', _err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-gray-500 mt-1">View and manage your support tickets.</p>
        </div>
        <Link href="/dashboard/support/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Ticket</Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LifeBuoy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Tickets Yet</h3>
            <p className="text-sm text-gray-500 mt-2">Create a ticket when you need help from our team.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{ticket.subject}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className={STATUS_COLORS[ticket.status] || STATUS_COLORS.open}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={PRIORITY_COLORS[ticket.priority] || ''}>
                        {ticket.priority}
                      </Badge>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {ticket.reply_count && ticket.reply_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 ml-4">
                      <MessageCircle className="h-3.5 w-3.5" /> {ticket.reply_count}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
