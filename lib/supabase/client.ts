import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'

/**
 * Create a Supabase client for browser-side use.
 * Must be called within a component that has access to Clerk session.
 */
export function createBrowserSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Hook to get a Supabase client with Clerk JWT for browser-side use.
 * Use this in client components that need authenticated Supabase access.
 */
export function useSupabaseClient() {
  const { session } = useSession()

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await session?.getToken({ template: 'supabase' })
          const headers = new Headers(options?.headers)
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`)
          }
          return fetch(url, { ...options, headers })
        },
      },
    }
  )

  return client
}
