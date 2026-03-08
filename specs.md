# DGC Client Portal — Build Prompt

## What This App Is

Digital Growth Consulting (DGC) at dgc.today is a digital agency that builds
websites and automations for local businesses. This portal is a white-labeled
client-facing platform where DGC onboards new clients, collects project details,
handles contracts and payments, and manages ongoing support — all in one place.

The portal has two user types: admins (DGC team) and clients (DGC customers).
Admins manage everything. Clients have a guided, scoped view of their own project.

## Tech Stack

- Next.js App Router deployed on Vercel
- Clerk for auth
- Supabase for database, and file storage
- Stripe for one-time payments, subscriptions, and the service catalog
- DocuSeal for e-signatures, self-hosted on Render (endpoint and API key provided)
- Resend with React Email for all transactional emails
- NVIDIA NIM API for all AI features (OpenAI-compatible at integrate.api.nvidia.com)
- @react-pdf/renderer for PDF generation

---

## Authentication

Clerk for auth with two roles stored in a profiles table: admin and client.
All /admin/* routes are admin-only. All /dashboard/* routes are client-only.
Both sides have completely separate layouts and navigation.

---

## Client Onboarding Flow

When a new client is created, they go through this sequence before work begins.

### 1. Intake Form — /dashboard/intake

A multi-step wizard that collects everything DGC needs to start a project.

- Step 1: Basic Info — business name, contact info, industry, website URL
- Step 2: Goals and Needs — what they want to achieve and problems they are solving
- Step 3: Branding Assets — logo upload, color palette selector, font preferences,
  and example sites they like
- Step 4: Platform Access — logins and credentials the client is granting DGC access to
- Step 5: Review and Submit — full summary before final submission

On submit, all data is saved to Supabase and an email is sent to the admin with
a formatted summary of the intake.

### 2. Service Agreement + Deposit — /dashboard/agreement

After intake is submitted, the admin generates a contract using the AI Contract
Generator (see AI Tools). That contract is rendered as a PDF using @react-pdf/renderer
and uploaded to DocuSeal as a template via the self-hosted Render API.

The client sees an embedded DocuSeal signing form directly on this page.

When the client signs, a DocuSeal webhook fires and the admin gets an email
confirming the agreement was signed and the deposit is pending.

After signing, the client is prompted to pay a deposit via Stripe one-time charge.
When the deposit is paid, a Stripe webhook fires and both parties receive a
confirmation email.

The page shows a live status indicator: Unsigned, Signed, Deposit Paid.

---

## Billing — /dashboard/billing

Admin assigns a Stripe subscription plan to a client from
/admin/clients/[id]/billing. The client views their subscription, invoices,
and payment method at /dashboard/billing via the Stripe Customer Portal.

Stripe webhooks handle:
- invoice.paid: receipt email to client
- invoice.payment_failed: alert email to client and admin

---

## Service Catalog — /admin/services

DGC's services already exist as products in Stripe. On load, fetch all products
via stripe.products.list() and store each stripe_product_id in the Supabase
services table.

From this page the admin can:
- Set and update prices (one-time or monthly recurring) via stripe.prices.create()
- Manage product features using Stripe's Product Features API via
  stripe.products.createFeature() and stripe.products.listFeatures(). Features
  display as checkboxes in the admin UI and render as checkmark bullet points on
  client-facing pricing displays. Admin can add and remove features and changes
  sync with Stripe.
- Toggle products active or inactive
- Edit product descriptions
- Tag each product as a core service or add-on

Clients browse available add-ons and purchase them from /dashboard/addons.

---

## Support Tickets

Clients submit support tickets from /dashboard/support. Each ticket has a subject,
description, and priority level. Admins manage all tickets from /admin/tickets
with filtering and sorting by status, priority, and client.

Email notifications:
- New ticket created: to admin
- Status change: to client
- New reply: to both parties

---

## Client Reviews

When a client's project status is moved to Closed or Maintenance, a Review button
appears on their dashboard Overview page. Clicking it opens a review form where
they can leave a star rating (1-5) and written comment. The feedback request email
sent at this same moment contains a unique /feedback/[token] link that opens a
standalone public page with the same review form, so clients can complete it
without logging in.

All submitted reviews are visible to the admin at /admin/reviews, filterable by
rating.

---

## AI Tools

All AI tools use the NVIDIA NIM API (OpenAI-compatible) at
integrate.api.nvidia.com. Available models are fetched from the NVIDIA NIM
catalog at runtime for the live model selector in admin settings.

### Admin AI Settings — /admin/settings/ai

The admin configures every AI tool from this page:
- Select which NVIDIA NIM model powers each tool from a live fetched list
- Edit the system prompt for each tool
- Adjust temperature and max tokens per tool

All settings are saved to an ai_settings table in Supabase.

### Client Chat Agent

A floating chat widget visible on every page of the client dashboard in the
bottom-right corner. The system prompt is loaded with:
- Content scraped or stored from dgc.today (services, process, pricing)
- That specific client's intake data and current project status from Supabase

This gives the agent full context to answer questions about both DGC's offerings
and the client's own project. The agent is conversational only with no tool use.
Chat history is stored in Supabase and visible to the admin on the client detail
page under the Chat History tab.

### Admin Generative Agent — /admin/ai

A dedicated tab in the admin area where the admin interacts with a tool-use AI
agent. The agent has access to the following tools:
- Generate contract (see AI Contract Generator)
- Generate proposal (see AI Proposal Generator)
- Draft client email

The agent receives the relevant client's intake data, project details, and DGC
service descriptions as context when using any of these tools.

### AI Contract Generator

Generates a service contract as a PDF using @react-pdf/renderer. Uses a dedicated
system prompt that includes the client's intake data and DGC service descriptions.
The generated PDF can be uploaded directly to DocuSeal from the admin UI.

### AI Proposal Generator

Generates a project proposal as a PDF using @react-pdf/renderer. Uses a separate
system prompt and document structure from the contract. The same client context
is injected but the output format and tone are scoped to a sales proposal.

---

## Admin Pages

/admin/clients
Searchable and filterable table of all clients.

/admin/clients/[id]
Tabbed client detail page with the following tabs:
Intake Data, Project Status, Agreement, Billing, Tickets, Chat History

/admin/clients/[id]/billing
Assign a Stripe subscription plan to the client.

/admin/services
Full service catalog manager (see Service Catalog section).

/admin/settings/ai
AI tool configuration (see AI Tools section).

/admin/ai
Admin generative agent with tool use (see AI Tools section).

/admin/tickets
All support tickets across all clients with filter and sort.

/admin/reviews
All client feedback filterable by rating.

---

## Client Dashboard Pages

/dashboard
Overview page showing project status summary and next steps checklist. When the
project status is Closed or Maintenance, a Review button appears here.

/dashboard/intake
Multi-step intake wizard.

/dashboard/agreement
Agreement status indicator and embedded DocuSeal signing form.

/dashboard/billing
Stripe Customer Portal.

/dashboard/addons
Browse and purchase add-on services.

/dashboard/support
Submit and view support tickets.

---

## Public Pages

/feedback/[token]
Standalone public page (no login required) containing the review form. Opened
via a unique link sent in the feedback request email. Accepts a star rating and
written comment. Saves to the same reviews table in Supabase.

---

## Email Templates

All emails are built with React Email and sent via Resend.

- Intake submitted: to admin with a full summary of the intake form
- Agreement signed: to admin confirming the client signed, deposit pending
- Deposit paid: to both admin and client confirming the payment
- Invoice paid: to client as a receipt
- Payment failed: to both client and admin as an alert
- Feedback request: to client when project moves to Closed or Maintenance,
  contains a unique /feedback/[token] link
- New support ticket: to admin
- Ticket status change: to client
- New ticket reply: to both parties
