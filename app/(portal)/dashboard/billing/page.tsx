'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2, Receipt, Calendar } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  payment_type: string
  description: string | null
  created_at: string
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
}

interface Subscription {
  id: string
  status: string
  stripe_subscription_id: string
  current_period_start: string | null
  current_period_end: string | null
}

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  succeeded: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
}

const SUB_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  past_due: { label: 'Past Due', color: 'bg-red-100 text-red-800' },
  canceled: { label: 'Canceled', color: 'bg-gray-100 text-gray-700' },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  const success = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch('/api/billing')
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        setSubscriptions(data.subscriptions || [])
      }
    } catch (_err) {
      console.error('Failed to fetch billing:', _err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBilling() }, [fetchBilling])

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Could not open billing portal')
    } catch (_err) {
      console.error('Portal error:', _err)
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  const totalPaid = payments.filter((p) => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-gray-500 mt-1">View your payment history and manage your subscription.</p>
        </div>
        <Button onClick={openPortal} disabled={portalLoading} variant="outline">
          {portalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
          Manage Payment Method
        </Button>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">Payment successful! It may take a moment to appear below.</p>
        </div>
      )}
      {canceled && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">Payment was canceled.</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Total Paid</div>
            <div className="text-2xl font-bold text-green-600">${(totalPaid / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Transactions</div>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Active Subscriptions</div>
            <div className="text-2xl font-bold">{subscriptions.filter((s) => s.status === 'active').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5" /> Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const status = SUB_STATUS[sub.status] || SUB_STATUS.active
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium text-sm">Monthly Retainer</div>
                      {sub.current_period_end && (
                        <div className="text-xs text-gray-500">Next billing: {new Date(sub.current_period_end).toLocaleDateString()}</div>
                      )}
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-5 w-5" /> Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No payments yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">Date</th>
                    <th className="pb-3 font-medium text-gray-500">Description</th>
                    <th className="pb-3 font-medium text-gray-500">Type</th>
                    <th className="pb-3 font-medium text-gray-500 text-right">Amount</th>
                    <th className="pb-3 font-medium text-gray-500 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const status = PAYMENT_STATUS[payment.status] || PAYMENT_STATUS.pending
                    return (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="py-3">{new Date(payment.created_at).toLocaleDateString()}</td>
                        <td className="py-3">{payment.description || '—'}</td>
                        <td className="py-3 capitalize">{payment.payment_type?.replace('_', ' ') || '—'}</td>
                        <td className="py-3 text-right font-medium">${(payment.amount / 100).toFixed(2)}</td>
                        <td className="py-3 text-right"><Badge className={status.color}>{status.label}</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
