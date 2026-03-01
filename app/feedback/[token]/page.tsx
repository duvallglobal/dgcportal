'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FeedbackPage() {
  const params = useParams()
  const token = params.token as string
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [testimonialOk, setTestimonialOk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, review, testimonial_permission: testimonialOk }),
      })
      if (res.ok) setSubmitted(true)
      else alert('Failed to submit. The link may have expired.')
    } catch (_err) { alert('Submission failed.') }
    finally { setSubmitting(false) }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Thank You!</h2>
            <p className="text-gray-500">Your feedback means the world to us. We appreciate your trust in DGC.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1a1a2e]">How'd We Do?</h1>
            <p className="text-gray-500 mt-1 text-sm">Your feedback helps us improve our services.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={cn('h-10 w-10', (hoverRating || rating) >= n ? 'fill-[#e2b714] text-[#e2b714]' : 'text-gray-300')} />
                </button>
              ))}
            </div>
            <div>
              <Label>Tell us more (optional)</Label>
              <Textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="What went well? What could be improved?" rows={4} />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={testimonialOk} onChange={(e) => setTestimonialOk(e.target.checked)} className="mt-1" />
              <span className="text-sm text-gray-600">May we use this as a testimonial on our website?</span>
            </label>
            <Button type="submit" className="w-full bg-[#e2b714] hover:bg-[#c9a112] text-[#1a1a2e]" disabled={rating === 0 || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
