import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

/**
 * Client signs a service agreement.
 * Captures typed name, IP, timestamp, then redirects to Stripe Checkout for deposit.
 */
export async function POST(request: NextRequest) {
  try {
    const _user = await requireAuth()
    const body = await request.json()
    const { agreementId, signedName, consentChecked } = body

    if (!signedName || !consentChecked) {
      return NextResponse.json(
        { error: 'Signature name and consent are required' },
        { status: 400 }
      )
    }

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const supabase = await createServerSupabaseClient()

    // Get the agreement
    const { data: agreement, error } = await supabase
      .from('service_agreements')
      .select('*, clients!inner(stripe_customer_id, email, full_name)')
      .eq('id', agreementId)
      .single()

    if (error || !agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    if (agreement.status !== 'unsigned') {
      return NextResponse.json({ error: 'Agreement already signed' }, { status: 400 })
    }

    // Record signature
    await supabase
      .from('service_agreements')
      .update({
        status: 'signed_awaiting_deposit',
        signed_at: new Date().toISOString(),
        signature_data: JSON.stringify({
          signed_name: signedName,
          ip_address: clientIp,
          timestamp: new Date().toISOString(),
          user_agent: request.headers.get('user-agent') || 'unknown',
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreementId)

    // If deposit required, create Stripe checkout
    if (agreement.deposit_amount && agreement.deposit_amount > 0) {
      let stripeCustomerId = agreement.clients?.stripe_customer_id

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: agreement.clients?.email,
          name: agreement.clients?.full_name || undefined,
        })
        stripeCustomerId = customer.id
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
          client_id: agreement.client_id,
          payment_type: 'deposit',
          agreement_id: agreementId,
        },
      })

      return NextResponse.json({ redirect: session.url })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Agreement signing error:', error)
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
