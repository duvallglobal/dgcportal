'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  LayoutDashboard, FileText, FileSignature,
  LifeBuoy, Users, Tag, MessageCircle,
  Star, Cpu, AlertTriangle, Menu, X, ChevronLeft, ChevronRight,
  Wand2, type LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { ChatWidget } from '@/components/chat-widget'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const clientNavGroups: NavGroup[] = [
  {
    label: 'Project',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Project Intake', href: '/dashboard/intake', icon: FileText },
      { label: 'Agreement', href: '/dashboard/agreement', icon: FileSignature },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
      { label: 'AI Chat', href: '/dashboard/chat', icon: MessageCircle },
    ],
  },
]

const adminNavGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Clients', href: '/admin/clients', icon: Users },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Services', href: '/admin/services', icon: Tag },
      { label: 'Tickets', href: '/admin/tickets', icon: LifeBuoy },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { label: 'AI Agent', href: '/admin/ai', icon: Wand2 },
      { label: 'AI Settings', href: '/admin/settings/ai', icon: Cpu },
    ],
  },
]

function getIsActive(pathname: string, href: string, allItems: NavItem[]): boolean {
  if (pathname === href) return true
  if (href === '/admin' || href === '/dashboard') return false
  return (
    pathname.startsWith(href + '/') &&
    !allItems.some(
      (other) =>
        other.href !== href &&
        other.href.length > href.length &&
        pathname.startsWith(other.href)
    )
  )
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const isAdminRoute = pathname.startsWith('/admin')
  const navGroups = isAdminRoute ? adminNavGroups : clientNavGroups
  const allNavItems = navGroups.flatMap((g) => g.items)
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

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col transition-all lg:translate-x-0 lg:static',
        'bg-gradient-to-b from-[#1a1a2e] to-[#16162a] text-white',
        collapsed ? 'w-[68px]' : 'w-64',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className={cn('border-b border-white/[0.08]', collapsed ? 'p-3' : 'p-5')}>
          <div className="flex items-center justify-between">
            <Link href={isAdminRoute ? '/admin' : '/dashboard'} className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#e2b714] rounded-lg flex items-center justify-center font-bold text-[#1a1a2e] text-sm shrink-0 shadow-md shadow-[#e2b714]/20">
                D
              </div>
              {!collapsed && (
                <div>
                  <span className="font-bold text-base tracking-tight">DGC Portal</span>
                  <div className="text-[10px] uppercase tracking-widest text-[#e2b714]/80 font-medium -mt-0.5">
                    {isAdminRoute ? 'Admin Panel' : 'Client Portal'}
                  </div>
                </div>
              )}
            </Link>
            <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navGroups.map((group, groupIdx) => (
            <div key={group.label} className={cn(groupIdx > 0 && 'mt-2')}>
              {!collapsed && (
                <div className="px-5 mb-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                    {group.label}
                  </span>
                </div>
              )}
              {collapsed && groupIdx > 0 && (
                <div className="mx-3 mb-2 border-t border-white/[0.06]" />
              )}
              <div className="px-2.5 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = getIsActive(pathname, item.href, allNavItems)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg text-[13px] transition-all duration-150 relative group',
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                        isActive
                          ? 'bg-[#e2b714]/15 text-[#e2b714] font-medium'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#e2b714] rounded-r-full" />
                      )}
                      <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-[#e2b714]')} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* User */}
        {!collapsed ? (
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <UserButton />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{user?.fullName || 'User'}</div>
                <div className="text-[11px] text-white/40 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-white/[0.06] flex justify-center">
            <UserButton />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {isTestMode && (
          <div className="bg-[#e2b714] text-[#1a1a2e] text-center text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            TEST MODE — Stripe is in test mode. No real charges will occur.
          </div>
        )}

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#e2b714] rounded flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#1a1a2e]">D</span>
            </div>
            <span className="font-bold text-sm text-[#1a1a2e]">DGC Portal</span>
          </div>
          <UserButton />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Floating Chat Widget (client dashboard only) */}
      {!isAdminRoute && <ChatWidget />}
    </div>
  )
}
