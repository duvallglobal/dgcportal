import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a2e] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[#e2b714] mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2 bg-[#e2b714] text-[#1a1a2e] font-semibold rounded-lg hover:bg-[#c9a112] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
