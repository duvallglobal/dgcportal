'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Target, Palette, KeyRound, CheckCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IntakeFormData, IntakeFiles } from '@/components/intake/types'
import { initialIntakeData } from '@/components/intake/types'
import { StepBusinessInfo } from '@/components/intake/step-business-info'
import { StepGoalsNeeds } from '@/components/intake/step-goals-needs'
import { StepBrandingAssets } from '@/components/intake/step-branding-assets'
import { StepPlatformAccess } from '@/components/intake/step-platform-access'
import { StepReview } from '@/components/intake/step-review'

const STEPS = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'Goals & Needs', icon: Target },
  { id: 3, label: 'Branding', icon: Palette },
  { id: 4, label: 'Platform Access', icon: KeyRound },
  { id: 5, label: 'Review & Submit', icon: CheckCircle },
]

export default function IntakePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<IntakeFormData>(initialIntakeData)
  const [files, setFiles] = useState<IntakeFiles>({ logos: [], brandGuide: null })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const updateFormData = useCallback((updates: Partial<IntakeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('business_name', formData.businessName)
      fd.append('industry', formData.industry)
      fd.append('website_url', formData.websiteUrl)
      fd.append('phone', formData.phone)
      fd.append('email', formData.email)
      fd.append('location', formData.location)
      fd.append('services_interested', JSON.stringify(formData.servicesInterested))
      fd.append('goals', formData.goals)
      fd.append('timeline', formData.timeline)
      fd.append('budget_range', formData.budgetRange)
      fd.append('brand_colors', JSON.stringify(formData.brandColors))
      fd.append('fonts', formData.fonts)
      fd.append('social_links', JSON.stringify(formData.socialLinks))

      const credentialLines = Object.entries(formData.platformCredentials)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `${k}:\n${v}`)
        .join('\n\n')
      fd.append('platform_credentials', credentialLines)

      files.logos.forEach((logo) => fd.append('file_logo', logo))
      if (files.brandGuide) fd.append('file_brand_guide', files.brandGuide)

      const res = await fetch('/api/intake/submit', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Intake Submitted!</h1>
        <p className="text-gray-600 mb-6">
          We&apos;ve received your project information. Our team will review it and reach out
          within 24-48 hours.
        </p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Project Intake</h1>
        <p className="text-gray-500 mt-1">
          Tell us about your business so we can build the perfect solution.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => s.id < step && setStep(s.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              step === s.id
                ? 'bg-blue-600 text-white'
                : s.id < step
                  ? 'bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
            disabled={s.id > step}
          >
            <s.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.id}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 1 && (
            <StepBusinessInfo formData={formData} updateFormData={updateFormData} />
          )}
          {step === 2 && (
            <StepGoalsNeeds formData={formData} updateFormData={updateFormData} />
          )}
          {step === 3 && (
            <StepBrandingAssets
              formData={formData}
              updateFormData={updateFormData}
              files={files}
              setFiles={setFiles}
            />
          )}
          {step === 4 && (
            <StepPlatformAccess formData={formData} updateFormData={updateFormData} />
          )}
          {step === 5 && <StepReview formData={formData} files={files} />}

          <div className="flex justify-between pt-6 mt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {step < 5 ? (
              <Button onClick={() => setStep((s) => Math.min(5, s + 1))}>
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Intake'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
