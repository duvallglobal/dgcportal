import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// ─── GET /api/admin/services ─────────────────────────────────────────────────
// Returns all services from Supabase, with Stripe feature metadata attached
export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .order('name')

    if (!services?.length) return NextResponse.json({ services: [] })

    // Attach Stripe product features for each service that has a stripe_product_id
    const servicesWithFeatures = await Promise.all(
      services.map(async (svc) => {
        if (!svc.stripe_product_id) return { ...svc, stripe_features: [] }
        try {
          const features = await stripe.products.listFeatures(svc.stripe_product_id)
          return { ...svc, stripe_features: features.data }
        } catch {
          return { ...svc, stripe_features: [] }
        }
      })
    )

    return NextResponse.json({ services: servicesWithFeatures })
  } catch (error: unknown) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/admin/services ──────────────────────────────────────────────────
// Update service metadata. Optionally syncs a `features` string[] to Stripe.
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { serviceId, features, ...updates } = body

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
      console.error('API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Sync Stripe product features if provided and product exists
    if (Array.isArray(features) && service.stripe_product_id) {
      await syncStripeFeatures(service.stripe_product_id, features)
    }

    return NextResponse.json({ service })
  } catch (error: unknown) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/services ─────────────────────────────────────────────────
// Create a new service. Accepts optional `features` string[] for Stripe features.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { name, description, category, price, features } = await request.json()
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

    // 3. Attach product features in Stripe if provided
    if (Array.isArray(features) && features.length > 0) {
      await syncStripeFeatures(stripeProduct.id, features)
    }

    // 4. Create Service in Supabase
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
      console.error('API error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ service })
  } catch (error: unknown) {
    console.error('POST /services error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Syncs a list of feature names to a Stripe product.
 * Removes any existing features not in the new list,
 * and creates any new features not already attached.
 */
async function syncStripeFeatures(productId: string, featureNames: string[]) {
  try {
    // Fetch existing product-feature links
    const existing = await stripe.products.listFeatures(productId)

    // ProductFeature references an entitlement feature — extract the lookup_key for comparison
    const existingLookupKeys = new Set(
      existing.data
        .map((f) => f.entitlement_feature?.lookup_key)
        .filter((k): k is string => Boolean(k))
    )
    const desiredLookupKeys = new Set(
      featureNames
        .map((f) => f.trim().toLowerCase().replace(/\s+/g, '_'))
        .filter(Boolean)
    )

    // Remove product-feature links not in the desired set
    for (const feature of existing.data) {
      const lk = feature.entitlement_feature?.lookup_key
      if (lk && !desiredLookupKeys.has(lk)) {
        // deleteFeature removes the link between the product and the entitlement feature
        await stripe.products.deleteFeature(productId, feature.id)
      }
    }

    // Attach desired features not already linked
    for (const name of featureNames) {
      const lookupKey = name.trim().toLowerCase().replace(/\s+/g, '_')
      if (!lookupKey || existingLookupKeys.has(lookupKey)) continue

      let featureId: string
      try {
        const found = await stripe.entitlements.features.list({ lookup_key: lookupKey })
        if (found.data.length > 0) {
          featureId = found.data[0].id
        } else {
          const created = await stripe.entitlements.features.create({
            name: name.trim(),
            lookup_key: lookupKey,
          })
          featureId = created.id
        }
      } catch {
        const created = await stripe.entitlements.features.create({
          name: name.trim(),
          lookup_key: lookupKey,
        })
        featureId = created.id
      }

      await stripe.products.createFeature(productId, { entitlement_feature: featureId })
    }
  } catch (err) {
    console.error('syncStripeFeatures error:', err)
    // Non-fatal — log but don't block the service creation
  }
}
