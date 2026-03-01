import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .order('name')

    return NextResponse.json({ services: services || [] })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { serviceId, ...updates } = body

    const supabase = createAdminSupabaseClient()

    const allowedFields = ['description', 'tagline', 'capabilities', 'industries', 'category', 'is_active']
    const sanitized: Record<string, any> = {}
    for (const key of allowedFields) {
      if (key in updates) sanitized[key] = updates[key]
    }
    sanitized.updated_at = new Date().toISOString()

    const { data: service, error } = await supabase
      .from('services')
      .update(sanitized)
      .eq('id', serviceId)
      .select()
      .single()

    if (error) console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return NextResponse.json({ service })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
