/**
 * Returns a safe error message for API responses.
 * Never exposes internal error details to clients.
 */
export function safeErrorMessage(_error: unknown): string {
  if (process.env.NODE_ENV === 'development' && _error instanceof Error) {
    return _error.message
  }
  return 'Internal server error'
}
