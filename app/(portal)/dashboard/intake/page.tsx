'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Building2, Target, Palette, KeyRound, CheckCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'Goals & Needs', icon: Target },
  { id: 3, label: 'Branding', icon: Palette },
  { id: 4, label: 'Platform Access', icon: KeyRound },
  { id: 5, label: 'Review & Submit', icon: CheckCircle },
]

const INDUSTRIES = [
  'Hair Salons and Spas', 'Restaurants', 'Cleaning Services', 'Home Services',
  'Real Estate', 'E-commerce', 'Legal Services', 'Thrift Stores and Resellers',
  'Events and Entertainment', 'Fitness Studios', 'Auto Repair', 'Dental Practices',
  'Healthcare', 'Professional Services', 'Retail Boutiques', 'Other',
]

const SERVICES = [
  'Website Development', 'AI Automation', 'E-commerce Solutions',
  'Custom App Development', 'SEO and Paid Advertising',
  'Social Media Management', 'LLC Formation',
]

const BUDGETS = [
  'Under $1,000', '$1,000 - $2,500', '$2,500 - $5,000',
  '$5,000 - $10,000', '$10,000 - $25,000', '$25,000+', 'Not sure yet',
]

const TIMELINES = [
  'ASAP', '1-2 weeks', '1 month', '2-3 months', '3-6 months', 'Flexible',
]

interface IntakeData {
  business_name: string
  industry: string
  website_url: string
  phone: string
  email: string
  location: string
  services_interested: string[]
  goals: string
  timeline: string
  budget_range: string
  brand_colors: string[]
  fonts: string
  social_links: { instagram?: string; facebook?: string; tiktok?: string; linkedin?: string; other?: string }
  platform_credentials: string
  logo_file: File | null
  brand_guide_file: File | null
}

const initialData: IntakeData = {
  business_name: '', industry: '', website_url: '', phone: '', email: '', location: '',
  services_interested: [], goals: '', timeline: '', budget_range: '',
  brand_colors: ['#000000'], fonts: '',
  social_links: { instagram: '', facebook: '', tiktok: '', linkedin: '', other: '' },
  platform_credentials: '', logo_file: null, brand_guide_file: null,
}

