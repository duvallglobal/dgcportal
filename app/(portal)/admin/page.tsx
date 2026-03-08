'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, LifeBuoy, DollarSign, Loader2, ChevronRight, Activity, ArrowRight } from 'lucide-react'

interface DashboardStats {
  totalClients: number
  activeProjects: number
  pendingIntakes: number
  openTickets: number
  revenueThisMonth: number
}

interface Client {
  id: string
  full_name: string
  email: string
  business_name: string | null
  onboarding_status: string
  created_at: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, clientsRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/clients'),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Clients', value: stats?.totalClients ?? 0, icon: Users, color: 'text-[#1a1a2e] bg-[#e2b714]/10', href: '/admin/clients' },
    { label: 'Active Projects', value: stats?.activeProjects ?? 0, icon: Activity, color: 'text-[#1a1a2e] bg-[#e2b714]/10', href: '/admin/clients' },
    { label: 'Pending Intakes', value: stats?.pendingIntakes ?? 0, icon: FileText, color: 'text-amber-700 bg-amber-50', href: '/admin/clients' },
    { label: 'Open Tickets', value: stats?.openTickets ?? 0, icon: LifeBuoy, color: 'text-red-600 bg-red-50', href: '/admin/tickets' },
    { label: 'Revenue (Month)', value: `$${((stats?.revenueThisMonth ?? 0) / 100).toLocaleString()}`, icon: DollarSign, color: 'text-[#1a1a2e] bg-[#e2b714]/15', href: undefined },
  ]

  const recentClients = clients.slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#1a1a2e]">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => {
          const content = (
            <Card className={s.href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
              <CardContent className="pt-4 pb-4">
                <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </CardContent>
            </Card>
          )
          return s.href ? (
            <Link key={s.label} href={s.href}>{content}</Link>
          ) : (
            <div key={s.label}>{content}</div>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Clients</CardTitle>
          <Link
            href="/admin/clients"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentClients.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">No clients yet.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {recentClients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.full_name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.email}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{c.business_name || '\u2014'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{c.onboarding_status?.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients/${c.id}`}>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
