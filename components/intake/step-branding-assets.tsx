'use client'

import type { IntakeFormData } from '@/app/(portal)/dashboard/intake/page'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Upload, X, Plus } from 'lucide-react'
import { useRef } from 'react'

interface Props {
  formData: IntakeFormData
  updateFormData: (updates: Partial<IntakeFormData>) => void
  files: { logos: File[]; brandGuide: File | null }
  setFiles: (files: { logos: File[]; brandGuide: File | null }) => void
}

export function StepBrandingAssets({ formData, updateFormData, files, setFiles }: Props) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const guideInputRef = useRef<HTMLInputElement>(null)

  function addColor() {
    updateFormData({ brandColors: [...formData.brandColors, '#000000'] })
  }

  function updateColor(index: number, value: string) {
    const updated = [...formData.brandColors]
    updated[index] = value
    updateFormData({ brandColors: updated })
  }

  function removeColor(index: number) {
    if (formData.brandColors.length <= 1) return
    updateFormData({ brandColors: formData.brandColors.filter((_, i) => i !== index) })
  }

  function updateSocialLink(platform: keyof IntakeFormData['socialLinks'], value: string) {
    updateFormData({
      socialLinks: { ...formData.socialLinks, [platform]: value },
    })
  }

  function handleLogoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles({ ...files, logos: [...files.logos, ...Array.from(e.target.files)] })
    }
  }

  function removeLogo(index: number) {
    setFiles({ ...files, logos: files.logos.filter((_, i) => i !== index) })
  }

  function handleBrandGuide(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setFiles({ ...files, brandGuide: e.target.files[0] })
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Branding Assets</h2>

      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>Logo(s)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => logoInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload logos (PNG, SVG, JPG)</p>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleLogoFiles}
          />
        </div>
        {files.logos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {files.logos.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted rounded px-3 py-1 text-sm">
                <span>{file.name}</span>
                <button onClick={() => removeLogo(i)}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand Colors */}
      <div className="space-y-2">
        <Label>Brand Colors</Label>
        <div className="flex flex-wrap gap-3 items-center">
          {formData.brandColors.map((color, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="color"
                value={color}
                onChange={(e) => updateColor(i, e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border"
              />
              <span className="text-xs text-muted-foreground">{color}</span>
              {formData.brandColors.length > 1 && (
                <button onClick={() => removeColor(i)}>
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addColor}>
            <Plus className="w-3 h-3 mr-1" /> Add Color
          </Button>
        </div>
      </div>

      {/* Fonts */}
      <div className="space-y-2">
        <Label htmlFor="fonts">Preferred Fonts</Label>
        <Input
          id="fonts"
          value={formData.fonts}
          onChange={(e) => updateFormData({ fonts: e.target.value })}
          placeholder="e.g., Montserrat, Open Sans, Playfair Display"
        />
      </div>

      {/* Brand Guide Upload */}
      <div className="space-y-2">
        <Label>Brand Guide (PDF)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => guideInputRef.current?.click()}
        >
          {files.brandGuide ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm">{files.brandGuide.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setFiles({ ...files, brandGuide: null }) }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Upload existing brand guide (PDF)</p>
          )}
          <input
            ref={guideInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleBrandGuide}
          />
        </div>
      </div>

      {/* Social Media Links */}
      <div className="space-y-2">
        <Label>Social Media Links</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter'] as const).map((platform) => (
            <Input
              key={platform}
              value={formData.socialLinks[platform]}
              onChange={(e) => updateSocialLink(platform, e.target.value)}
              placeholder={platform.charAt(0).toUpperCase() + platform.slice(1) + ' URL'}
            />
          ))}
          <Input
            value={formData.socialLinks.other}
            onChange={(e) => updateSocialLink('other', e.target.value)}
            placeholder="Other social link"
          />
        </div>
      </div>
    </div>
  )
}
