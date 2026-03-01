import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const [clientsRes, intakesRes, ticketsRes, projectsRes] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('project_intakes').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
      supabase.from('agreements').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    // Revenue this month from Stripe
    let revenueThisMonth = 0
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const charges = await stripe.charges.list({
        created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
        limit: 100,
      })
      revenueThisMonth = charges.data
        .filter((c) => c.paid && !c.refunded)
        .reduce((sum, c) => sum + c.amount, 0)
    } catch (e) {
      // Stripe may not be configured yet
    }

    return NextResponse.json({
      totalClients: clientsRes.count || 0,
      activeProjects: projectsRes.count || 0,
      pendingIntakes: intakesRes.count || 0,
      openTickets: ticketsRes.count || 0,
      revenueThisMonth,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
