import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { FileText, CreditCard, LifeBuoy, FileSignature, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { ReviewPrompt } from '@/components/review-prompt'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createServerSupabaseClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, business_name, onboarding_status')
    .eq('clerk_user_id', user.userId)
    .single()

  const clientId = client?.id
  const empty = Promise.resolve({ data: [] as Record<string, unknown>[], count: 0, error: null })

  const [intakes, agreements, tickets, payments, reviews] = await Promise.all([
    clientId
      ? supabase.from('project_intakes').select('id, status', { count: 'exact' }).eq('client_id', clientId)
      : empty,
    clientId
      ? supabase.from('service_agreements').select('id, status', { count: 'exact' }).eq('client_id', clientId)
      : empty,
    clientId
      ? supabase.from('support_tickets').select('id, status', { count: 'exact' }).eq('client_id', clientId).in('status', ['open', 'in_progress'])
      : empty,
    clientId
      ? supabase.from('payments').select('id, amount', { count: 'exact' }).eq('client_id', clientId).eq('status', 'succeeded')
      : empty,
    clientId
      ? supabase.from('feedback_reviews').select('id, rating').eq('client_id', clientId).limit(1)
      : empty,
  ])

  const existingReview = (reviews.data as Record<string, unknown>[])?.[0]
  const showReviewPrompt = clientId && (client?.onboarding_status === 'closed' || client?.onboarding_status === 'maintenance')

  const cards = [
    { title: 'Project Intakes', value: intakes.count ?? 0, icon: FileText, href: '/dashboard/intake', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Agreements', value: agreements.count ?? 0, icon: FileSignature, href: '/dashboard/agreement', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Open Tickets', value: tickets.count ?? 0, icon: LifeBuoy, href: '/dashboard/support', color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Payments', value: payments.count ?? 0, icon: CreditCard, href: '/dashboard/billing', color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const onboardingSteps = [
    { label: 'Submit project intake', href: '/dashboard/intake', done: (intakes.count ?? 0) > 0 },
    { label: 'Sign service agreement', href: '/dashboard/agreement', done: (agreements.data as Record<string, unknown>[])?.some((a) => a.status !== 'unsigned') },
    { label: 'Pay deposit', href: '/dashboard/agreement', done: (agreements.data as Record<string, unknown>[])?.some((a) => a.status === 'deposit_paid' || a.status === 'active') },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">
          Welcome back{client?.full_name ? `, ${client.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-gray-500 mt-1">{client?.business_name || 'Your DGC Client Portal'}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-gray-300 group">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('p-2 rounded-lg', card.bg)}>
                    <card.icon className={cn('h-5 w-5', card.color)} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <div className="text-2xl font-bold text-[#1a1a2e]">{card.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{card.title}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Onboarding Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {onboardingSteps.map((step) => (
              <Link key={step.label} href={step.href} className="flex items-center gap-3 group">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  step.done
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-[#e2b714]/10 group-hover:text-[#e2b714]'
                )}>
                  {step.done ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>
                <span className={cn(
                  'text-sm transition-colors',
                  step.done ? 'text-gray-500 line-through' : 'text-gray-700 group-hover:text-[#1a1a2e] font-medium'
                )}>
                  {step.label}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/dashboard/intake" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#e2b714]/30 hover:bg-[#e2b714]/5 transition-all">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Start Project Intake</div>
                <div className="text-xs text-gray-500">Tell us about your business</div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link href="/dashboard/support/new" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#e2b714]/30 hover:bg-[#e2b714]/5 transition-all">
              <div className="p-2 bg-orange-50 rounded-lg">
                <LifeBuoy className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Open Support Ticket</div>
                <div className="text-xs text-gray-500">Get help from our team</div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link href="/dashboard/addons" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#e2b714]/30 hover:bg-[#e2b714]/5 transition-all">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Browse Add-ons</div>
                <div className="text-xs text-gray-500">Enhance your project with extra services</div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Review Prompt */}
      {showReviewPrompt && clientId && (
        <ReviewPrompt
          clientId={clientId}
          existingRating={existingReview?.rating as number | null | undefined}
        />
      )}
    </div>
  )
}
