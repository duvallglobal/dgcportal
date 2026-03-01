# DGC Client Portal

A full-stack client portal for **DGC.today** — a digital services agency. Built with Next.js 15, Clerk, Supabase, Stripe, DocuSeal, NVIDIA NIM AI, and Resend.

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk (role-based: admin + client) |
| Database | Supabase (Postgres + RLS) |
| File Storage | Supabase Storage |
| Payments | Stripe (Checkout, Subscriptions, Invoices) |
| E-signatures | DocuSeal (self-hosted Docker) |
| AI | NVIDIA NIM API (multi-model, admin-configurable) |
| Email | Resend |
| Hosting | Vercel |

## Features

### Client Portal (`/dashboard`)
- **Project Intake** — 5-step onboarding wizard (business info, goals, branding, platform access, review)
- **Content Inventory** — Product submission for e-commerce listings (single + CSV bulk upload)
- **Service Agreement** — DocuSeal embedded signing + Stripe deposit checkout
- **Billing** — Stripe Customer Portal for invoices, payment methods, subscription management
- **Add-ons Marketplace** — One-click purchase of additional services
- **Support Tickets** — Create/track tickets with threaded replies
- **AI Chatbot** — Context-aware assistant powered by NVIDIA NIM (auto-creates tickets)

### Admin Panel (`/admin`)
- **Dashboard** — Stats cards (clients, projects, intakes, tickets, revenue), client list, CSV export
- **Client Detail** — Tabbed view of intake, billing, tickets, inventory per client
- **Service Management** — Stripe product sync, pricing, active toggle, core/add-on categories
- **Ticket Management** — Filter/sort tickets, reply as admin, update statuses
- **Reviews** — View client feedback, filter by rating, testimonial permissions
- **AI Settings** — Per-tool model selection from NVIDIA NIM (live model fetch), temperature/token/system prompt controls

### AI System
- **Contract Generator** — Admin-only, generates service contracts from client intake data
- **Proposal Writer** — Admin-only, generates project proposals
- **Client Chatbot** — Floating widget, context-aware, auto-escalates to support tickets
- **Product Describer** — AI-powered e-commerce listing descriptions
- **Model Selection** — Each tool independently configurable; models fetched live from NVIDIA NIM catalog

## Setup

### Prerequisites
- Node.js 18+
- A Clerk account
- A Supabase project
- A Stripe account (test mode)
- NVIDIA NIM API key
- Resend account
- DocuSeal instance (Docker or cloud)

### Installation

```bash
git clone https://github.com/duvallglobal/dgcportal.git
cd dgcportal
npm install
cp .env.example .env.local
# Fill in all values in .env.local
```

### Database Setup

Run the Supabase schema migration:
```bash
# Apply the schema to your Supabase project
# The schema file is at supabase/schema.sql
```

### Seed Stripe Products

```bash
npx tsx scripts/seed-stripe-products.ts --test
```

This creates all 7 DGC service products in Stripe test mode and syncs them to Supabase.

### Clerk Setup

1. Create a Clerk application with email/password sign-up
2. Set yourself as admin via Clerk metadata: `{ "role": "admin" }`
3. All new sign-ups default to `client` role

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy to Vercel

```bash
vercel --prod
```

The `vercel.json` includes a cron job for scheduled feedback emails (runs hourly).

## Project Structure

```
app/
  (auth)/          # Sign-in / Sign-up pages
  (portal)/
    dashboard/     # Client-facing pages
      intake/      # 5-step onboarding
      inventory/   # Product submissions
      agreement/   # DocuSeal signing
      billing/     # Stripe portal
      addons/      # Add-on marketplace
      support/     # Ticket system
    admin/         # Admin-only pages
      clients/     # Client management
      services/    # Stripe products
      tickets/     # Support management
      reviews/     # Feedback viewer
      settings/    # AI model config
  api/             # API routes
  feedback/        # Public feedback form
components/        # Shared UI components
lib/               # Utilities (Stripe, Supabase, AI, Resend, DAL)
scripts/           # Seed scripts
```

## Brand

- **Dark Charcoal:** `#1a1a2e`
- **Accent Gold:** `#e2b714`
- **White:** `#ffffff`

## License

Private — DGC.today
