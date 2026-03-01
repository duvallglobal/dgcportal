import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { priceId, mode, clientId, paymentType, description, addonId } = body

    const supabase = await createServerSupabaseClient()

    // Get or create Stripe customer
    const { data: client } = await supabase
      .from('clients')
      .select('stripe_customer_id, email, full_name')
      .eq('clerk_user_id', user.userId)
      .single()

    let stripeCustomerId = client?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client?.email || user.email,
        name: client?.full_name || undefined,
        metadata: { clerk_user_id: user.userId },
      })
      stripeCustomerId = customer.id

      await supabase
        .from('clients')
        .update({ stripe_customer_id: customer.id })
        .eq('clerk_user_id', user.userId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode || 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        client_id: clientId || '',
        payment_type: paymentType || 'one_time',
        description: description || '',
        addon_id: addonId || '',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
