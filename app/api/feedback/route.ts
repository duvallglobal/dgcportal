import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { token, rating, review, testimonial_permission } = await request.json()
    if (!token || !rating) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = createAdminSupabaseClient()

    const { data: feedback } = await supabase
      .from('feedback_requests')
      .select('id, client_id, status')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (!feedback) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })

    await supabase.from('feedback_requests').update({
      rating,
      review: review || null,
      testimonial_permission: testimonial_permission || false,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', feedback.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
