'use client'

import type { IntakeFormData, IntakeFiles } from '@/components/intake/types'

interface Props {
  formData: IntakeFormData
  files: IntakeFiles
}

export function StepReview({ formData, files }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review & Submit</h2>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-700">Business Info</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Business Name</span>
          <span>{formData.businessName || '\u2014'}</span>
          <span className="text-gray-500">Industry</span>
          <span>{formData.industry || '\u2014'}</span>
          <span className="text-gray-500">Website</span>
          <span>{formData.websiteUrl || 'None'}</span>
          <span className="text-gray-500">Phone</span>
          <span>{formData.phone || '\u2014'}</span>
          <span className="text-gray-500">Email</span>
          <span>{formData.email || '\u2014'}</span>
          <span className="text-gray-500">Location</span>
          <span>{formData.location || '\u2014'}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-700">Goals & Services</h3>
        <div className="text-sm space-y-2">
          <div>
            <span className="text-gray-500">Services: </span>
            {formData.servicesInterested.join(', ') || 'None selected'}
          </div>
          <div>
            <span className="text-gray-500">Goals: </span>
            {formData.goals || 'Not provided'}
          </div>
          <div>
            <span className="text-gray-500">Timeline: </span>
            {formData.timeline || '\u2014'}
            {' | '}
            <span className="text-gray-500">Budget: </span>
            {formData.budgetRange || '\u2014'}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-700">Branding</h3>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Colors:</span>
            {formData.brandColors.map((c, i) => (
              <span
                key={i}
                className="inline-block w-5 h-5 rounded border"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div>
            <span className="text-gray-500">Fonts: </span>
            {formData.fonts || 'Not specified'}
          </div>
          <div>
            <span className="text-gray-500">Logos: </span>
            {files.logos.length > 0
              ? files.logos.map((f) => f.name).join(', ')
              : 'Not uploaded'}
          </div>
          <div>
            <span className="text-gray-500">Brand Guide: </span>
            {files.brandGuide?.name || 'Not uploaded'}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-700">Platform Access</h3>
        <p className="text-sm text-gray-600">
          {Object.values(formData.platformCredentials).some((v) => v.trim())
            ? `\u2705 Credentials provided for ${Object.entries(formData.platformCredentials).filter(([, v]) => v.trim()).length} platform(s) (encrypted on submit)`
            : 'No credentials provided'}
        </p>
      </div>
    </div>
  )
}
