import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const rating = searchParams.get('rating')

    let query = supabase
      .from('feedback_requests')
      .select('*, clients(full_name, business_name)')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    if (rating) query = query.eq('rating', parseInt(rating))

    const { data } = await query
    return NextResponse.json({ reviews: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
