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
      return NextResponse.json({ agreements: [] })
    }

    const { data: agreements } = await supabase
      .from('service_agreements')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ agreements: agreements || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
