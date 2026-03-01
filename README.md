# DGC Client Portal

Full-stack client portal for **[DGC.today](https://dgc.today)** — a digital services agency. Handles onboarding, e-commerce inventory, billing, support, AI tools, e-signatures, and admin management.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) | Server/client rendering, API routes |
| Language | TypeScript | Type safety |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) | Component library |
| Auth | [Clerk](https://clerk.com) | Role-based auth (admin + client) |
| Database | [Supabase](https://supabase.com) (Postgres + RLS) | Data layer + file storage |
| Payments | [Stripe](https://stripe.com) | Checkout, subscriptions, invoices, customer portal |
| E-Signatures | [DocuSeal](https://www.docuseal.co) | Embedded contract signing |
| AI | [NVIDIA NIM](https://build.nvidia.com) | Multi-model LLM (contracts, proposals, chatbot, product descriptions) |
| Email | [Resend](https://resend.com) | Transactional + scheduled emails |
| Hosting | [Vercel](https://vercel.com) | Deployment + cron jobs |

## Package Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `next` | 15.4.x | App framework |
| `react` / `react-dom` | 19.x | UI rendering |
| `@clerk/nextjs` | 6.x | Auth provider, middleware, hooks |
| `@clerk/backend` | 1.x | Server-side Clerk utilities |
| `@supabase/supabase-js` | 2.x | Database client (Postgres) |
| `stripe` | 17.x | Stripe Node SDK — payments, subscriptions, webhooks |
| `resend` | 4.x | Email sending SDK |
| `papaparse` | 5.x | CSV parsing for bulk product uploads |
| `@radix-ui/react-*` | Various | Headless UI primitives (select, tabs, dialog, accordion, label, tooltip, separator, slot) |
| `react-hook-form` | 7.x | Form state management |
| `@hookform/resolvers` | 5.x | Zod integration for form validation |
| `zod` | 3.x | Schema validation |
| `class-variance-authority` | 0.7.x | Variant-based component styling |
| `clsx` + `tailwind-merge` | Latest | Conditional classname merging |
| `lucide-react` | 0.511.x | Icon library |

### Dev

| Package | Purpose |
|---|---|
| `typescript` | Type checking |
| `tsx` | Run TypeScript scripts (seed, migrations) |
| `tailwindcss` + `@tailwindcss/postcss` | CSS build |
| `tw-animate-css` | Tailwind animation utilities |
| `eslint` + `eslint-config-next` | Linting |
| `@types/papaparse` | PapaParse type definitions |
| `@types/node`, `@types/react`, `@types/react-dom` | Core type definitions |

---

## Features

### Client Portal (`/dashboard`)

| Feature | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | Welcome hub, onboarding status tracker, quick links |
| Project Intake | `/dashboard/intake` | 5-step wizard: business info → goals → branding → platform access → review/submit |
| Content Inventory | `/dashboard/inventory` | Submit products for e-commerce (single form + CSV bulk upload), AI-powered descriptions |
| Service Agreement | `/dashboard/agreement` | DocuSeal embedded signing + Stripe deposit checkout |
| Billing | `/dashboard/billing` | Stripe Customer Portal (invoices, payment methods, subscriptions) |
| Add-ons | `/dashboard/addons` | One-click purchase of additional services via Stripe Checkout |
| Support | `/dashboard/support` | Create/track tickets with threaded replies |
| AI Chatbot | Floating widget | NVIDIA NIM-powered, context-aware, auto-escalates to tickets |

### Admin Panel (`/admin`)

| Feature | Route | Description |
|---|---|---|
| Dashboard | `/admin` | Stat cards (clients, projects, intakes, tickets, Stripe revenue), searchable client table, CSV export |
| Client Detail | `/admin/clients/[id]` | Tabbed view: overview, intake data, billing, tickets, inventory |
| Client Billing | `/admin/clients/[id]/billing` | View/assign Stripe subscriptions |
| Services | `/admin/services` | Stripe product sync, pricing, active toggle, core vs add-on |
| Tickets | `/admin/tickets` | Filter by status/priority, expandable threads, inline reply, status updates |
| Inventory | `/admin/inventory` | Review product submissions, change status, add admin notes |
| Reviews | `/admin/reviews` | Client feedback/ratings, filter by stars, testimonial permissions |
| AI Settings | `/admin/settings/ai` | Per-tool model selection from NVIDIA NIM, temperature/token/prompt controls |

### AI Tools (NVIDIA NIM)

| Tool | Access | Description |
|---|---|---|
| Contract Generator | Admin | Generates service contracts from intake data |
| Proposal Writer | Admin | Generates project proposals |
| Client Chatbot | Client | Floating widget, auto-creates support tickets |
| Product Describer | Client | AI e-commerce listing descriptions |

Each tool is independently configurable — model, temperature, max tokens, system prompt — all managed via the admin AI settings page.

### Automation

| Feature | Description |
|---|---|
| Feedback Emails | Automatically scheduled 3 days after project completion |
| Vercel Cron | Hourly cron (`/api/cron/send-emails`) processes pending scheduled emails via Resend |
| Webhook Sync | Stripe webhook handler syncs payment events to Supabase |

---

## Project Structure

```
app/
├── (auth)/                  # Clerk sign-in / sign-up pages
├── (portal)/
│   ├── dashboard/           # Client-facing pages
│   │   ├── intake/          # 5-step onboarding wizard
│   │   ├── inventory/       # Product submissions
│   │   ├── agreement/       # DocuSeal signing + Stripe deposit
│   │   ├── billing/         # Stripe Customer Portal
│   │   ├── addons/          # Add-on marketplace
│   │   └── support/         # Ticket system
│   ├── admin/               # Admin-only pages
│   │   ├── clients/[id]/    # Client detail + billing
│   │   ├── services/        # Stripe product management
│   │   ├── tickets/         # Ticket management
│   │   ├── inventory/       # Product review
│   │   ├── reviews/         # Client feedback
│   │   └── settings/ai/     # AI model configuration
│   └── layout.tsx           # Portal shell (sidebar, nav, user menu)
├── api/
│   ├── admin/               # Admin API routes
│   ├── ai/                  # AI tool endpoints (NVIDIA NIM)
│   ├── billing/             # Stripe checkout + portal
│   ├── cron/                # Vercel cron handlers
│   ├── feedback/            # Public feedback submission
│   ├── intake/              # Intake CRUD
│   ├── inventory/           # Product CRUD + AI describe
│   ├── support/             # Ticket CRUD + replies
│   └── webhooks/            # Stripe webhook handler
├── feedback/[token]/        # Public feedback form (no auth)
└── page.tsx                 # Landing page

components/
├── ui/                      # shadcn/ui + custom components
│   ├── loading-skeleton.tsx # Skeleton loaders (card, table, stat, dashboard)
│   ├── toast-provider.tsx   # Toast notification system
│   ├── progress-stepper.tsx # Numbered step indicator
│   └── ...                  # shadcn/ui primitives
└── ai-chatbot.tsx           # Floating AI chat widget

lib/
├── dal.ts                   # Data Access Layer (requireAuth, requireAdmin, getCurrentClient)
├── stripe.ts                # Stripe client singleton
├── resend.ts                # Resend email client + sendEmail helper
├── nvidia-nim.ts            # NVIDIA NIM API client
├── supabase/
│   ├── server.ts            # Server-side Supabase clients (auth + admin)
│   └── client.ts            # Browser Supabase client
└── utils.ts                 # cn() classname helper

scripts/
└── seed-stripe-products.ts  # Seeds 7 DGC services in Stripe + Supabase

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    └── 002_remaining_tables.sql
```

---

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- [Clerk](https://clerk.com) account
- [Supabase](https://supabase.com) project
- [Stripe](https://stripe.com) account (test mode)
- [NVIDIA NIM](https://build.nvidia.com) API key
- [Resend](https://resend.com) account
- [DocuSeal](https://www.docuseal.co) instance (Docker or cloud)

### 1. Clone & Install

```bash
git clone https://github.com/duvallglobal/dgcportal.git
cd dgcportal
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values — see `.env.example` for the complete list:

| Variable | Service | Required |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | ✅ |
| `CLERK_SECRET_KEY` | Clerk | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ✅ |
| `STRIPE_SECRET_KEY` | Stripe | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | ✅ |
| `DOCUSEAL_API_URL` | DocuSeal | ✅ |
| `DOCUSEAL_API_KEY` | DocuSeal | ✅ |
| `NVIDIA_API_KEY` | NVIDIA NIM | ✅ |
| `RESEND_API_KEY` | Resend | ✅ |
| `ADMIN_EMAIL` | App | ✅ |
| `NEXT_PUBLIC_APP_URL` | App | ✅ |
| `CRON_SECRET` | Vercel Cron | ✅ |

### 3. Database

Run both migrations against your Supabase project (SQL Editor or CLI):

```bash
# In Supabase SQL Editor, run in order:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_remaining_tables.sql
```

### 4. Seed Stripe Products

```bash
# Test mode
npm run seed:stripe:test

# Production
npm run seed:stripe
```

This creates all 7 DGC service products in Stripe and syncs them to the `services` table in Supabase.

### 5. Clerk Admin Setup

1. Create a Clerk application with email/password
2. Sign up your admin account
3. In Clerk Dashboard → Users → your user → Public Metadata, set:
   ```json
   { "role": "admin" }
   ```
4. All new sign-ups default to `client` role

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Deploy

```bash
vercel --prod
```

- Set all env vars in Vercel dashboard
- `vercel.json` auto-configures the hourly cron for scheduled emails
- Add Stripe webhook endpoint: `https://your-domain.com/api/webhooks/stripe`

---

## NPM Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev --turbopack` | Start dev server with Turbopack |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | Run ESLint |
| `typecheck` | `tsc --noEmit` | TypeScript type checking |
| `seed:stripe` | `npx tsx scripts/seed-stripe-products.ts` | Seed Stripe products (live) |
| `seed:stripe:test` | `npx tsx scripts/seed-stripe-products.ts --test` | Seed Stripe products (test) |

---

## Brand

| Token | Value | Usage |
|---|---|---|
| Dark Charcoal | `#1a1a2e` | Sidebar, backgrounds, primary buttons |
| Accent Gold | `#e2b714` | CTAs, active states, highlights, progress indicators |
| Gold Hover | `#c9a112` | Button hover states |
| White | `#ffffff` | Card backgrounds, text on dark |

---

## Security

- **Clerk Middleware** — All routes protected; public exceptions for landing, auth, feedback, webhooks, cron
- **Admin Role Guard** — Server-side `requireAdmin()` DAL function + middleware route matching
- **Supabase RLS** — Row-level security on all tables; clients only see their own data
- **Stripe Webhook Verification** — Signature validation on all webhook events
- **Security Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- **CRON_SECRET** — Bearer token auth on cron endpoints
- **10MB Body Limit** — Configured for file/CSV uploads

---

## License

Private — [DGC.today](https://dgc.today)
