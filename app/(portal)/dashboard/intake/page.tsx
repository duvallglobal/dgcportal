'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepBusinessInfo } from '@/components/intake/step-business-info'
import { StepGoalsNeeds } from '@/components/intake/step-goals-needs'
import { StepBrandingAssets } from '@/components/intake/step-branding-assets'
import { StepPlatformAccess } from '@/components/intake/step-platform-access'
import { StepReviewSubmit } from '@/components/intake/step-review-submit'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

export interface IntakeFormData {
  // Step 1 - Business Info
  businessName: string
  industry: string
  websiteUrl: string
  phone: string
  email: string
  location: string
  // Step 2 - Goals & Needs
  servicesInterested: string[]
  goals: string
  timeline: string
  budgetRange: string
  // Step 3 - Branding Assets
  brandColors: string[]
  fonts: string
  socialLinks: {
    instagram: string
    facebook: string
    tiktok: string
    linkedin: string
    twitter: string
    other: string
  }
  // Step 4 - Platform Access
  platformCredentials: {
    googleBusiness: string
    hosting: string
    domainRegistrar: string
    socialAccounts: string
    other: string
  }
}

const STEPS = [
  { id: 1, title: 'Business Info' },
  { id: 2, title: 'Goals & Needs' },
  { id: 3, title: 'Branding Assets' },
  { id: 4, title: 'Platform Access' },
  { id: 5, title: 'Review & Submit' },
]

const INITIAL_FORM_DATA: IntakeFormData = {
  businessName: '',
  industry: '',
  websiteUrl: '',
  phone: '',
  email: '',
  location: '',
  servicesInterested: [],
  goals: '',
  timeline: '',
  budgetRange: '',
  brandColors: ['#000000'],
  fonts: '',
  socialLinks: { instagram: '', facebook: '', tiktok: '', linkedin: '', twitter: '', other: '' },
  platformCredentials: { googleBusiness: '', hosting: '', domainRegistrar: '', socialAccounts: '', other: '' },
}

export default function IntakePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<IntakeFormData>(INITIAL_FORM_DATA)
  const [files, setFiles] = useState<{ logos: File[]; brandGuide: File | null }>({
    logos: [],
    brandGuide: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateFormData(updates: Partial<IntakeFormData>) {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const submitData = new FormData()
      submitData.append('formData', JSON.stringify(formData))

      files.logos.forEach((file) => {
        submitData.append('logos', file)
      })
      if (files.brandGuide) {
        submitData.append('brandGuide', files.brandGuide)
      }

      const response = await fetch('/api/intake/submit', {
        method: 'POST',
        body: submitData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit intake form')
      }

      router.push('/dashboard?intake=submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Project Intake</h1>
      <p className="text-muted-foreground mb-8">
        Tell us about your business so we can build the perfect solution for you.
      </p>

      {/* Progress Stepper */}
      <div className="flex items-center mb-10">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-muted'
                }`}
              >
                {step.id}
              </div>
              <span className="text-xs mt-1 text-center hidden sm:block">{step.title}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        {currentStep === 1 && (
          <StepBusinessInfo formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 2 && (
          <StepGoalsNeeds formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 3 && (
          <StepBrandingAssets
            formData={formData}
            updateFormData={updateFormData}
            files={files}
            setFiles={setFiles}
          />
        )}
        {currentStep === 4 && (
          <StepPlatformAccess formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 5 && <StepReviewSubmit formData={formData} files={files} />}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < 5 ? (
          <Button onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Intake'}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
