import { NextRequest, NextResponse } from 'next/server'
import { createElement } from 'react'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { AdminAgreementSigned } from '@/emails/AdminAgreementSigned'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dgc.today'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dgc.today'

/**
 * DocuSeal webhook handler.
 * Fires when a document is signed via the DocuSeal embedded form.
 * Updates the agreement status, stores the signed PDF URL, and notifies the admin.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_type, data } = body

    if (event_type !== 'submission.completed') {
      return NextResponse.json({ received: true })
    }

    const submissionId = String(data.id)
    const signedPdfUrl = data.documents?.[0]?.url || null

    const supabase = createAdminSupabaseClient()

    // Fetch agreement along with client_id to look up the profile
    const { data: agreement } = await supabase
      .from('service_agreements')
      .select('id, deposit_amount, client_id')
      .eq('docuseal_submission_id', submissionId)
      .single()

    if (!agreement) {
      console.warn('DocuSeal webhook: no matching agreement for submission', submissionId)
      return NextResponse.json({ received: true })
    }

    const newStatus = agreement.deposit_amount && agreement.deposit_amount > 0
      ? 'signed_awaiting_deposit'
      : 'active'

    const signedAt = new Date().toISOString()

    await supabase
      .from('service_agreements')
      .update({
        status: newStatus,
        signed_pdf_url: signedPdfUrl,
        signed_at: signedAt,
        updated_at: signedAt,
      })
      .eq('id', agreement.id)

    // ── Admin notification ────────────────────────────────────────────────────
    try {
      // Fetch the client profile so we can include the name/email in the email
      const { data: profile } = await supabase
        .from('client_profiles')
        .select('full_name, email')
        .eq('id', agreement.client_id)
        .single()

      const clientName = profile?.full_name || 'Unknown Client'
      const clientEmail = profile?.email || 'unknown@unknown.com'
      const adminUrl = `${APP_URL}/admin/clients/${agreement.client_id}`

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `✅ Agreement Signed — ${clientName} (awaiting ${agreement.deposit_amount ? 'deposit' : 'activation'})`,
        react: createElement(AdminAgreementSigned, {
          clientName,
          clientEmail,
          agreementId: agreement.id,
          signedAt,
          depositAmount: agreement.deposit_amount,
          signedPdfUrl,
          adminUrl,
        }),
      })
    } catch (emailError) {
      // Non-fatal — log but don't fail the webhook response
      console.error('DocuSeal webhook: failed to send admin notification email', emailError)
    }
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('DocuSeal webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

