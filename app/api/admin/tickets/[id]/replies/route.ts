import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { data: replies } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ replies: replies || [] })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
