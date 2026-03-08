import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { token, clientId, rating, review, comment, testimonial_permission } = await request.json()
    const supabase = createAdminSupabaseClient()

    // Dashboard submission (authenticated)
    if (clientId && !token) {
      const { userId } = await auth()
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      // Verify the client belongs to the user
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('clerk_user_id', userId)
        .eq('id', clientId)
        .single()

      if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      // Create a direct completed review
      await supabase.from('feedback_reviews').insert({
        client_id: clientId,
        token: crypto.randomUUID(), // Schema requires unique token
        rating,
        review_text: comment || review || null,
        allow_testimonial: testimonial_permission || false,
        submitted_at: new Date().toISOString(),
      })

      return NextResponse.json({ success: true })
    }

    // Public token submission
    if (!token || !rating) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: feedback } = await supabase
      .from('feedback_reviews')
      .select('id, client_id')
      .eq('token', token)
      .is('rating', null)
      .single()

    if (!feedback) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })

    await supabase.from('feedback_reviews').update({
      rating,
      review_text: review || comment || null,
      allow_testimonial: testimonial_permission || false,
      submitted_at: new Date().toISOString(),
    }).eq('id', feedback.id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
