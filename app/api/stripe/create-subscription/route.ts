import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

/**
 * Admin-only: assign a recurring subscription to a client.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { clientId, priceId } = body

    const supabase = createAdminSupabaseClient()

    const { data: client } = await supabase
      .from('clients')
      .select('stripe_customer_id, email, full_name')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    let stripeCustomerId = client.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.full_name || undefined,
      })
      stripeCustomerId = customer.id

      await supabase
        .from('clients')
        .update({ stripe_customer_id: customer.id })
        .eq('id', clientId)
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    // Record in Supabase
    await supabase.from('subscriptions').insert({
      client_id: clientId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })

    return NextResponse.json({ subscription })
  } catch (error: unknown) {
    console.error('Subscription creation error:', error)
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
