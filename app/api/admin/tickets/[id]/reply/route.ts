import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { content } = await request.json()
    const supabase = createAdminSupabaseClient()

    const { data: reply, error } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: params.id,
        sender_role: 'admin',
        sender_name: 'DGC Team',
        content,
      })
      .select()
      .single()

    if (error) console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', params.id)

    // Notify client
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('subject, clients(full_name, email)')
      .eq('id', params.id)
      .single()

    if (ticket?.clients?.email) {
      await sendEmail({
        to: ticket.clients.email,
        subject: `Reply on your ticket: ${ticket.subject}`,
        html: `<p>Hi ${ticket.clients.full_name || 'there'},</p><p>The DGC team replied to your ticket "<strong>${ticket.subject}</strong>":</p><blockquote>${content}</blockquote><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/support/${params.id}">View in your dashboard</a></p>`,
      }).catch(console.error)
    }

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
