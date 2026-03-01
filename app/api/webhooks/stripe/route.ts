import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const clientId = session.metadata?.client_id
      const paymentType = session.metadata?.payment_type

      if (clientId) {
        // Record payment
        await supabase.from('payments').insert({
          client_id: clientId,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          status: 'succeeded',
          payment_type: paymentType || 'one_time',
          description: session.metadata?.description || 'Payment',
        })

        // If this is a deposit payment, update agreement status
        if (paymentType === 'deposit') {
          await supabase
            .from('service_agreements')
            .update({ status: 'deposit_paid', stripe_payment_id: session.payment_intent as string })
            .eq('client_id', clientId)
            .eq('status', 'signed_awaiting_deposit')
        }

        // If this is an addon purchase
        if (paymentType === 'addon' && session.metadata?.addon_id) {
          await supabase
            .from('client_addons')
            .update({ status: 'paid', stripe_payment_id: session.payment_intent as string })
            .eq('id', session.metadata.addon_id)
        }

        // Send receipt email
        const { data: client } = await supabase
          .from('clients')
          .select('email, full_name')
          .eq('id', clientId)
          .single()

        if (client?.email) {
          await sendEmail({
            to: client.email,
            subject: 'Payment Confirmation - DGC Portal',
            html: `<h2>Payment Received</h2><p>Hi ${client.full_name || 'there'},</p><p>We've received your payment of $${((session.amount_total || 0) / 100).toFixed(2)}.</p><p>Thank you for your business!</p><p>— DG Consulting</p>`,
          })
        }
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: client } = await supabase
        .from('clients')
        .select('id, email, full_name')
        .eq('stripe_customer_id', customerId)
        .single()

      if (client) {
        await supabase.from('payments').insert({
          client_id: client.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          payment_type: 'subscription',
          description: `Subscription payment - ${invoice.lines.data[0]?.description || 'Monthly'}`,
        })

        if (client.email) {
          await sendEmail({
            to: client.email,
            subject: 'Subscription Payment Received - DGC Portal',
            html: `<h2>Subscription Payment</h2><p>Hi ${client.full_name || 'there'},</p><p>Your subscription payment of $${(invoice.amount_paid / 100).toFixed(2)} has been processed.</p><p>— DG Consulting</p>`,
          })
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: client } = await supabase
        .from('clients')
        .select('id, email, full_name')
        .eq('stripe_customer_id', customerId)
        .single()

      if (client) {
        await supabase.from('payments').insert({
          client_id: client.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          payment_type: 'subscription',
          description: 'Subscription payment failed',
        })

        if (client.email) {
          await sendEmail({
            to: client.email,
            subject: 'Payment Failed - Action Required - DGC Portal',
            html: `<h2>Payment Failed</h2><p>Hi ${client.full_name || 'there'},</p><p>Your subscription payment of $${(invoice.amount_due / 100).toFixed(2)} failed. Please update your payment method in your billing dashboard.</p><p>— DG Consulting</p>`,
          })
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (client) {
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'canceled',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
