import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id: cid } = await params
    const supabase = createAdminSupabaseClient()

    const [clientRes, intakesRes, agreementsRes, paymentsRes, ticketsRes, chatRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', cid).single(),
      supabase.from('project_intakes').select('*').eq('client_id', cid).order('created_at', { ascending: false }),
      supabase.from('service_agreements').select('*').eq('client_id', cid).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('client_id', cid).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('client_id', cid).order('created_at', { ascending: false }),
      supabase.from('chat_messages').select('id, role, content, created_at').eq('client_id', cid).order('created_at', { ascending: true }).limit(200),
    ])

    if (!clientRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      client: clientRes.data,
      intakes: intakesRes.data || [],
      agreements: agreementsRes.data || [],
      payments: paymentsRes.data || [],
      tickets: ticketsRes.data || [],
      chatMessages: chatRes.data || [],
    })
  } catch (error: unknown) {
    console.error('Admin client full error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
