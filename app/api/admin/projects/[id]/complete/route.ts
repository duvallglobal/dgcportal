import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = createAdminSupabaseClient()

    await supabase.from('agreements').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', id)

    const { data: agreement } = await supabase
      .from('agreements')
      .select('client_id, service_name, clients(email, full_name)')
      .eq('id', id)
      .single()

    if (!agreement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const token = crypto.randomBytes(32).toString('hex')
    const sendAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const clients = agreement.clients as Record<string, string> | null

    await supabase.from('feedback_requests').insert({
      client_id: agreement.client_id,
      agreement_id: id,
      token,
      status: 'pending',
    })

    await supabase.from('scheduled_emails').insert({
      to_email: clients?.email,
      subject: 'How was your experience with DGC?',
      html: `<p>Hi ${clients?.full_name || 'there'},</p><p>Your project "<strong>${agreement.service_name || 'your project'}</strong>" has been completed! We&apos;d love to hear your feedback.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/feedback/${token}" style="display:inline-block;padding:12px 24px;background:#e2b714;color:#1a1a2e;border-radius:6px;text-decoration:none;font-weight:bold;">Leave Feedback</a></p><p>Thank you for choosing DGC!</p>`,
      send_at: sendAt,
      status: 'pending',
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Project complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
