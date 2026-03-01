import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { status } = await request.json()
    const supabase = createAdminSupabaseClient()

    const { data: ticket } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, clients(full_name, email)')
      .single()

    if ((ticket?.clients as Record<string, string> | null)?.email) {
      const clients = ticket!.clients as Record<string, string>
      await sendEmail({
        to: clients.email,
        subject: `Ticket Update: ${ticket!.subject}`,
        html: `<p>Hi ${clients.full_name || 'there'},</p><p>Your support ticket "<strong>${ticket!.subject}</strong>" has been updated to: <strong>${status.replace('_', ' ')}</strong></p><p>View it in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/support/${id}">dashboard</a>.</p>`,
      }).catch(console.error)
    }

    return NextResponse.json({ ticket })
  } catch (error: unknown) {
    console.error('Admin ticket status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
