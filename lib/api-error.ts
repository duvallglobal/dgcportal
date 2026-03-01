const SENSITIVE_PATTERNS = [
  /supabase/i,
  /postgres/i,
  /clerk/i,
  /stripe/i,
  /jwt/i,
  /token/i,
  /connection/i,
  /column/i,
  /relation/i,
  /violates/i,
  /docuseal/i,
  /nvidia/i,
  /api[_-]?key/i,
  /secret/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
]

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      return 'An internal error occurred. Please try again later.'
    }
  }

  if (message.length > 200) {
    return 'An internal error occurred. Please try again later.'
  }

  return message
}
