import Stripe from 'stripe'

const args = process.argv.slice(2)
const isLive = args.includes('--live')

const key = isLive ? process.env.STRIPE_LIVE_KEY : process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error(`Error: ${isLive ? 'STRIPE_LIVE_KEY' : 'STRIPE_SECRET_KEY'} is not set.`)
  console.error('Set it in your .env file or pass it as an environment variable.')
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: '2026-01-28' })

const products = [
  {
    name: 'Website Development',
    description: 'High-performance websites and custom web applications built from the ground up — no templates, no shortcuts. Optimized for speed, search visibility, and lead conversion across every device.',
    metadata: {
      tagline: 'Engineered to Convert',
      capabilities: 'Performance-first engineering, Bespoke architecture, Search-engine readiness, Conversion-centric tools, Strategic CTAs, Future-proof scalability',
      industries: 'Hair Salons and Spas, Restaurants, Cleaning Services, Home Services, Real Estate, E-commerce, Legal Services, Thrift Stores and Resellers, Events and Entertainment, Fitness Studios, Auto Repair, Dental Practices',
      category: 'core',
    },
  },
  {
    name: 'AI Automation',
    description: 'AI-powered automation eliminates repetitive manual tasks across lead management, customer communication, billing, and operations. Every workflow runs without human intervention — from first contact to closed deal.',
    metadata: {
      tagline: 'Intelligent Systems That Scale Operations',
      capabilities: 'Lead response automation, Lead qualification scoring, Automated follow-up sequences, CRM data logging, Trigger-based actions, System syncing, Appointment booking, Billing automation, Re-engagement campaigns, Pipeline visibility dashboards',
      industries: 'Hair Salons and Spas, Restaurants, Cleaning Services, Home Services, Real Estate, E-commerce, Legal Services, Thrift Stores and Resellers, Events and Entertainment, Fitness Studios, Auto Repair, Dental Practices',
      category: 'core',
    },
  },
  {
    name: 'E-commerce Solutions',
    description: 'List once, sell everywhere. Multi-platform automation syncs inventory across 7+ marketplaces in real-time, while AI cuts listing time from 20 minutes to 30 seconds.',
    metadata: {
      tagline: 'Sell More Everywhere',
      capabilities: 'Multi-channel listing (eBay, Poshmark, Mercari, Shopify, Facebook Marketplace, Etsy, Amazon, TikTok Shop), Real-time inventory sync, AI-powered listings, Unified order management, Dynamic pricing rules, Bulk operations, Cross-platform analytics, Automated customer messaging, Shipping integration, Returns management, Custom storefronts, B2B and wholesale',
      industries: 'Thrift Stores and Resellers, Retail Boutiques, E-commerce Sellers',
      category: 'core',
    },
  },
  {
    name: 'Custom App Development',
    description: 'Full-stack custom applications tailored to exact workflows — from AI-powered booking systems and CRMs to client portals and automated invoicing platforms.',
    metadata: {
      tagline: 'Built for Your Business',
      capabilities: 'Custom booking systems, Lead management CRM, Client portals, Automated invoicing, Quote generation, AI-powered chatbots, Third-party integrations, Workflow automation, Real-time dashboards, Mobile applications, Document management, API development',
      industries: 'Hair Salons and Spas, Cleaning Services, Legal Services, Healthcare, Events and Entertainment, Professional Services',
      category: 'core',
    },
  },
  {
    name: 'SEO and Paid Advertising',
    description: 'Dominate search results organically and through paid ads. From Google Business Profile optimization to precision-targeted ad campaigns with monthly ROI tracking.',
    metadata: {
      tagline: 'Get Found. Get Clicks. Get Customers.',
      capabilities: 'Google Business Profile optimization, On-page SEO, Technical SEO, Google Ads campaigns, Facebook and Instagram Ads, Retargeting campaigns, Local SEO, Keyword research, Content strategy, Analytics and tracking (GA4), Monthly reporting, Review management',
      industries: 'Restaurants, Hair Salons and Spas, HVAC and Contractors, Real Estate, Thrift Stores and Resellers, Auto Shops, Cleaning Services, Fitness Studios, Dental Practices, Legal Services, Events and Entertainment, E-commerce Sellers',
      category: 'core',
    },
  },
  {
    name: 'Social Media Management',
    description: 'Content calendars, captions, publishing, and engagement managed across every platform. Show up consistently and turn followers into customers.',
    metadata: {
      tagline: 'Consistency plus Follower Growth',
      capabilities: 'Multi-platform scheduling (Instagram, Facebook, TikTok, LinkedIn, Google Business), Caption writing, Content calendar planning, Platform-specific content, Hashtag research, Engagement monitoring, Analytics and reporting, Brand voice consistency, Trend monitoring, Competitor analysis, Growth strategy',
      industries: 'Restaurants, Hair Salons and Spas, HVAC and Contractors, Real Estate, Thrift Stores and Resellers, Auto Shops, Cleaning Services, Fitness Studios, Dental Practices, Legal Services, Events and Entertainment, E-commerce Sellers',
      category: 'core',
    },
  },
  {
    name: 'LLC Formation',
    description: 'Business entity formation services — LLC registration, EIN acquisition, and compliance setup to get your business legally established.',
    metadata: {
      tagline: 'Get Your Business Official',
      capabilities: 'LLC registration, EIN acquisition, Compliance setup',
      industries: 'All',
      category: 'core',
    },
  },
]

async function seedProducts() {
  console.log(`\n🚀 Seeding Stripe products in ${isLive ? 'LIVE' : 'TEST'} mode...\n`)

  const existing = await stripe.products.list({ limit: 100, active: true })
  const existingNames = new Set(existing.data.map((p) => p.name))

  for (const product of products) {
    if (existingNames.has(product.name)) {
      console.log(`⏭️  Skipping "${product.name}" — already exists`)
      continue
    }

    const created = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: product.metadata,
    })

    console.log(`✅ Created: ${created.name} (${created.id})`)
  }

  console.log('\n✨ Stripe product seed complete.')
  console.log('👉 Set prices from the Admin > Services page in the portal UI.\n')
}

seedProducts().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
