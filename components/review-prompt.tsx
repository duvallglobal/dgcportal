'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewPromptProps {
  clientId: string
  existingRating?: number | null
}

export function ReviewPrompt({ clientId, existingRating }: ReviewPromptProps) {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingRating)

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-6 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800 font-medium">Thank you for your feedback! Your review helps us improve.</p>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, rating, comment: comment.trim() }),
      })
      if (res.ok) {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Review submission error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-[#e2b714]/30 bg-[#e2b714]/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-5 w-5 text-[#e2b714] fill-[#e2b714]" />
          How are we doing?
        </CardTitle>
        <p className="text-sm text-gray-600">
          Your project is underway! We&apos;d love to hear your feedback.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoveredStar(n)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-7 w-7 transition-colors',
                    n <= (hoveredStar || rating)
                      ? 'fill-[#e2b714] text-[#e2b714]'
                      : 'text-gray-300'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience (optional)..."
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
          ) : (
            'Submit Review'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
