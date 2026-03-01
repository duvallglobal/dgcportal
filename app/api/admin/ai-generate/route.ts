import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { callNvidiaAI, type ChatMessage } from '@/lib/nvidia-ai'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { clientId, docType } = await request.json()

    const supabase = createAdminSupabaseClient()

    // Fetch client + intake data
    const { data: client } = await supabase
      .from('clients')
      .select('full_name, email, business_name, phone')
      .eq('id', clientId)
      .single()

    const { data: intake } = await supabase
      .from('project_intakes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Fetch DGC service descriptions for accurate proposals
    const { data: services } = await supabase
      .from('services')
      .select('name, description, tagline, capabilities')
      .eq('is_active', true)

    const serviceContext = (services || [])
      .map((s) => `**${s.name}** (${s.tagline}): ${s.description}\nCapabilities: ${s.capabilities}`)
      .join('\n\n')

    const clientContext = [
      `Client Name: ${client?.full_name || 'Unknown'}`,
      `Business: ${intake?.business_name || client?.business_name || 'Unknown'}`,
      `Email: ${client?.email || 'Unknown'}`,
      `Industry: ${intake?.industry || 'Not specified'}`,
      `Services Requested: ${(intake?.services_interested || []).join(', ') || 'Not specified'}`,
      `Goals: ${intake?.goals || 'Not specified'}`,
      `Timeline: ${intake?.timeline || 'Not specified'}`,
      `Budget: ${intake?.budget_range || 'Not specified'}`,
      `Location: ${intake?.location || 'Not specified'}`,
    ].join('\n')

    const toolName = docType === 'contract' ? 'contract_generator' : 'proposal_writer'

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Generate a professional ${docType} for the following client. Use the DGC service descriptions below for accurate service details.\n\n--- CLIENT INFO ---\n${clientContext}\n\n--- DGC SERVICE CATALOG ---\n${serviceContext}\n\nGenerate the ${docType} in clean markdown format.`,
    }

    const content = await callNvidiaAI(toolName, [userMessage])

    // Stream-like response (full content)
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error: unknown) {
    console.error('AI generation error:', error)
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
