import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { agreementId } = body

    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase
      .from('clients')
      .select('id, stripe_customer_id, email, full_name')
      .eq('clerk_user_id', user.userId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: agreement } = await supabase
      .from('service_agreements')
      .select('*')
      .eq('id', agreementId)
      .eq('client_id', client.id)
      .eq('status', 'signed_awaiting_deposit')
      .single()

    if (!agreement || !agreement.deposit_amount) {
      return NextResponse.json({ error: 'No deposit required or agreement not found' }, { status: 400 })
    }

    let stripeCustomerId = client.stripe_customer_id
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.full_name || undefined,
        metadata: { clerk_user_id: user.userId },
      })
      stripeCustomerId = customer.id
      await supabase.from('clients').update({ stripe_customer_id: customer.id }).eq('id', client.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Service Agreement Deposit' },
          unit_amount: agreement.deposit_amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/agreement?signed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/agreement?canceled=true`,
      metadata: {
        client_id: client.id,
        payment_type: 'deposit',
        agreement_id: agreementId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
