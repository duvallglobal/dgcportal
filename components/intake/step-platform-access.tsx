'use client'

import type { IntakeFormData } from '@/components/intake/types'
import { Label } from '@/components/ui/label'
import { ShieldAlert } from 'lucide-react'

interface Props {
  formData: IntakeFormData
  updateFormData: (updates: Partial<IntakeFormData>) => void
}

export function StepPlatformAccess({ formData, updateFormData }: Props) {
  function updateCredential(
    key: keyof IntakeFormData['platformCredentials'],
    value: string
  ) {
    updateFormData({
      platformCredentials: { ...formData.platformCredentials, [key]: value },
    })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Platform Access</h2>

      <div className="flex items-start gap-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg p-4">
        <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium">Your credentials are encrypted</p>
          <p>All platform access details are encrypted at rest and only accessible by our team during your project.</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Share login details or access instructions for any platforms we'll need to work with.
        Include usernames, passwords, or invite instructions.
      </p>

      {[
        { key: 'googleBusiness' as const, label: 'Google Business Profile', placeholder: 'Login email / password or how to grant access' },
        { key: 'hosting' as const, label: 'Website Hosting', placeholder: 'Hosting provider, login details, or cPanel access' },
        { key: 'domainRegistrar' as const, label: 'Domain Registrar', placeholder: 'GoDaddy, Namecheap, etc. — login or transfer code' },
        { key: 'socialAccounts' as const, label: 'Social Media Accounts', placeholder: 'Instagram, Facebook page admin access, etc.' },
        { key: 'other' as const, label: 'Other Platforms', placeholder: 'Any other logins — POS, CRM, email marketing, etc.' },
      ].map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{label}</Label>
          <textarea
            id={key}
            value={formData.platformCredentials[key]}
            onChange={(e) => updateCredential(key, e.target.value)}
            placeholder={placeholder}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      ))}
    </div>
  )
}
