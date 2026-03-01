import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center text-white px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#e2b714] rounded-2xl flex items-center justify-center">
            <span className="text-[#1a1a2e] font-bold text-2xl">D</span>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">DGC Client Portal</h1>
          <p className="text-white/60 mt-2">Manage your projects, billing, and support in one place.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/sign-in"
            className="block w-full bg-[#e2b714] text-[#1a1a2e] font-bold py-3 px-6 rounded-lg hover:bg-[#c9a112] transition-colors text-center"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="block w-full bg-white/10 text-white font-medium py-3 px-6 rounded-lg hover:bg-white/20 transition-colors text-center"
          >
            Create Account
          </Link>
        </div>
        <p className="text-xs text-white/40">
          Powered by <a href="https://dgc.today" target="_blank" rel="noopener noreferrer" className="text-[#e2b714] hover:underline">DGC.today</a>
        </p>
      </div>
    </div>
  )
}
