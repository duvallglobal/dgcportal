import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .order('name')

    return NextResponse.json({ services: services || [] })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { serviceId, ...updates } = body

    const supabase = createAdminSupabaseClient()

    const allowedFields = ['description', 'tagline', 'capabilities', 'industries', 'category', 'is_active']
    const sanitized: Record<string, string | boolean | number> = {}
    for (const key of allowedFields) {
      if (key in updates) sanitized[key] = updates[key]
    }
    sanitized.updated_at = new Date().toISOString()

    const { data: service, error } = await supabase
      .from('services')
      .update(sanitized)
      .eq('id', serviceId)
      .select()
      .single()

    if (error) {
      console.error('API error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ service })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { name, description, category, price } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const supabase = createAdminSupabaseClient()

    // 1. Create Product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description: description || undefined,
    })

    // 2. Create Price in Stripe if provided
    let stripePriceId = null
    let priceAmount = null

    if (price && typeof price === 'number') {
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: price,
        currency: 'usd',
      })
      stripePriceId = stripePrice.id
      priceAmount = price
    }

    // 3. Create Service in Supabase
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        name,
        description,
        category: category || 'core',
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePriceId,
        price_amount: priceAmount,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('API error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ service })
  } catch (error: unknown) {
    console.error('POST /services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
