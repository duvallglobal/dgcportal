'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  stripe_price_id: string
  price_amount: number
}

export default function AdminClientBillingPage() {
  const params = useParams()
  const clientId = params.id as string
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState('')
  const [currentSub, setCurrentSub] = useState<{ plan_name?: string; amount?: number; status: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch('/api/admin/services?active_only=true'),
        fetch(`/api/admin/clients/${clientId}/subscription`),
      ])
      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans((data.services || []).filter((s: Plan) => s.stripe_price_id))
      }
      if (subRes.ok) {
        const data = await subRes.json()
        setCurrentSub(data.subscription || null)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [clientId])

  useEffect(() => { fetchData() }, [fetchData])

  const assignSubscription = async () => {
    if (!selectedPlan) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: selectedPlan }),
      })
      if (res.ok) {
        await fetchData()
        alert('Subscription assigned successfully!')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to assign subscription')
      }
    } catch (err) { console.error(err) }
    finally { setAssigning(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/admin/clients/${clientId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to client
      </Link>

      <h1 className="text-2xl font-bold mb-6">Manage Subscription</h1>

      {currentSub && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Current Subscription</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{currentSub.plan_name || 'Active Plan'}</div>
                <div className="text-sm text-gray-500">${((currentSub.amount || 0) / 100).toFixed(2)}/month</div>
              </div>
              <Badge>{currentSub.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Assign Subscription Plan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger><SelectValue placeholder="Choose a plan..." /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.stripe_price_id}>
                    {p.name} — ${(p.price_amount / 100).toFixed(2)}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={assignSubscription} disabled={!selectedPlan || assigning}>
            {assigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
            Assign Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
