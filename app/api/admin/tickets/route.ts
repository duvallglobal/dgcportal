import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') === 'asc'

    let query = supabase
      .from('support_tickets')
      .select('*, clients(full_name, email, business_name)')

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    query = query.order(sort, { ascending: order })

    const { data: tickets } = await query

    return NextResponse.json({ tickets: tickets || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
