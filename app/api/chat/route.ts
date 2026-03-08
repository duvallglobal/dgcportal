import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { callNvidiaAI, type ChatMessage } from '@/lib/nvidia-ai'

// GET: Fetch chat history
export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('clerk_user_id', user.userId)
      .single()

    if (!client) {
      return NextResponse.json({ messages: [] })
    }

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: true })
      .limit(100)

    return NextResponse.json({ messages: messages || [] })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Send a message and get AI reply
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { message } = await request.json()

    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase
      .from('clients')
      .select('id, full_name, business_name')
      .eq('clerk_user_id', user.userId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      client_id: client.id,
      role: 'user',
      content: message,
    })

    // Build context: fetch client's project data
    const [intakeRes, ticketRes, agreementRes, servicesRes] = await Promise.all([
      supabase.from('project_intakes').select('business_name, services_interested, status, goals').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('support_tickets').select('subject, status').eq('client_id', client.id).in('status', ['open', 'in_progress']).limit(5),
      supabase.from('service_agreements').select('status').eq('client_id', client.id).limit(1),
      supabase.from('services').select('name, description, tagline').eq('is_active', true),
    ])

    const intake = intakeRes.data?.[0]
    const openTickets = ticketRes.data || []
    const agreement = agreementRes.data?.[0]
    const services = servicesRes.data || []

    const contextLines = [
      `Client: ${client.full_name || 'Unknown'} (${client.business_name || 'No business name'})`,
    ]

    if (intake) {
      contextLines.push(`Project Status: ${intake.status}`)
      contextLines.push(`Services: ${(intake.services_interested || []).join(', ')}`)
      contextLines.push(`Goals: ${intake.goals || 'Not specified'}`)
    }

    if (agreement) {
      contextLines.push(`Agreement Status: ${agreement.status}`)
    }

    if (openTickets.length > 0) {
      contextLines.push(`Open Tickets: ${openTickets.map((t) => t.subject).join('; ')}`)
    }

    contextLines.push('\nDGC Services Available:')
    services.forEach((s) => contextLines.push(`- ${s.name}: ${s.tagline || s.description || ''}`))

    // Get recent chat history for conversation context
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const conversationHistory: ChatMessage[] = (recentMessages || [])
      .reverse()
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Add context as a user-invisible system injection
    const contextMessage: ChatMessage = {
      role: 'user',
      content: `[CONTEXT - Do not repeat this to the user]\n${contextLines.join('\n')}\n\n[USER MESSAGE]\n${message}`,
    }

    // Replace the last user message with the context-enriched one
    const aiMessages = conversationHistory.slice(0, -1)
    aiMessages.push(contextMessage)

    // Check if user wants to create a ticket
    const wantsTicket = /create.*(ticket|support)|escalate|need.*help.*team/i.test(message)

    let reply: string
    let suggestTicket = false

    if (wantsTicket) {
      // Auto-create support ticket
      const { data: ticket } = await supabase
        .from('support_tickets')
        .insert({
          client_id: client.id,
          subject: `Chat-created: ${message.slice(0, 80)}`,
          description: `Created from AI chat.\n\nUser message: ${message}`,
          priority: 'medium',
          status: 'open',
        })
        .select()
        .single()

      reply = `✅ I've created a support ticket for you!\n\n**Ticket:** ${ticket?.subject || 'Support request'}\n**Status:** Open\n\nOur team will review this and get back to you. You can track it in your Support page.`
    } else {
      reply = await callNvidiaAI('chatbot', aiMessages)

      // Check if the AI's response suggests it can't help
      if (/I('m| am) (not able|unable)|beyond my (ability|scope)|contact.*support|reach out to/i.test(reply)) {
        suggestTicket = true
      }
    }

    // Save assistant reply
    await supabase.from('chat_messages').insert({
      client_id: client.id,
      role: 'assistant',
      content: reply,
    })

    return NextResponse.json({ reply, suggestTicket })
  } catch (error: unknown) {
    console.error('API /chat POST Error Details:', error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    return NextResponse.json(
      { reply: 'Sorry, I encountered an error. Please try again or contact support.', suggestTicket: true },
      { status: 200 } // Return 200 so the UI can display the error message gracefully
    )
  }
}
