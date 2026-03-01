import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'

// Safe JSON parse that never throws
function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const intakeSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Industry is required'),
  website_url: z.string().url().optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Valid email is required'),
  location: z.string().min(1, 'Location is required'),
  services_interested: z.array(z.string()).default([]),
  goals: z.string().min(1, 'Goals are required'),
  timeline: z.string().min(1, 'Timeline is required'),
  budget_range: z.string().min(1, 'Budget range is required'),
  brand_colors: z.array(z.string()).default([]),
  fonts: z.string().optional().default(''),
  social_links: z.record(z.string()).default({}),
  platform_credentials: z.string().optional().default(''),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()

    // Extract and validate fields
    const rawData = {
      business_name: formData.get('business_name') as string || '',
      industry: formData.get('industry') as string || '',
      website_url: formData.get('website_url') as string || '',
      phone: formData.get('phone') as string || '',
      email: formData.get('email') as string || '',
      location: formData.get('location') as string || '',
      services_interested: safeParseJSON<string[]>(formData.get('services_interested') as string, []),
      goals: formData.get('goals') as string || '',
      timeline: formData.get('timeline') as string || '',
      budget_range: formData.get('budget_range') as string || '',
      brand_colors: safeParseJSON<string[]>(formData.get('brand_colors') as string, []),
      fonts: formData.get('fonts') as string || '',
      social_links: safeParseJSON<Record<string, string>>(formData.get('social_links') as string, {}),
      platform_credentials: formData.get('platform_credentials') as string || '',
    }

    const validation = intakeSchema.safeParse(rawData)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
    }

    const data = validation.data

    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    // Get client record
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('clerk_user_id', user.userId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client record not found' }, { status: 404 })
    }

    // Encrypt platform credentials with AES-256-GCM
    let encryptedCredentials: string | null = null
    if (data.platform_credentials) {
      encryptedCredentials = encrypt(data.platform_credentials)
    }

    // Insert intake record
    const { data: intake, error: intakeError } = await supabase
      .from('project_intakes')
      .insert({
        client_id: client.id,
        business_name: data.business_name,
        industry: data.industry,
        website_url: data.website_url || null,
        phone: data.phone,
        email: data.email,
        location: data.location,
        services_interested: data.services_interested,
        goals: data.goals,
        timeline: data.timeline,
        budget_range: data.budget_range,
        brand_colors: data.brand_colors,
        fonts: data.fonts || null,
        social_links: data.social_links,
        platform_credentials_encrypted: encryptedCredentials,
        status: 'submitted',
      })
      .select()
      .single()

    if (intakeError) {
      console.error('Intake insert error:', intakeError)
      return NextResponse.json({ error: 'Failed to save intake' }, { status: 500 })
    }

    // Upload files to Supabase Storage
    const fileKeys = Array.from(formData.keys()).filter((k) => k.startsWith('file_'))
    for (const key of fileKeys) {
      const file = formData.get(key) as File
      if (!file || !file.name) continue

      const filePath = `${client.id}/${intake.id}/${Date.now()}_${file.name}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await adminSupabase.storage
        .from('intake-assets')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = adminSupabase.storage
          .from('intake-assets')
          .getPublicUrl(filePath)

        await supabase.from('intake_files').insert({
          intake_id: intake.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
      }
    }

    // Update client business name if not set
    await supabase
      .from('clients')
      .update({ business_name: data.business_name, phone: data.phone, updated_at: new Date().toISOString() })
      .eq('id', client.id)
      .is('business_name', null)

    // Notify admin
    await sendEmail({
      to: 'mj@dgc.today',
      subject: `New Project Intake: ${data.business_name}`,
      html: `<h2>New Project Intake Submitted</h2>
        <p><strong>Business:</strong> ${data.business_name}</p>
        <p><strong>Industry:</strong> ${data.industry}</p>
        <p><strong>Services:</strong> ${data.services_interested.join(', ')}</p>
        <p><strong>Budget:</strong> ${data.budget_range}</p>
        <p><strong>Timeline:</strong> ${data.timeline}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clients/${client.id}">View Client Details</a></p>`,
    })

    return NextResponse.json({ success: true, intakeId: intake.id })
  } catch (error: any) {
    console.error('Intake submission error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
