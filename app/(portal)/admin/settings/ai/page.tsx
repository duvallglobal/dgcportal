'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { AIToolCard } from '@/components/admin/ai-tool-card'
import type { AIToolSettings, NvidiaModel } from '@/components/admin/ai-tool-card'

export default function AdminAISettingsPage() {
  const [tools, setTools] = useState<AIToolSettings[]>([])
  const [models, setModels] = useState<NvidiaModel[]>([])
  const [loading, setLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-settings')
      if (res.ok) {
        const data = await res.json()
        setTools(data.settings || [])
      }
    } catch (err) {
      console.error('Failed to fetch AI settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchModels = useCallback(async () => {
    setModelsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/ai-models')
      if (res.ok) {
        const data = await res.json()
        setModels(data.models || [])
      } else {
        setError('Failed to fetch models from NVIDIA NIM. Check your API key.')
      }
    } catch {
      setError('Could not connect to NVIDIA NIM API.')
    } finally {
      setModelsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchModels()
  }, [fetchSettings, fetchModels])

  const updateTool = (toolName: string, field: string, value: string | number) => {
    setTools((prev) =>
      prev.map((t) => (t.tool_name === toolName ? { ...t, [field]: value } : t))
    )
  }

  const saveTool = async (tool: AIToolSettings) => {
    setSaving(tool.tool_name)
    setSaved(null)
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: tool.tool_name,
          model_id: tool.model_id,
          display_name: tool.display_name,
          temperature: tool.temperature,
          max_tokens: tool.max_tokens,
          system_prompt: tool.system_prompt,
        }),
      })
      if (res.ok) {
        setSaved(tool.tool_name)
        setTimeout(() => setSaved(null), 3000)
      }
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure AI model, temperature, and system prompts for each tool.
          </p>
        </div>
        <Button variant="outline" onClick={fetchModels} disabled={modelsLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${modelsLoading ? 'animate-spin' : ''}`}
          />
          Refresh Models
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {tools.map((tool) => (
          <AIToolCard
            key={tool.tool_name}
            tool={tool}
            models={models}
            modelsLoading={modelsLoading}
            saving={saving === tool.tool_name}
            saved={saved === tool.tool_name}
            onFieldChange={(field, value) => updateTool(tool.tool_name, field, value)}
            onSave={() => saveTool(tool)}
          />
        ))}
      </div>
    </div>
  )
}
