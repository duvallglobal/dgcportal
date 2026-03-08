import { createAdminSupabaseClient } from '@/lib/supabase/server'

const NVIDIA_NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1'

export interface AISettings {
  tool_name: string
  model_id: string
  display_name: string | null
  temperature: number
  max_tokens: number
  system_prompt: string | null
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface NvidiaModel {
  id: string
  object: string
  owned_by: string
}

/**
 * Fetch available models from NVIDIA NIM API.
 * Never hardcode model names — always poll live.
 */
export async function fetchAvailableModels(): Promise<NvidiaModel[]> {
  const response = await fetch(`${NVIDIA_NIM_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch NVIDIA models: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Get AI settings for a specific tool from Supabase.
 */
export async function getAISettings(toolName: string): Promise<AISettings | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('tool_name', toolName)
    .single()

  if (error || !data) {
    console.error(`Failed to fetch AI settings for tool: ${toolName}`, error)
    return null
  }

  return data as AISettings
}

/**
 * Call NVIDIA NIM API with tool-specific settings from the database.
 * Model, temperature, max_tokens, and system prompt are all admin-configurable.
 */
export async function callNvidiaAI(
  toolName: string,
  messages: ChatMessage[]
): Promise<string> {
  const settings = await getAISettings(toolName)

  if (!settings) {
    throw new Error(`No AI settings found for tool: ${toolName}. Configure in Admin > AI Settings.`)
  }

  const allMessages: ChatMessage[] = []

  if (settings.system_prompt) {
    allMessages.push({ role: 'system', content: settings.system_prompt })
  }

  allMessages.push(...messages)

  const response = await fetch(`${NVIDIA_NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model_id,
      messages: allMessages,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`NVIDIA NIM API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Stream response from NVIDIA NIM API for chatbot use.
 */
export async function streamNvidiaAI(
  toolName: string,
  messages: ChatMessage[]
): Promise<ReadableStream> {
  const settings = await getAISettings(toolName)

  if (!settings) {
    throw new Error(`No AI settings found for tool: ${toolName}`)
  }

  const allMessages: ChatMessage[] = []

  if (settings.system_prompt) {
    allMessages.push({ role: 'system', content: settings.system_prompt })
  }

  allMessages.push(...messages)

  const response = await fetch(`${NVIDIA_NIM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model_id,
      messages: allMessages,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`NVIDIA NIM streaming error: ${response.statusText}`)
  }

  return response.body
}
