import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { clientId, content, docType } = await request.json()

    const supabase = createAdminSupabaseClient()

    // Create a service agreement record with the generated content
    // The admin can configure DocuSeal templates separately
    const { data: agreement, error } = await supabase
      .from('service_agreements')
      .insert({
        client_id: clientId,
        status: 'unsigned',
        deposit_amount: null, // Admin sets this manually or from a follow-up step
      })
      .select()
      .single()

    if (error) {
      console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, agreementId: agreement.id })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
