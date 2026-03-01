import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { serviceId, amount } = await request.json()

    const supabase = createAdminSupabaseClient()

    const { data: service } = await supabase
      .from('services')
      .select('stripe_product_id, stripe_price_id')
      .eq('id', serviceId)
      .single()

    if (!service?.stripe_product_id) {
      return NextResponse.json({ error: 'No Stripe product linked to this service' }, { status: 400 })
    }

    // Archive old price if exists
    if (service.stripe_price_id) {
      try {
        await stripe.prices.update(service.stripe_price_id, { active: false })
      } catch (_e) {
        // Old price might not exist, continue
      }
    }

    // Create new price
    const price = await stripe.prices.create({
      product: service.stripe_product_id,
      unit_amount: amount,
      currency: 'usd',
    })

    // Update Supabase
    await supabase
      .from('services')
      .update({
        stripe_price_id: price.id,
        price_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId)

    return NextResponse.json({ stripePriceId: price.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
