import { requireAuth } from '@/lib/dal'
import { isTestMode } from '@/lib/stripe'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {isTestMode() && (
        <div className="bg-yellow-400 text-yellow-900 text-center text-sm font-semibold py-1 px-4">
          ⚠️ TEST MODE — Stripe is using test keys. No real charges will be made.
        </div>
      )}
      {children}
    </div>
  )
}
