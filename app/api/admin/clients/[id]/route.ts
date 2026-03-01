import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()
    const clientId = params.id

    const [clientRes, intakeRes, agreementsRes, ticketsRes, invoicesRes, addonsRes, inventoryRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('project_intakes').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('agreements').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('client_addons').select('*, services(name)').eq('client_id', clientId),
      supabase.from('content_inventory').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    ])

    if (!clientRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      client: clientRes.data,
      intake: intakeRes.data || null,
      agreements: agreementsRes.data || [],
      tickets: ticketsRes.data || [],
      invoices: invoicesRes.data || [],
      addons: addonsRes.data || [],
      inventory: inventoryRes.data || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
