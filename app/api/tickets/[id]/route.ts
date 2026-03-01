import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase.from('clients').select('id').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', params.id)
      .eq('client_id', client.id)
      .single()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const { data: replies } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ ticket: { ...ticket, replies: replies || [] } })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
