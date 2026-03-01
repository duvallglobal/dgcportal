'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, LifeBuoy, DollarSign, Briefcase, TrendingUp, Loader2 } from 'lucide-react'

interface DashboardStats {
  totalClients: number
  activeProjects: number
  pendingIntakes: number
  openTickets: number
  revenueThisMonth: number
  recentClients: { id: string; full_name: string | null; email: string; business_name: string | null; created_at: string }[]
  recentTickets: { id: string; subject: string; status: string; priority: string; clients: { full_name: string | null } | null }[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) setStats(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!stats) return <div className="text-center py-20 text-gray-500">Failed to load dashboard.</div>

  const cards = [
    { title: 'Total Clients', value: stats.totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Projects', value: stats.activeProjects, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Pending Intakes', value: stats.pendingIntakes, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Open Tickets', value: stats.openTickets, icon: LifeBuoy, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Revenue (This Month)', value: `$${(stats.revenueThisMonth / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" asChild><Link href="/admin/clients">View All Clients</Link></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{c.title}</span>
                <div className={`p-2 rounded-lg ${c.bg}`}><c.icon className={`h-4 w-4 ${c.color}`} /></div>
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Clients</CardTitle></CardHeader>
          <CardContent>
            {stats.recentClients.length === 0 ? <p className="text-sm text-gray-500">No clients yet.</p> : (
              <div className="space-y-3">
                {stats.recentClients.map((c) => (
                  <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{c.full_name || c.email}</div>
                      <div className="text-xs text-gray-500">{c.business_name || 'No business'}</div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Open Tickets</CardTitle></CardHeader>
          <CardContent>
            {stats.recentTickets.length === 0 ? <p className="text-sm text-gray-500">No open tickets.</p> : (
              <div className="space-y-3">
                {stats.recentTickets.map((t) => (
                  <Link key={t.id} href={`/admin/tickets/${t.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{t.subject}</div>
                      <div className="text-xs text-gray-500">{t.clients?.full_name || 'Unknown client'}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
