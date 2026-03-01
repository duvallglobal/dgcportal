import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase.from('clients').select('id').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ tickets: [] })

    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, subject, status, priority, created_at, updated_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ tickets: tickets || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase.from('clients').select('id, full_name, email').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const formData = await request.formData()
    const subject = formData.get('subject') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string || 'medium'
    const attachment = formData.get('attachment') as File | null

    let attachmentUrl: string | null = null
    if (attachment && attachment.size > 0) {
      const ext = attachment.name.split('.').pop()
      const path = `tickets/${client.id}/${Date.now()}.${ext}`
      const { data: uploaded } = await supabase.storage.from('ticket-attachments').upload(path, attachment)
      if (uploaded) {
        const { data: urlData } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
        attachmentUrl = urlData.publicUrl
      }
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        client_id: client.id,
        subject,
        description,
        priority,
        status: 'open',
        attachment_url: attachmentUrl,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@dfrmdgc.com',
      subject: `New Support Ticket: ${subject}`,
      html: `<p><strong>${client.full_name}</strong> (${client.email}) opened a new ticket.</p><p><strong>Priority:</strong> ${priority}</p><p><strong>Description:</strong></p><p>${description}</p>`,
    }).catch(console.error)

    return NextResponse.json({ ticket })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
