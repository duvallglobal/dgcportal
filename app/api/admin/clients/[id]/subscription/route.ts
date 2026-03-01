import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const supabase = createAdminSupabaseClient()

    const { data: client } = await supabase.from('clients').select('stripe_customer_id').eq('id', id).single()
    if (!client?.stripe_customer_id) return NextResponse.json({ subscription: null })

    const subs = await stripe.subscriptions.list({ customer: client.stripe_customer_id, limit: 1 })
    const sub = subs.data[0] || null

    return NextResponse.json({
      subscription: sub ? {
        id: sub.id,
        status: sub.status,
        plan_name: (sub.items.data[0]?.price?.product as Record<string, unknown>)?.name || null,
        amount: sub.items.data[0]?.price?.unit_amount || 0,
      } : null,
    })
  } catch (error: unknown) {
    console.error('Admin subscription GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { priceId } = await request.json()
    const supabase = createAdminSupabaseClient()

    const { data: client } = await supabase.from('clients').select('stripe_customer_id, email, full_name').eq('id', id).single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    let customerId = client.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email: client.email, name: client.full_name })
      customerId = customer.id
      await supabase.from('clients').update({ stripe_customer_id: customerId }).eq('id', id)
    }

    const existing = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 10 })
    for (const sub of existing.data) {
      await stripe.subscriptions.cancel(sub.id)
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    })

    return NextResponse.json({ subscriptionId: subscription.id })
  } catch (error: unknown) {
    console.error('Admin subscription POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
