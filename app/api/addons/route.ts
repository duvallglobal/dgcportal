import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('clerk_user_id', user.userId)
      .single()

    const [servicesRes, purchasedRes] = await Promise.all([
      supabase.from('services').select('*').eq('is_active', true).order('name'),
      client
        ? supabase.from('client_addons').select('*').eq('client_id', client.id)
        : { data: [] },
    ])

    return NextResponse.json({
      services: servicesRes.data || [],
      purchased: purchasedRes.data || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
