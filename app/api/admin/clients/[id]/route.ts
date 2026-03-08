import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id: clientId } = await params
    const supabase = createAdminSupabaseClient()

    const [clientRes, intakeRes, agreementsRes, ticketsRes, invoicesRes, addonsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('project_intakes').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('service_agreements').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('client_addons').select('*, services(name)').eq('client_id', clientId),
    ])

    if (!clientRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      client: clientRes.data,
      intake: intakeRes.data || null,
      agreements: agreementsRes.data || [],
      tickets: ticketsRes.data || [],
      invoices: invoicesRes.data || [],
      addons: addonsRes.data || [],
    })
  } catch (error: unknown) {
    console.error('Admin client detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id: clientId } = await params
    const body = await request.json()
    const supabase = createAdminSupabaseClient()

    if (body.onboarding_status) {
      const { data, error } = await supabase
        .from('clients')
        .update({ onboarding_status: body.onboarding_status })
        .eq('id', clientId)
        .select()
        .single()

      if (error || !data) throw new Error('Failed to update client status')
      return NextResponse.json({ success: true, client: data })
    }

    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Admin client update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
