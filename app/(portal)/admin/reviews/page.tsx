'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  review: string | null
  testimonial_permission: boolean
  completed_at: string
  clients: { full_name: string; business_name: string | null } | null
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState('all')

  const fetchReviews = useCallback(async () => {
    try {
      const params = ratingFilter !== 'all' ? `?rating=${ratingFilter}` : ''
      const res = await fetch(`/api/admin/reviews${params}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (_err) { console.error(_err) }
    finally { setLoading(false) }
  }, [ratingFilter])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Client Reviews</h1>
          <p className="text-gray-500 mt-1">{reviews.length} reviews collected</p>
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {reviews.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No reviews yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{r.clients?.full_name || 'Client'}</span>
                      {r.clients?.business_name && <span className="text-xs text-gray-400">{r.clients.business_name}</span>}
                      {r.testimonial_permission && <Badge className="bg-green-100 text-green-700 text-xs">Testimonial OK</Badge>}
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={cn('h-4 w-4', n <= r.rating ? 'fill-[#e2b714] text-[#e2b714]' : 'text-gray-200')} />
                      ))}
                    </div>
                    {r.review && <p className="text-sm text-gray-700">{r.review}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.completed_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
