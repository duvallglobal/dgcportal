import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { data: settings } = await supabase
      .from('ai_settings')
      .select('*')
      .order('tool_name')

    return NextResponse.json({ settings: settings || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { tool_name, model_id, display_name, temperature, max_tokens, system_prompt } = body

    const supabase = createAdminSupabaseClient()

    const { error } = await supabase
      .from('ai_settings')
      .update({
        model_id,
        display_name,
        temperature,
        max_tokens,
        system_prompt,
        updated_at: new Date().toISOString(),
      })
      .eq('tool_name', tool_name)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
