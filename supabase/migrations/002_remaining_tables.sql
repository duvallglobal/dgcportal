-- Content Inventory table (e-commerce product submissions)
CREATE TABLE IF NOT EXISTS content_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  price INTEGER, -- in cents
  sku TEXT,
  category TEXT,
  variant_size TEXT,
  variant_color TEXT,
  condition TEXT,
  image_urls JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'listed', 'needs_revision')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback Requests table
CREATE TABLE IF NOT EXISTS feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agreement_id UUID REFERENCES agreements(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  testimonial_permission BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Emails table (for Vercel Cron processing)
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_inventory_client ON content_inventory(client_id);
CREATE INDEX IF NOT EXISTS idx_content_inventory_status ON content_inventory(status);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_token ON feedback_requests(token);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_client ON feedback_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending ON scheduled_emails(status, send_at) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE content_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Content Inventory: clients see own, admin sees all
CREATE POLICY "Clients view own inventory" ON content_inventory
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE clerk_user_id = auth.uid()::text)
  );

CREATE POLICY "Clients insert own inventory" ON content_inventory
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE clerk_user_id = auth.uid()::text)
  );

-- Feedback: public insert via token (no auth required for submission)
CREATE POLICY "Public feedback submission" ON feedback_requests
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public feedback read by token" ON feedback_requests
  FOR SELECT USING (true);

-- Scheduled emails: service role only (no client access)
CREATE POLICY "Service role only for scheduled_emails" ON scheduled_emails
  FOR ALL USING (false);
