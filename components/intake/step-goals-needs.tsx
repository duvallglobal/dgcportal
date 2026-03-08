'use client'

import type { IntakeFormData } from '@/components/intake/types'
import { Label } from '@/components/ui/label'

const DGC_SERVICES = [
  'Website Development',
  'AI Automation',
  'E-commerce Solutions',
  'Custom App Development',
  'SEO & Paid Advertising',
  'Social Media Management',
  'LLC Formation',
]

const TIMELINES = [
  'ASAP (1-2 weeks)',
  'Short-term (1 month)',
  'Standard (2-3 months)',
  'Flexible / No rush',
]

const BUDGETS = [
  'Under $1,000',
  '$1,000 - $2,500',
  '$2,500 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000+',
  'Not sure yet',
]

interface Props {
  formData: IntakeFormData
  updateFormData: (updates: Partial<IntakeFormData>) => void
}

export function StepGoalsNeeds({ formData, updateFormData }: Props) {
  function toggleService(service: string) {
    const current = formData.servicesInterested
    if (current.includes(service)) {
      updateFormData({ servicesInterested: current.filter((s) => s !== service) })
    } else {
      updateFormData({ servicesInterested: [...current, service] })
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Goals & Needs</h2>

      <div className="space-y-2">
        <Label>Which services are you interested in? *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DGC_SERVICES.map((service) => (
            <label
              key={service}
              className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                formData.servicesInterested.includes(service)
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-muted/50'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.servicesInterested.includes(service)}
                onChange={() => toggleService(service)}
                className="rounded"
              />
              <span className="text-sm">{service}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goals">Primary Goals *</Label>
        <textarea
          id="goals"
          value={formData.goals}
          onChange={(e) => updateFormData({ goals: e.target.value })}
          placeholder="What do you want to achieve? More leads? Online sales? Better brand presence?"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timeline">Timeline</Label>
          <select
            id="timeline"
            value={formData.timeline}
            onChange={(e) => updateFormData({ timeline: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select timeline</option>
            {TIMELINES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budgetRange">Budget Range</Label>
          <select
            id="budgetRange"
            value={formData.budgetRange}
            onChange={(e) => updateFormData({ budgetRange: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select budget</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
