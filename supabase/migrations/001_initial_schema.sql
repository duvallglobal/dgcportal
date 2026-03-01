-- ============================================
-- DGC Client Portal — Migration 001
-- Full schema: functions, tables, RLS, indexes, grants, seeds
-- Run this FIRST on a fresh Supabase project
-- ============================================

-- Helper: check admin role from Clerk JWT publicMetadata
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'publicMetadata' ->> 'role') = 'admin',
    false
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: get Clerk user ID from JWT sub claim
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text AS $$
  SELECT (auth.jwt() ->> 'sub');
$$ LANGUAGE sql SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  business_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_intakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  industry TEXT,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  location TEXT,
  services_interested TEXT[],
  goals TEXT,
  timeline TEXT,
  budget_range TEXT,
  brand_colors TEXT[],
  fonts TEXT,
  social_links JSONB DEFAULT '{}',
  platform_credentials_encrypted TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'active')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intake_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES public.project_intakes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  capabilities TEXT,
  industries TEXT,
  category TEXT DEFAULT 'core' CHECK (category IN ('core', 'addon')),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  price_amount INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  sku TEXT,
  category TEXT,
  variants JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'listed', 'needs_revision')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  docuseal_submission_id TEXT,
  signed_pdf_url TEXT,
  status TEXT DEFAULT 'unsigned' CHECK (status IN ('unsigned', 'signed_awaiting_deposit', 'deposit_paid', 'active')),
  deposit_amount INTEGER,
  stripe_payment_id TEXT,
  signature_data JSONB,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_type TEXT CHECK (payment_type IN ('deposit', 'subscription', 'addon', 'one_time')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.ticket_replies(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedback_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  allow_testimonial BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT UNIQUE NOT NULL,
  model_id TEXT NOT NULL,
  display_name TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  system_prompt TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduled_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_clerk_user_id ON public.clients(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer_id ON public.clients(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

CREATE INDEX IF NOT EXISTS idx_intakes_client_id ON public.project_intakes(client_id);
CREATE INDEX IF NOT EXISTS idx_intakes_status ON public.project_intakes(status);

CREATE INDEX IF NOT EXISTS idx_intake_files_intake_id ON public.intake_files(intake_id);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_stripe_product_id ON public.services(stripe_product_id);

CREATE INDEX IF NOT EXISTS idx_addons_client_id ON public.client_addons(client_id);

CREATE INDEX IF NOT EXISTS idx_products_client_id ON public.products(client_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

CREATE INDEX IF NOT EXISTS idx_agreements_client_id ON public.service_agreements(client_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON public.service_agreements(status);

CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id ON public.subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_replies_ticket_id ON public.ticket_replies(ticket_id);

CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON public.ticket_attachments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_feedback_token ON public.feedback_reviews(token);
CREATE INDEX IF NOT EXISTS idx_feedback_client_id ON public.feedback_reviews(client_id);

CREATE INDEX IF NOT EXISTS idx_chat_client_id ON public.chat_messages(client_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending ON public.scheduled_emails(status, send_at)
  WHERE status = 'pending';

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_clients BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_intakes BEFORE UPDATE ON public.project_intakes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_agreements BEFORE UPDATE ON public.service_agreements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tickets BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_ai_settings BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- clients
CREATE POLICY "clients_own" ON public.clients
  FOR ALL TO authenticated
  USING (clerk_user_id = public.requesting_user_id() OR public.is_admin())
  WITH CHECK (clerk_user_id = public.requesting_user_id() OR public.is_admin());

-- project_intakes
CREATE POLICY "intakes_own" ON public.project_intakes
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  )
  WITH CHECK (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

-- intake_files
CREATE POLICY "intake_files_own" ON public.intake_files
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    intake_id IN (
      SELECT pi.id FROM public.project_intakes pi
      JOIN public.clients c ON pi.client_id = c.id
      WHERE c.clerk_user_id = public.requesting_user_id()
    )
  )
  WITH CHECK (
    public.is_admin() OR
    intake_id IN (
      SELECT pi.id FROM public.project_intakes pi
      JOIN public.clients c ON pi.client_id = c.id
      WHERE c.clerk_user_id = public.requesting_user_id()
    )
  );

-- services: everyone reads, admin writes
CREATE POLICY "services_read" ON public.services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "services_write" ON public.services
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "services_update" ON public.services
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "services_delete" ON public.services
  FOR DELETE TO authenticated USING (public.is_admin());

-- client_addons
CREATE POLICY "addons_own" ON public.client_addons
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  )
  WITH CHECK (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

-- products
CREATE POLICY "products_own" ON public.products
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  )
  WITH CHECK (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

-- product_images
CREATE POLICY "product_images_own" ON public.product_images
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.clients c ON p.client_id = c.id
      WHERE c.clerk_user_id = public.requesting_user_id()
    )
  )
  WITH CHECK (
    public.is_admin() OR
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.clients c ON p.client_id = c.id
      WHERE c.clerk_user_id = public.requesting_user_id()
    )
  );

-- service_agreements
CREATE POLICY "agreements_own" ON public.service_agreements
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  )
  WITH CHECK (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

-- payments
CREATE POLICY "payments_own" ON public.payments
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  )
  WITH CHECK (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

-- subscriptions
CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  )
  WITH CHECK (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

-- support_tickets
CREATE POLICY "tickets_own" ON public.support_tickets
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  )
  WITH CHECK (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

-- ticket_replies: secured INSERT (prevents admin spoofing)
CREATE POLICY "ticket_replies_select" ON public.ticket_replies
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    ticket_id IN (
      SELECT st.id FROM public.support_tickets st
      JOIN public.clients c ON st.client_id = c.id
      WHERE c.clerk_user_id = public.requesting_user_id()
    )
  );

CREATE POLICY "ticket_replies_insert" ON public.ticket_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.requesting_user_id()
    AND (
      (public.is_admin() AND role = 'admin')
      OR (
        NOT public.is_admin()
        AND role = 'client'
        AND ticket_id IN (
          SELECT st.id FROM public.support_tickets st
          JOIN public.clients c ON st.client_id = c.id
          WHERE c.clerk_user_id = public.requesting_user_id()
        )
      )
    )
  );

CREATE POLICY "ticket_replies_update" ON public.ticket_replies
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "ticket_replies_delete" ON public.ticket_replies
  FOR DELETE TO authenticated USING (public.is_admin());

-- ticket_attachments
CREATE POLICY "ticket_attachments_own" ON public.ticket_attachments
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    ticket_id IN (
      SELECT st.id FROM public.support_tickets st
      JOIN public.clients c ON st.client_id = c.id
      WHERE c.clerk_user_id = public.requesting_user_id()
    )
  )
  WITH CHECK (
    public.is_admin() OR
    ticket_id IN (
      SELECT st.id FROM public.support_tickets st
      JOIN public.clients c ON st.client_id = c.id
      WHERE c.clerk_user_id = public.requesting_user_id()
    )
  );

