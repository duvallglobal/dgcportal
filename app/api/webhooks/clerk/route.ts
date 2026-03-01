import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name: string | null
    last_name: string | null
    public_metadata: { role?: string }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const svixId = request.headers.get('svix-id') || ''
  const svixTimestamp = request.headers.get('svix-timestamp') || ''
  const svixSignature = request.headers.get('svix-signature') || ''

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dgc.today'

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, public_metadata } = event.data
    const email = email_addresses[0]?.email_address || ''
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
    const role = public_metadata?.role || 'client'

    await supabase.from('clients').upsert(
      {
        clerk_user_id: id,
        email,
        full_name: fullName,
        role,
      },
      { onConflict: 'clerk_user_id' }
    )

    await sendEmail({
      to: adminEmail,
      subject: `New Client Sign-Up: ${fullName || email}`,
      html: `<h2>New Client Registration</h2><p><strong>Name:</strong> ${fullName || 'Not provided'}</p><p><strong>Email:</strong> ${email}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clients">View in Admin Panel</a></p>`,
    })
  }

  if (event.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, public_metadata } = event.data
    const email = email_addresses[0]?.email_address || ''
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || null
    const role = public_metadata?.role || 'client'

    await supabase
      .from('clients')
      .update({ email, full_name: fullName, role, updated_at: new Date().toISOString() })
      .eq('clerk_user_id', id)
  }

  if (event.type === 'user.deleted') {
    const { id } = event.data
    await supabase.from('clients').delete().eq('clerk_user_id', id)
  }

  return NextResponse.json({ received: true })
}
