/**
 * Sanitize error messages before sending to clients.
 * Prevents leaking internal details (stack traces, DB errors, API keys, etc.)
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Strip known sensitive patterns
    const msg = error.message
    if (
      msg.includes('SUPABASE') ||
      msg.includes('STRIPE') ||
      msg.includes('CLERK') ||
      msg.includes('ENCRYPTION') ||
      msg.includes('connect ECONNREFUSED') ||
      msg.includes('relation ') ||
      msg.includes('column ') ||
      msg.includes('violates') ||
      msg.includes('JWT') ||
      msg.includes('token')
    ) {
      return 'An internal error occurred. Please try again later.'
    }
    return msg
  }
  return 'An unexpected error occurred.'
}

/**
 * Create a safe JSON error response.
 */
export function errorResponse(error: unknown, fallbackStatus = 500) {
  const { NextResponse } = require('next/server')
  console.error('API Error:', error)
  return NextResponse.json(
    { error: safeErrorMessage(error) },
    { status: fallbackStatus }
  )
}