export default function IntakePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<IntakeData>(initialData)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = useCallback((field: keyof IntakeData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const updateSocial = useCallback((key: string, value: string) => {
    setData((prev) => ({ ...prev, social_links: { ...prev.social_links, [key]: value } }))
  }, [])

  const toggleService = useCallback((service: string) => {
    setData((prev) => ({
      ...prev,
      services_interested: prev.services_interested.includes(service)
        ? prev.services_interested.filter((s) => s !== service)
        : [...prev.services_interested, service],
    }))
  }, [])

  const addColor = () => setData((prev) => ({ ...prev, brand_colors: [...prev.brand_colors, '#3B82F6'] }))
  const updateColor = (idx: number, val: string) => {
    setData((prev) => {
      const colors = [...prev.brand_colors]
      colors[idx] = val
      return { ...prev, brand_colors: colors }
    })
  }
  const removeColor = (idx: number) => {
    setData((prev) => ({ ...prev, brand_colors: prev.brand_colors.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('business_name', data.business_name)
      formData.append('industry', data.industry)
      formData.append('website_url', data.website_url)
      formData.append('phone', data.phone)
      formData.append('email', data.email)
      formData.append('location', data.location)
      formData.append('services_interested', JSON.stringify(data.services_interested))
      formData.append('goals', data.goals)
      formData.append('timeline', data.timeline)
      formData.append('budget_range', data.budget_range)
      formData.append('brand_colors', JSON.stringify(data.brand_colors))
      formData.append('fonts', data.fonts)
      formData.append('social_links', JSON.stringify(data.social_links))
      formData.append('platform_credentials', data.platform_credentials)

      if (data.logo_file) formData.append('file_logo', data.logo_file)
      if (data.brand_guide_file) formData.append('file_brand_guide', data.brand_guide_file)

      const res = await fetch('/api/intake/submit', { method: 'POST', body: formData })
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
        <p className="text-gray-600 mb-6">We've received your project information. Our team will review it and reach out within 24-48 hours.</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Project Intake</h1>
        <p className="text-gray-500 mt-1">Tell us about your business so we can build the perfect solution.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => s.id < step && setStep(s.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              step === s.id ? 'bg-blue-600 text-white' :
              s.id < step ? 'bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200' :
              'bg-gray-100 text-gray-400 cursor-not-allowed'
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
        <CardContent className="p-6 space-y-6">

          {/* STEP 1: Business Info */}
          {step === 1 && (
            <>
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Business Information</CardTitle>
              </CardHeader>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input id="business_name" value={data.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder="Your Business Name" />
                </div>
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={data.industry} onValueChange={(v) => update('industry', v)}>
                    <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="website_url">Website URL (optional)</Label>
                  <Input id="website_url" value={data.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" value={data.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={data.email} onChange={(e) => update('email', e.target.value)} placeholder="you@business.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Physical Location</Label>
                  <Input id="location" value={data.location} onChange={(e) => update('location', e.target.value)} placeholder="City, State" />
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Goals & Needs */}
          {step === 2 && (
            <>
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Goals & Needs</CardTitle>
              </CardHeader>
              <div className="grid gap-4">
                <div>
                  <Label className="mb-3 block">Services Interested In *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICES.map((service) => (
                      <label key={service} className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        data.services_interested.includes(service) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      )}>
                        <Checkbox
                          checked={data.services_interested.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                        />
                        <span className="text-sm font-medium">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="goals">Primary Goals *</Label>
                  <Textarea id="goals" value={data.goals} onChange={(e) => update('goals', e.target.value)} placeholder="What are you hoping to achieve? What problems are you looking to solve?" rows={4} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeline">Timeline</Label>
                    <Select value={data.timeline} onValueChange={(v) => update('timeline', v)}>
                      <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                      <SelectContent>
                        {TIMELINES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budget_range">Budget Range</Label>
                    <Select value={data.budget_range} onValueChange={(v) => update('budget_range', v)}>
                      <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                      <SelectContent>
                        {BUDGETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Branding Assets */}
          {step === 3 && (
            <>
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Branding Assets</CardTitle>
              </CardHeader>
              <div className="grid gap-4">
                <div>
                  <Label>Logo Upload</Label>
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => update('logo_file', e.target.files?.[0] || null)}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Palette className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">{data.logo_file ? data.logo_file.name : 'Click to upload your logo'}</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG up to 10MB</p>
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Brand Colors</Label>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {data.brand_colors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <input type="color" value={color} onChange={(e) => updateColor(idx, e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                        <span className="text-xs text-gray-500 uppercase">{color}</span>
                        {data.brand_colors.length > 1 && (
                          <button onClick={() => removeColor(idx)} className="text-red-400 hover:text-red-600 text-xs">×</button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addColor}>+ Add Color</Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="fonts">Preferred Fonts</Label>
                  <Input id="fonts" value={data.fonts} onChange={(e) => update('fonts', e.target.value)} placeholder="e.g. Montserrat, Open Sans" />
                </div>
                <div>
                  <Label>Brand Guide (PDF)</Label>
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => update('brand_guide_file', e.target.files?.[0] || null)}
                      className="hidden"
                      id="brand-guide-upload"
                    />
                    <label htmlFor="brand-guide-upload" className="cursor-pointer">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">{data.brand_guide_file ? data.brand_guide_file.name : 'Click to upload brand guide'}</p>
                      <p className="text-xs text-gray-400 mt-1">PDF up to 25MB</p>
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="mb-3 block">Social Media Links</Label>
                  <div className="grid gap-3">
                    <Input placeholder="Instagram URL" value={data.social_links.instagram || ''} onChange={(e) => updateSocial('instagram', e.target.value)} />
                    <Input placeholder="Facebook URL" value={data.social_links.facebook || ''} onChange={(e) => updateSocial('facebook', e.target.value)} />
                    <Input placeholder="TikTok URL" value={data.social_links.tiktok || ''} onChange={(e) => updateSocial('tiktok', e.target.value)} />
                    <Input placeholder="LinkedIn URL" value={data.social_links.linkedin || ''} onChange={(e) => updateSocial('linkedin', e.target.value)} />
                    <Input placeholder="Other URL" value={data.social_links.other || ''} onChange={(e) => updateSocial('other', e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 4: Platform Access */}
          {step === 4 && (
            <>
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Platform Access</CardTitle>
              </CardHeader>
              <div className="grid gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>🔒 Encrypted & Secure:</strong> All credentials entered here are encrypted at rest. Only authorized team members can access them during active project work.
                  </p>
                </div>
                <div>
                  <Label htmlFor="credentials">Platform Credentials & Access Details</Label>
                  <Textarea
                    id="credentials"
                    value={data.platform_credentials}
                    onChange={(e) => update('platform_credentials', e.target.value)}
                    placeholder={`Google Business Profile:\n  Email: \n  Password: \n\nDomain Registrar (GoDaddy, Namecheap, etc.):\n  Login: \n  Password: \n\nHosting Provider:\n  Login: \n  Password: \n\nSocial Media Accounts:\n  Instagram: \n  Facebook: \n  TikTok:`}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">You can always update this information later from your dashboard. Only share what you&apos;re comfortable with — we&apos;ll request any additional access as needed.</p>
              </div>
            </>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <>
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Review & Submit</CardTitle>
              </CardHeader>
              <div className="grid gap-6">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Business Info</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Business Name</span><span>{data.business_name || '—'}</span>
                    <span className="text-gray-500">Industry</span><span>{data.industry || '—'}</span>
                    <span className="text-gray-500">Website</span><span>{data.website_url || 'None'}</span>
                    <span className="text-gray-500">Phone</span><span>{data.phone || '—'}</span>
                    <span className="text-gray-500">Email</span><span>{data.email || '—'}</span>
                    <span className="text-gray-500">Location</span><span>{data.location || '—'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Goals & Services</h3>
                  <div className="text-sm space-y-2">
                    <div><span className="text-gray-500">Services: </span>{data.services_interested.join(', ') || 'None selected'}</div>
                    <div><span className="text-gray-500">Goals: </span>{data.goals || 'Not provided'}</div>
                    <div><span className="text-gray-500">Timeline: </span>{data.timeline || '—'} | <span className="text-gray-500">Budget: </span>{data.budget_range || '—'}</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Branding</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Colors:</span>
                      {data.brand_colors.map((c, i) => <span key={i} className="inline-block w-5 h-5 rounded border" style={{ backgroundColor: c }} />)}
                    </div>
                    <div><span className="text-gray-500">Fonts: </span>{data.fonts || 'Not specified'}</div>
                    <div><span className="text-gray-500">Logo: </span>{data.logo_file?.name || 'Not uploaded'}</div>
                    <div><span className="text-gray-500">Brand Guide: </span>{data.brand_guide_file?.name || 'Not uploaded'}</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Platform Access</h3>
                  <p className="text-sm text-gray-600">{data.platform_credentials ? `✅ ${data.platform_credentials.split('\n').filter(Boolean).length} lines of credentials provided (encrypted on submit)` : 'No credentials provided'}</p>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
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
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Intake'}
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
