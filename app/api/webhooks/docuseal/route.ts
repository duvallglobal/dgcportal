import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * DocuSeal webhook handler.
 * Fires when a document is signed via the DocuSeal embedded form.
 * Updates the agreement status and stores the signed PDF URL.
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

    const { data: agreement } = await supabase
      .from('service_agreements')
      .select('id, deposit_amount')
      .eq('docuseal_submission_id', submissionId)
      .single()

    if (!agreement) {
      console.warn('DocuSeal webhook: no matching agreement for submission', submissionId)
      return NextResponse.json({ received: true })
    }

    const newStatus = agreement.deposit_amount && agreement.deposit_amount > 0
      ? 'signed_awaiting_deposit'
      : 'active'

    await supabase
      .from('service_agreements')
      .update({
        status: newStatus,
        signed_pdf_url: signedPdfUrl,
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreement.id)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('DocuSeal webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
