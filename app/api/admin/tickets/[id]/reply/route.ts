import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { content } = await request.json()
    const supabase = createAdminSupabaseClient()

    const { data: reply, error } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: id,
        sender_role: 'admin',
        sender_name: 'DGC Team',
        content,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })

    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', id)

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('subject, clients(full_name, email)')
      .eq('id', id)
      .single()

    if ((ticket?.clients as Record<string, string> | null)?.email) {
      const clients = ticket!.clients as Record<string, string>
      await sendEmail({
        to: clients.email,
        subject: `Reply on your ticket: ${ticket!.subject}`,
        html: `<p>Hi ${clients.full_name || 'there'},</p><p>The DGC team replied to your ticket "<strong>${ticket!.subject}</strong>":</p><blockquote>${content}</blockquote><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/support/${id}">View in your dashboard</a></p>`,
      }).catch(console.error)
    }

    return NextResponse.json({ reply })
  } catch (error: unknown) {
    console.error('Admin ticket reply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
