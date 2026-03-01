import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const session = await auth()

    if (!session.userId) {
      return session.redirectToSignIn()
    }

    if (isAdminRoute(req)) {
      const metadata = session.sessionClaims?.metadata as
        | { role?: 'admin' | 'client' }
        | undefined
      const publicMetadata = session.sessionClaims?.publicMetadata as
        | { role?: 'admin' | 'client' }
        | undefined

      const role = metadata?.role ?? publicMetadata?.role

      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
