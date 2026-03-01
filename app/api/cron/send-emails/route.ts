import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

// Vercel Cron: runs every hour to send scheduled emails
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/send-emails", "schedule": "0 * * * *" }] }

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminSupabaseClient()
    const now = new Date().toISOString()

    const { data: emails } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('send_at', now)
      .limit(50)

    if (!emails || emails.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    let sent = 0
    for (const email of emails) {
      try {
        await sendEmail({ to: email.to_email, subject: email.subject, html: email.html })
        await supabase.from('scheduled_emails').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', email.id)
        sent++
      } catch (err) {
        await supabase.from('scheduled_emails').update({ status: 'failed', error: String(err) }).eq('id', email.id)
      }
    }

    return NextResponse.json({ sent })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
