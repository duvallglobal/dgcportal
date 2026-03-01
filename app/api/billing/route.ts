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

    if (!client) {
      return NextResponse.json({ payments: [], subscriptions: [] })
    }

    const [paymentsRes, subsRes] = await Promise.all([
      supabase.from('payments').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      payments: paymentsRes.data || [],
      subscriptions: subsRes.data || [],
    })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
