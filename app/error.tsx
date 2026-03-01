'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-6 py-2 bg-[#e2b714] text-[#1a1a2e] font-semibold rounded-lg hover:bg-[#c9a112] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
