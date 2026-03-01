'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, LifeBuoy, DollarSign, Loader2, Search, Download, ChevronRight, Activity } from 'lucide-react'

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
  const [search, setSearch] = useState('')
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
    } catch (_err) { console.error(_err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredClients = clients.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.business_name?.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const headers = 'Name,Email,Business,Status,Created\n'
    const rows = clients.map((c) =>
      `"${c.full_name}","${c.email}","${c.business_name || ''}","${c.onboarding_status}","${new Date(c.created_at).toLocaleDateString()}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'dgc_clients.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  const statCards = [
    { label: 'Total Clients', value: stats?.totalClients ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Projects', value: stats?.activeProjects ?? 0, icon: Activity, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Intakes', value: stats?.pendingIntakes ?? 0, icon: FileText, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Open Tickets', value: stats?.openTickets ?? 0, icon: LifeBuoy, color: 'text-red-600 bg-red-50' },
    { label: 'Revenue (Month)', value: `$${((stats?.revenueThisMonth ?? 0) / 100).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}><s.icon className="h-5 w-5" /></div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Clients</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Business</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.business_name || '—'}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{c.onboarding_status}</Badge></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Link href={`/admin/clients/${c.id}`}><ChevronRight className="h-4 w-4 text-gray-400" /></Link></td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
