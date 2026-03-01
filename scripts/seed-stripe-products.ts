#!/usr/bin/env npx tsx
/**
 * Stripe Product Seed Script
 * Usage:
 *   npx tsx scripts/seed-stripe-products.ts --test   # Uses STRIPE_TEST_SECRET_KEY
 *   npx tsx scripts/seed-stripe-products.ts --live   # Uses STRIPE_SECRET_KEY (production)
 *
 * Idempotent: skips products that already exist (matched by name).
 * Does NOT create prices — admin sets those from /admin/services.
 * Stores returned Stripe product_id in the Supabase services table.
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const isLive = args.includes('--live')
const isTest = args.includes('--test') || !isLive

const stripeKey = isLive
  ? process.env.STRIPE_SECRET_KEY
  : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY

if (!stripeKey) {
  console.error('❌ Missing Stripe key. Set STRIPE_SECRET_KEY or STRIPE_TEST_SECRET_KEY in .env')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log(`\n🔑 Mode: ${isLive ? '🔴 LIVE' : '🟡 TEST'}`)
console.log(`🔗 Stripe key: ${stripeKey.slice(0, 12)}...\n`)

const products = [
  {
    name: 'Website Development',
    description: 'High-performance websites and custom web applications built from the ground up — no templates, no shortcuts. Optimized for speed, search visibility, and lead conversion across every device.',
    metadata: {
      tagline: 'Engineered to Convert',
      capabilities: 'Performance-first engineering, Bespoke architecture, Search-engine readiness, Conversion-centric tools, Strategic CTAs, Future-proof scalability',
      industries: 'Hair Salons & Spas, Restaurants, Cleaning Services, Home Services, Real Estate, E-commerce, Legal Services, Thrift Stores & Resellers, Events & Entertainment, Fitness Studios, Auto Repair, Dental Practices',
    },
  },
  {
    name: 'AI Automation',
    description: 'AI-powered automation eliminates repetitive manual tasks across lead management, customer communication, billing, and operations. Every workflow runs without human intervention — from first contact to closed deal.',
    metadata: {
      tagline: 'Intelligent Systems That Scale Operations',
      capabilities: 'Lead response automation, Lead qualification scoring, Automated follow-up sequences, CRM data logging, Trigger-based actions, System syncing, Appointment booking, Billing automation, Re-engagement campaigns, Pipeline visibility dashboards',
      industries: 'Hair Salons & Spas, Restaurants, Cleaning Services, Home Services, Real Estate, E-commerce, Legal Services, Thrift Stores & Resellers, Events & Entertainment, Fitness Studios, Auto Repair, Dental Practices',
    },
  },
  {
    name: 'E-commerce Solutions',
    description: 'List once, sell everywhere. Multi-platform automation syncs inventory across 7+ marketplaces in real-time, while AI cuts listing time from 20 minutes to 30 seconds.',
    metadata: {
      tagline: 'Sell More, Everywhere',
      capabilities: 'Multi-channel listing (eBay, Poshmark, Mercari, Shopify, Facebook Marketplace, Etsy, Amazon, TikTok Shop), Real-time inventory sync, AI-powered listings, Unified order management, Dynamic pricing rules, Bulk operations, Cross-platform analytics, Automated customer messaging, Shipping integration, Returns management, Custom storefronts, B2B & wholesale capabilities',
      industries: 'Thrift Stores & Resellers, Retail Boutiques, E-commerce Sellers',
    },
  },
  {
    name: 'Custom App Development',
    description: 'Full-stack custom applications tailored to exact workflows — from AI-powered booking systems and CRMs to client portals and automated invoicing platforms.',
    metadata: {
      tagline: 'Built for Your Business',
      capabilities: 'Custom booking systems, Lead management CRM, Client portals, Automated invoicing, Quote generation, AI-powered chatbots, Third-party integrations, Workflow automation, Real-time dashboards, Mobile applications, Document management, API development',
      industries: 'Hair Salons & Spas, Cleaning Services, Legal Services, Healthcare, Events & Entertainment, Professional Services',
    },
  },
  {
    name: 'SEO & Paid Advertising',
    description: 'Dominate search results organically and through paid ads. From Google Business Profile optimization to precision-targeted ad campaigns with monthly ROI tracking.',
    metadata: {
      tagline: 'Get Found. Get Clicks. Get Customers.',
      capabilities: 'Google Business Profile optimization, On-page SEO, Technical SEO, Google Ads campaigns, Facebook & Instagram Ads, Retargeting campaigns, Local SEO, Keyword research, Content strategy, Analytics & tracking (GA4), Monthly reporting, Review management',
      industries: 'Restaurants, Hair Salons & Spas, HVAC & Contractors, Real Estate, Thrift Stores & Resellers, Auto Shops, Cleaning Services, Fitness Studios, Dental Practices, Legal Services, Events & Entertainment, E-commerce Sellers',
    },
  },
  {
    name: 'Social Media Management',
    description: 'Content calendars, captions, publishing, and engagement managed across every platform. Show up consistently and turn followers into customers.',
    metadata: {
      tagline: 'Consistency + Follower Growth',
      capabilities: 'Multi-platform scheduling (Instagram, Facebook, TikTok, LinkedIn, Google Business), Caption writing, Content calendar planning, Platform-specific content, Hashtag research, Engagement monitoring, Analytics & reporting, Brand voice consistency, Trend monitoring, Competitor analysis, Growth strategy',
      industries: 'Restaurants, Hair Salons & Spas, HVAC & Contractors, Real Estate, Thrift Stores & Resellers, Auto Shops, Cleaning Services, Fitness Studios, Dental Practices, Legal Services, Events & Entertainment, E-commerce Sellers',
    },
  },
  {
    name: 'LLC Formation',
    description: 'Business entity formation services — LLC registration, EIN acquisition, and compliance setup to get your business legally established.',
    metadata: {
      tagline: 'Get Your Business Official',
      capabilities: 'LLC registration, EIN acquisition, Compliance setup',
      industries: 'All',
    },
  },
]

async function main() {
  // Fetch existing Stripe products
  const existingProducts = await stripe.products.list({ limit: 100 })
  const existingNames = new Set(existingProducts.data.map((p) => p.name))

  for (const product of products) {
    if (existingNames.has(product.name)) {
      console.log(`⏭️  Skipping "${product.name}" — already exists in Stripe`)

      // Still sync to Supabase if missing
      const existing = existingProducts.data.find((p) => p.name === product.name)
      if (existing) {
        await upsertService(existing.id, product)
      }
      continue
    }

    console.log(`✅ Creating "${product.name}"...`)
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: product.metadata,
    })

    await upsertService(stripeProduct.id, product)
    console.log(`   → Stripe ID: ${stripeProduct.id}`)
  }

  console.log('\n🎉 Seed complete!\n')
}

async function upsertService(stripeProductId: string, product: (typeof products)[0]) {
  const { error } = await supabase
    .from('services')
    .upsert(
      {
        stripe_product_id: stripeProductId,
        name: product.name,
        description: product.description,
        tagline: product.metadata.tagline,
        capabilities: product.metadata.capabilities,
        industries: product.metadata.industries,
        category: 'core',
        is_active: true,
      },
      { onConflict: 'stripe_product_id' }
    )

  if (error) {
    console.error(`   ⚠️  Supabase upsert error for ${product.name}:`, error.message)
  } else {
    console.log(`   → Synced to Supabase services table`)
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
