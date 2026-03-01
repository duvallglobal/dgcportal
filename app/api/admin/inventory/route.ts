import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('client_id')

    let query = supabase.from('content_inventory').select('*, clients(full_name, business_name)').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    if (clientId) query = query.eq('client_id', clientId)

    const { data } = await query
    return NextResponse.json({ products: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const { productId, status, admin_notes } = await request.json()
    const supabase = createAdminSupabaseClient()

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (admin_notes !== undefined) updates.admin_notes = admin_notes

    const { data, error } = await supabase.from('content_inventory').update(updates).eq('id', productId).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ product: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
