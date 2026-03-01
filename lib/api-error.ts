/**
 * Returns a safe error message for API responses.
 * Never exposes internal error details to clients.
 */
export function safeErrorMessage(_error: unknown): string {
  return 'Internal server error'
}
