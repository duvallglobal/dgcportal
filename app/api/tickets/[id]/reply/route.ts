import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { content } = await request.json()
    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase.from('clients').select('id, full_name, email').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Verify ticket belongs to client
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, subject, client_id')
      .eq('id', params.id)
      .eq('client_id', client.id)
      .single()

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const { data: reply, error } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: params.id,
        sender_role: 'client',
        sender_name: client.full_name,
        content,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update ticket timestamp
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', params.id)

    // Notify admin of new reply
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@dfrmdgc.com',
      subject: `Reply on ticket: ${ticket.subject}`,
      html: `<p><strong>${client.full_name}</strong> replied to ticket "${ticket.subject}":</p><p>${content}</p>`,
    }).catch(console.error)

    return NextResponse.json({ reply })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
