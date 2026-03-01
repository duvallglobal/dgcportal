'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /admin/clients to /admin (client list is on admin dashboard)
export default function AdminClientsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin') }, [router])
  return null
}
