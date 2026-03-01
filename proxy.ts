import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Next.js 16 Proxy — handles routing, rewrites, and redirects ONLY.
 * NO auth logic here. Auth is handled in the Data Access Layer (lib/dal.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect root to dashboard (auth check happens in the dashboard layout via DAL)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes that don't need proxying
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
}
