import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export const createSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
    )
  }

  return createClient(url, anonKey, {
    async accessToken() {
      return (await auth()).getToken({ template: 'supabase' })
    },
  })
}
