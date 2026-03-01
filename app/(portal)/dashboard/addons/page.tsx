'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  tagline: string | null
  capabilities: string | null
  price_amount: number | null
  stripe_price_id: string | null
  category: string
}

interface PurchasedAddon {
  id: string
  service_id: string
  status: string
  created_at: string
}

function AddonsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-44 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-80 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="flex gap-1 mt-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-5 w-16 bg-gray-100 rounded-full" />
                ))}
              </div>
              <div className="h-7 w-20 bg-gray-200 rounded mt-2" />
              <div className="h-10 w-full bg-gray-200 rounded mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AddonsContent() {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [purchased, setPurchased] = useState<PurchasedAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const success = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/addons')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services || [])
        setPurchased(data.purchased || [])
      }
    } catch (err) {
      console.error('Failed to fetch addons:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handlePurchase = async (serviceId: string) => {
    setPurchasing(serviceId)
    try {
      const res = await fetch('/api/addons/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } catch (err) {
      console.error('Purchase error:', err)
    } finally {
      setPurchasing(null)
    }
  }

  const isPurchased = (serviceId: string) =>
    purchased.some((p) => p.service_id === serviceId && ['paid', 'active', 'completed'].includes(p.status))

  if (loading) return <AddonsSkeleton />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add-on Services</h1>
        <p className="text-gray-500 mt-1">Enhance your project with additional services from our catalog.</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">Add-on purchased successfully! We&apos;ll get started on it right away.</p>
        </div>
      )}
      {canceled && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">Purchase was canceled. You can add services any time.</p>
        </div>
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Add-on Services Available</h3>
            <p className="text-sm text-gray-500 mt-2">Check back soon \u2014 new services are added regularly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const alreadyPurchased = isPurchased(service.id)
            const hasPrice = !!service.stripe_price_id

            return (
              <Card key={service.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    {service.category === 'addon' && (
                      <Badge variant="outline" className="text-xs">Add-on</Badge>
                    )}
                  </div>
                  {service.tagline && (
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {service.tagline}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-600 mb-4 flex-1">{service.description}</p>

                  {service.capabilities && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {service.capabilities.split(',').slice(0, 4).map((cap, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {cap.trim()}
                          </span>
                        ))}
                        {service.capabilities.split(',').length > 4 && (
                          <span className="text-xs text-gray-400">
                            +{service.capabilities.split(',').length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {service.price_amount && (
                    <div className="text-lg font-bold mb-4">${(service.price_amount / 100).toFixed(2)}</div>
                  )}

                  {alreadyPurchased ? (
                    <Button disabled className="w-full bg-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" /> Purchased
                    </Button>
                  ) : hasPrice ? (
                    <Button
                      className="w-full"
                      onClick={() => handlePurchase(service.id)}
                      disabled={purchasing === service.id}
                    >
                      {purchasing === service.id
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                        : <><ShoppingBag className="h-4 w-4 mr-2" /> Add to Project</>}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Contact for Pricing
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AddonsPage() {
  return (
    <Suspense fallback={<AddonsSkeleton />}>
      <AddonsContent />
    </Suspense>
  )
}
