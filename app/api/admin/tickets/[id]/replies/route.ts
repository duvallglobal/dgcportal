import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = createAdminSupabaseClient()

    const { data: replies } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ replies: replies || [] })
  } catch (error: unknown) {
    console.error('Admin ticket replies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
