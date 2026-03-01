import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { data: clients } = await supabase
      .from('clients')
      .select('id, full_name, email, business_name, phone, created_at')
      .order('created_at', { ascending: false })

    if (!clients) return NextResponse.json({ clients: [] })

    const enriched = await Promise.all(
      clients.map(async (client) => {
        const [intakeRes, agreementRes, ticketRes] = await Promise.all([
          supabase.from('project_intakes').select('status').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1),
          supabase.from('service_agreements').select('status').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1),
          supabase.from('support_tickets').select('id', { count: 'exact' }).eq('client_id', client.id).in('status', ['open', 'in_progress']),
        ])
        return {
          ...client,
          intake_status: intakeRes.data?.[0]?.status || null,
          agreement_status: agreementRes.data?.[0]?.status || null,
          open_tickets: ticketRes.count || 0,
        }
      })
    )

    return NextResponse.json({ clients: enriched })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
