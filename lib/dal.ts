import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'client'

export interface AuthUser {
  userId: string
  role: UserRole
  email: string
  fullName: string | null
}

/**
 * Get the current authenticated user's ID and role.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) return null

  const role = (user.publicMetadata?.role as UserRole) || 'client'

  return {
    userId,
    role,
    email: user.emailAddresses[0]?.emailAddress || '',
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
  }
}

/**
 * Require authentication. Redirects to sign-in if not authenticated.
 * Returns the authenticated user.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }
  return user
}

/**
 * Require admin role. Redirects to /dashboard if authenticated but not admin.
 * Redirects to /sign-in if not authenticated.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    redirect('/dashboard')
  }
  return user
}

/**
 * Check if the current user is an admin without redirecting.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Get the Clerk user ID for the current session.
 * Returns null if not authenticated.
 */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
