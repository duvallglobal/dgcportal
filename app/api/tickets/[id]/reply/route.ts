import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { content } = await request.json()
    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase.from('clients').select('id, full_name, email').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, subject, client_id')
      .eq('id', id)
      .eq('client_id', client.id)
      .single()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const { data: reply, error } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: id,
        sender_role: 'client',
        sender_name: client.full_name,
        content,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })

    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', id)

    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@dfrmdgc.com',
      subject: `Reply on ticket: ${ticket.subject}`,
      html: `<p><strong>${client.full_name}</strong> replied to ticket "${ticket.subject}":</p><p>${content}</p>`,
    }).catch(console.error)

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    console.error('Ticket reply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
