import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CreditCard, LifeBuoy, FileSignature } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createServerSupabaseClient()

  // Get client record
  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, business_name')
    .eq('clerk_user_id', user.userId)
    .single()

  // Get counts
  const clientId = client?.id
  const [intakes, agreements, tickets, payments] = await Promise.all([
    clientId ? supabase.from('project_intakes').select('id, status', { count: 'exact' }).eq('client_id', clientId) : { count: 0 },
    clientId ? supabase.from('service_agreements').select('id, status', { count: 'exact' }).eq('client_id', clientId) : { count: 0 },
    clientId ? supabase.from('support_tickets').select('id, status', { count: 'exact' }).eq('client_id', clientId).in('status', ['open', 'in_progress']) : { count: 0 },
    clientId ? supabase.from('payments').select('id, amount', { count: 'exact' }).eq('client_id', clientId).eq('status', 'succeeded') : { count: 0 },
  ])

  const cards = [
    { title: 'Project Intakes', value: intakes.count || 0, icon: FileText, href: '/dashboard/intake', color: 'text-blue-600' },
    { title: 'Agreements', value: agreements.count || 0, icon: FileSignature, href: '/dashboard/agreement', color: 'text-green-600' },
    { title: 'Open Tickets', value: tickets.count || 0, icon: LifeBuoy, href: '/dashboard/support', color: 'text-orange-600' },
    { title: 'Payments', value: payments.count || 0, icon: CreditCard, href: '/dashboard/billing', color: 'text-purple-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back{client?.full_name ? `, ${client.full_name.split(' ')[0]}` : ''}!</h1>
        <p className="text-gray-500 mt-1">{client?.business_name || 'Your DGC Client Portal'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/dashboard/intake" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Start Project Intake</div>
                <div className="text-xs text-gray-500">Tell us about your business</div>
              </div>
            </Link>
            <Link href="/dashboard/support/new" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <LifeBuoy className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-sm">Open Support Ticket</div>
                <div className="text-xs text-gray-500">Get help from our team</div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Our AI assistant can answer questions about your projects, billing, and DGC services.</p>
            <Link href="/dashboard/chat" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
              Start a conversation →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
