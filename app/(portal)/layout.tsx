'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  LayoutDashboard, FileText, Package, FileSignature, CreditCard,
  ShoppingBag, LifeBuoy, Users, Tag, MessageCircle, Settings,
  Star, Cpu, AlertTriangle, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const clientNav = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Project Intake', href: '/dashboard/intake', icon: FileText },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { label: 'Agreement', href: '/dashboard/agreement', icon: FileSignature },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Add-ons', href: '/dashboard/addons', icon: ShoppingBag },
  { label: 'AI Chat', href: '/dashboard/chat', icon: MessageCircle },
  { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
]

const adminNav = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Services', href: '/admin/services', icon: Tag },
  { label: 'Tickets', href: '/admin/tickets', icon: LifeBuoy },
  { label: 'Inventory', href: '/admin/inventory', icon: Package },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'AI Settings', href: '/admin/settings/ai', icon: Cpu },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const isAdmin = (user?.publicMetadata as Record<string, string> | undefined)?.role === 'admin'
  const isAdminRoute = pathname.startsWith('/admin')
  const nav = isAdminRoute ? adminNav : clientNav
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isTestMode = mounted && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test')

  return (
    <div className="min-h-screen flex bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 bg-[#1a1a2e] text-white flex flex-col transition-all lg:translate-x-0 lg:static',
        collapsed ? 'w-16' : 'w-64',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href={isAdminRoute ? '/admin' : '/dashboard'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#e2b714] rounded-lg flex items-center justify-center font-bold text-[#1a1a2e] text-sm shrink-0">D</div>
              {!collapsed && <span className="font-bold text-lg">DGC Portal</span>}
            </Link>
            <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          {isAdmin && !collapsed && (
            <div className="mt-3 flex gap-1">
              <Link href="/dashboard" className={cn('text-xs px-2 py-1 rounded', !isAdminRoute ? 'bg-[#e2b714] text-[#1a1a2e]' : 'text-white/60 hover:text-white')}>
                Client View
              </Link>
              <Link href="/admin" className={cn('text-xs px-2 py-1 rounded', isAdminRoute ? 'bg-[#e2b714] text-[#1a1a2e]' : 'text-white/60 hover:text-white')}>
                Admin
              </Link>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-[#e2b714] text-[#1a1a2e] font-medium'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-white/10 text-white/50 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {!collapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <UserButton />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{user?.fullName || 'User'}</div>
                <div className="text-xs text-white/50 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="p-3 border-t border-white/10 flex justify-center">
            <UserButton />
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {isTestMode && (
          <div className="bg-yellow-400 text-yellow-900 text-center text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            TEST MODE — Stripe is in test mode. No real charges will occur.
          </div>
        )}

        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-[#1a1a2e]">DGC Portal</span>
          <UserButton />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
