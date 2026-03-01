import OpenAI from 'openai'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export interface AISettings {
  tool_name: string
  model_id: string
  display_name: string | null
  temperature: number
  max_tokens: number
  system_prompt: string | null
}

export interface NvidiaModel {
  id: string
  object: string
  owned_by: string
}

function createNimClient(): OpenAI {
  const apiKey = process.env.NVIDIA_NIM_API_KEY
  if (!apiKey) {
    throw new Error('Missing NVIDIA_NIM_API_KEY environment variable')
  }
  return new OpenAI({
    baseURL: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    apiKey,
  })
}

export async function fetchAvailableModels(): Promise<NvidiaModel[]> {
  const client = createNimClient()
  const response = await client.models.list()
  const models: NvidiaModel[] = []
  for await (const model of response) {
    models.push({ id: model.id, object: model.object, owned_by: model.owned_by })
  }
  return models
}

export async function getAISettings(toolName: string): Promise<AISettings | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('tool_name', toolName)
    .single()

  if (error || !data) return null
  return data as AISettings
}

export async function callNvidiaAI(
  toolName: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  const settings = await getAISettings(toolName)
  if (!settings) {
    throw new Error(`No AI settings found for tool: ${toolName}. Configure in Admin > AI Settings.`)
  }

  const client = createNimClient()
  const allMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []

  if (settings.system_prompt) {
    allMessages.push({ role: 'system', content: settings.system_prompt })
  }
  allMessages.push(...messages)

  const completion = await client.chat.completions.create({
    model: settings.model_id,
    messages: allMessages,
    temperature: settings.temperature,
    max_tokens: settings.max_tokens,
  })

  return completion.choices?.[0]?.message?.content || ''
}

export async function streamNvidiaAI(
  toolName: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<ReadableStream> {
  const settings = await getAISettings(toolName)
  if (!settings) {
    throw new Error(`No AI settings found for tool: ${toolName}`)
  }

  const client = createNimClient()
  const allMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []

  if (settings.system_prompt) {
    allMessages.push({ role: 'system', content: settings.system_prompt })
  }
  allMessages.push(...messages)

  const stream = await client.chat.completions.create({
    model: settings.model_id,
    messages: allMessages,
    temperature: settings.temperature,
    max_tokens: settings.max_tokens,
    stream: true,
  })

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content
          if (content) {
            controller.enqueue(encoder.encode(content))
          }
        }
        controller.close()
      } catch (err: unknown) {
        controller.error(err)
      }
    },
  })
}