-- feedback_reviews: public read/write by token for submission, admin sees all
CREATE POLICY "feedback_select" ON public.feedback_reviews
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

CREATE POLICY "feedback_select_anon" ON public.feedback_reviews
  FOR SELECT TO anon USING (true);

CREATE POLICY "feedback_update_anon" ON public.feedback_reviews
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "feedback_admin_write" ON public.feedback_reviews
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- chat_messages
CREATE POLICY "chat_own" ON public.chat_messages
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  )
  WITH CHECK (
    public.is_admin() OR
    client_id IN (SELECT id FROM public.clients WHERE clerk_user_id = public.requesting_user_id())
  );

-- ai_settings: admin only
CREATE POLICY "ai_settings_admin" ON public.ai_settings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- scheduled_emails: service_role only (accessed via adminSupabase)
CREATE POLICY "scheduled_emails_service" ON public.scheduled_emails
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- GRANTS
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.feedback_reviews TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('intake-assets', 'intake-assets', true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/csv']),
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp']),
  ('ticket-attachments', 'ticket-attachments', false, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: intake-assets
CREATE POLICY "intake_assets_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'intake-assets');

CREATE POLICY "intake_assets_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'intake-assets');

-- Storage RLS: product-images
CREATE POLICY "product_images_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-images');

-- Storage RLS: ticket-attachments (private)
CREATE POLICY "ticket_attachments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY "ticket_attachments_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ticket-attachments');

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO public.ai_settings (tool_name, model_id, display_name, temperature, max_tokens, system_prompt) VALUES
  ('contract_generator', 'deepseek-ai/deepseek-v3.2', 'Contract Generator', 0.3, 8192, 'You are a professional services contract writer for DG Consulting (dgc.today), a digital services agency specializing in AI automation, web development, e-commerce solutions, custom app development, SEO, and social media management. Generate professional, legally-sound service contracts based on the client details and selected services provided. Use clear, concise language. Include scope of work, timeline, payment terms, and standard clauses.'),
  ('proposal_writer', 'deepseek-ai/deepseek-v3.2', 'Proposal Writer', 0.5, 8192, 'You are a professional business proposal writer for DG Consulting (dgc.today). Create compelling, detailed project proposals based on client intake data. Highlight how DGC services solve the client''s specific business challenges. Include project overview, proposed solution, timeline, and investment summary. Be persuasive but honest.'),
  ('chatbot', 'nvidia/llama-3.3-nemotron-super-49b-v1.5', 'Client Chatbot', 0.7, 2048, 'You are the DG Consulting client support assistant. Help clients with questions about their projects, billing, DGC services, and general support. Be friendly, professional, and concise. If you cannot resolve an issue, offer to create a support ticket. DGC services include: Website Development, AI Automation, E-commerce Solutions, Custom App Development, SEO & Paid Advertising, Social Media Management, and LLC Formation.'),
  ('product_describer', 'deepseek-ai/deepseek-v3.2', 'Product Describer', 0.6, 2048, 'You are an expert e-commerce copywriter for DG Consulting (dgc.today). Write compelling, SEO-friendly product descriptions based on the product name, category, and any details provided. Keep descriptions concise (2-3 paragraphs), highlight key features and benefits, and use persuasive language that drives conversions.')
ON CONFLICT (tool_name) DO NOTHING;
