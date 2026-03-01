import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

/**
 * Client purchases an add-on service.
 * Creates a Stripe Checkout session and records the addon in Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { serviceId } = body

    const supabase = await createServerSupabaseClient()

    // Get service details
    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('is_active', true)
      .single()

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    if (!service.stripe_price_id) {
      return NextResponse.json(
        { error: 'This service does not have pricing configured yet. Contact admin.' },
        { status: 400 }
      )
    }

    // Get client record
    const { data: client } = await supabase
      .from('clients')
      .select('id, stripe_customer_id, email, full_name')
      .eq('clerk_user_id', user.userId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client record not found' }, { status: 404 })
    }

    // Create addon record
    const { data: addon } = await supabase
      .from('client_addons')
      .insert({
        client_id: client.id,
        service_id: serviceId,
        status: 'pending',
      })
      .select()
      .single()

    // Ensure Stripe customer
    let stripeCustomerId = client.stripe_customer_id
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.full_name || undefined,
        metadata: { clerk_user_id: user.userId },
      })
      stripeCustomerId = customer.id

      await supabase
        .from('clients')
        .update({ stripe_customer_id: customer.id })
        .eq('id', client.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: service.stripe_price_id, quantity: 1 }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/addons?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/addons?canceled=true`,
      metadata: {
        client_id: client.id,
        payment_type: 'addon',
        addon_id: addon?.id || '',
        description: `Add-on: ${service.name}`,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Addon purchase error:', error)
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
