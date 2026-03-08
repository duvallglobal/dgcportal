'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react'
import { AddonServiceCard } from '@/components/dashboard/addon-service-card'
import type { AddonService } from '@/components/dashboard/addon-service-card'

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
            <div className="p-6 space-y-3">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-7 w-20 bg-gray-200 rounded mt-2" />
              <div className="h-10 w-full bg-gray-200 rounded mt-2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AddonsContent() {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<AddonService[]>([])
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    purchased.some(
      (p) =>
        p.service_id === serviceId &&
        ['paid', 'active', 'completed'].includes(p.status)
    )

  if (loading) return <AddonsSkeleton />

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add-on Services</h1>
        <p className="text-gray-500 mt-1">
          Enhance your project with additional services from our catalog.
        </p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            Add-on purchased successfully! We&apos;ll get started on it right away.
          </p>
        </div>
      )}
      {canceled && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            Purchase was canceled. You can add services any time.
          </p>
        </div>
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">
              No Add-on Services Available
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Check back soon &mdash; new services are added regularly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <AddonServiceCard
              key={service.id}
              service={service}
              purchased={isPurchased(service.id)}
              purchasing={purchasing === service.id}
              onPurchase={() => handlePurchase(service.id)}
            />
          ))}
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
