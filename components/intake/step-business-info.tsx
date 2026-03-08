'use client'

import type { IntakeFormData } from '@/components/intake/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const INDUSTRIES = [
  'Hair Salons & Spas',
  'Restaurants',
  'Cleaning Services',
  'Home Services / HVAC / Contractors',
  'Real Estate',
  'E-commerce / Retail',
  'Legal Services',
  'Thrift Stores & Resellers',
  'Events & Entertainment',
  'Fitness Studios',
  'Auto Repair',
  'Dental Practices',
  'Healthcare',
  'Professional Services',
  'Other',
]

interface Props {
  formData: IntakeFormData
  updateFormData: (updates: Partial<IntakeFormData>) => void
}

export function StepBusinessInfo({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Business Information</h2>

      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          value={formData.businessName}
          onChange={(e) => updateFormData({ businessName: e.target.value })}
          placeholder="Your Business Name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry *</Label>
        <select
          id="industry"
          value={formData.industry}
          onChange={(e) => updateFormData({ industry: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        >
          <option value="">Select your industry</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Current Website URL (optional)</Label>
        <Input
          id="websiteUrl"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
          placeholder="https://yourbusiness.com"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="(555) 123-4567"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="you@business.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Physical Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => updateFormData({ location: e.target.value })}
          placeholder="City, State"
        />
      </div>
    </div>
  )
}
