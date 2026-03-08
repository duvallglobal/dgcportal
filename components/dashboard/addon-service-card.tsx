'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, CheckCircle, Loader2, Sparkles } from 'lucide-react'

export interface AddonService {
  id: string
  name: string
  description: string | null
  tagline: string | null
  capabilities: string | null
  price_amount: number | null
  stripe_price_id: string | null
  category: string
}

interface AddonServiceCardProps {
  service: AddonService
  purchased: boolean
  purchasing: boolean
  onPurchase: () => void
}

export function AddonServiceCard({
  service,
  purchased,
  purchasing,
  onPurchase,
}: AddonServiceCardProps) {
  const hasPrice = !!service.stripe_price_id

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{service.name}</CardTitle>
          {service.category === 'addon' && (
            <Badge variant="outline" className="text-xs">
              Add-on
            </Badge>
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
              {service.capabilities
                .split(',')
                .slice(0, 4)
                .map((cap, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
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
          <div className="text-lg font-bold mb-4">
            ${(service.price_amount / 100).toFixed(2)}
          </div>
        )}

        {purchased ? (
          <Button disabled className="w-full bg-green-600">
            <CheckCircle className="h-4 w-4 mr-2" /> Purchased
          </Button>
        ) : hasPrice ? (
          <Button className="w-full" onClick={onPurchase} disabled={purchasing}>
            {purchasing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 mr-2" /> Add to Project
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Contact for Pricing
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
