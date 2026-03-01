import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { encrypt } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()

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

    // Parse form fields
    const businessName = formData.get('business_name') as string
    const industry = formData.get('industry') as string
    const websiteUrl = formData.get('website_url') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const location = formData.get('location') as string
    const servicesInterested = JSON.parse(formData.get('services_interested') as string || '[]')
    const goals = formData.get('goals') as string
    const timeline = formData.get('timeline') as string
    const budgetRange = formData.get('budget_range') as string
    const brandColors = JSON.parse(formData.get('brand_colors') as string || '[]')
    const fonts = formData.get('fonts') as string
    const socialLinks = JSON.parse(formData.get('social_links') as string || '{}')
    const platformCredentials = formData.get('platform_credentials') as string

    // Encrypt platform credentials with AES-256-GCM
    let encryptedCredentials: string | null = null
    if (platformCredentials) {
      encryptedCredentials = encrypt(platformCredentials)
    }

    // Insert intake record
    const { data: intake, error: intakeError } = await supabase
      .from('project_intakes')
      .insert({
        client_id: client.id,
        business_name: businessName,
        industry,
        website_url: websiteUrl || null,
        phone,
        email,
        location,
        services_interested: servicesInterested,
        goals,
        timeline,
        budget_range: budgetRange,
        brand_colors: brandColors,
        fonts: fonts || null,
        social_links: socialLinks,
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
      .update({ business_name: businessName, phone, updated_at: new Date().toISOString() })
      .eq('id', client.id)
      .is('business_name', null)

    // Notify admin
    await sendEmail({
      to: 'mj@dgc.today',
      subject: `New Project Intake: ${businessName}`,
      html: `<h2>New Project Intake Submitted</h2>
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Industry:</strong> ${industry}</p>
        <p><strong>Services:</strong> ${servicesInterested.join(', ')}</p>
        <p><strong>Budget:</strong> ${budgetRange}</p>
        <p><strong>Timeline:</strong> ${timeline}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clients/${client.id}">View Client Details</a></p>`,
    })

    return NextResponse.json({ success: true, intakeId: intake.id })
  } catch (error: any) {
    console.error('Intake submission error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
