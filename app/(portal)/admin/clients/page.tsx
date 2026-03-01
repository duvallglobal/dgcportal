'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Download, Loader2, ChevronRight, Wand2 } from 'lucide-react'

interface Client {
  id: string
  full_name: string | null
  email: string
  business_name: string | null
  phone: string | null
  created_at: string
  intake_status: string | null
  agreement_status: string | null
  open_tickets: number
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filtered, setFiltered] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
        setFiltered(data.clients || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(clients.filter((c) =>
      (c.full_name || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.business_name || '').toLowerCase().includes(q)
    ))
  }, [search, clients])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/clients/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dgc-clients-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-gray-500 mt-1">{clients.length} total clients</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Export CSV
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or business..." className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Users className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No clients found.</p></CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-gray-500">Name</th>
                <th className="pb-3 font-medium text-gray-500">Business</th>
                <th className="pb-3 font-medium text-gray-500">Email</th>
                <th className="pb-3 font-medium text-gray-500">Intake</th>
                <th className="pb-3 font-medium text-gray-500">Agreement</th>
                <th className="pb-3 font-medium text-gray-500">Tickets</th>
                <th className="pb-3 font-medium text-gray-500">Joined</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium">{client.full_name || '—'}</td>
                  <td className="py-3">{client.business_name || '—'}</td>
                  <td className="py-3 text-gray-600">{client.email}</td>
                  <td className="py-3">{client.intake_status ? <Badge variant="outline" className="text-xs">{client.intake_status}</Badge> : '—'}</td>
                  <td className="py-3">{client.agreement_status ? <Badge variant="outline" className="text-xs">{client.agreement_status}</Badge> : '—'}</td>
                  <td className="py-3">{client.open_tickets > 0 ? <Badge className="bg-red-100 text-red-700 text-xs">{client.open_tickets}</Badge> : '0'}</td>
                  <td className="py-3 text-gray-400 text-xs">{new Date(client.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Link href={`/admin/clients/${client.id}`}>
                        <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                      </Link>
                      <Link href={`/admin/clients/${client.id}/generate`}>
                        <Button variant="ghost" size="sm" title="AI Generate"><Wand2 className="h-4 w-4 text-purple-500" /></Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
