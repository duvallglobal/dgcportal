-- ============================================
-- Migration 003: Fix ticket_replies RLS policy
-- Prevents clients from spoofing admin replies
-- ============================================

-- Drop the existing overly-permissive policy
DROP POLICY IF EXISTS "ticket_replies_own" ON public.ticket_replies;

-- SELECT: visible if user can see the ticket (unchanged)
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

-- INSERT: enforce user_id and role match JWT context
CREATE POLICY "ticket_replies_insert" ON public.ticket_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    -- user_id must always match the authenticated user
    user_id = public.requesting_user_id()
    AND (
      -- Admins can insert with role = 'admin' on any ticket
      (public.is_admin() AND role = 'admin')
      OR
      -- Clients can only insert with role = 'client' on their own tickets
      (
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

-- UPDATE: admin only (clients should not edit replies)
CREATE POLICY "ticket_replies_update" ON public.ticket_replies
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: admin only
CREATE POLICY "ticket_replies_delete" ON public.ticket_replies
  FOR DELETE TO authenticated
  USING (public.is_admin());
