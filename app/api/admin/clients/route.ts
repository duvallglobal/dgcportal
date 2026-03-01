import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { data: clients } = await supabase
      .from('clients')
      .select('id, full_name, email, business_name, onboarding_status, created_at')
      .order('created_at', { ascending: false })

    return NextResponse.json({ clients: clients || [] })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
