import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const [clientsRes, intakesRes, ticketsRes, agreementsRes] = await Promise.all([
      supabase.from('clients').select('id, full_name, email, business_name, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
      supabase.from('project_intakes').select('id', { count: 'exact' }).eq('status', 'submitted'),
      supabase.from('support_tickets').select('id, subject, status, priority, clients(full_name)', { count: 'exact' }).in('status', ['open', 'in_progress']).order('created_at', { ascending: false }).limit(5),
      supabase.from('service_agreements').select('id', { count: 'exact' }).in('status', ['deposit_paid', 'active']),
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
        .filter((c) => c.status === 'succeeded')
        .reduce((sum, c) => sum + c.amount, 0)
    } catch (e) {
      console.error('Stripe revenue fetch error:', e)
    }

    return NextResponse.json({
      totalClients: clientsRes.count || 0,
      activeProjects: agreementsRes.count || 0,
      pendingIntakes: intakesRes.count || 0,
      openTickets: ticketsRes.count || 0,
      revenueThisMonth,
      recentClients: clientsRes.data || [],
      recentTickets: ticketsRes.data || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
