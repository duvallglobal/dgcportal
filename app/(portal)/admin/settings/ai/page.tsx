'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Brain, Save, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface AIToolSettings {
  id: string
  tool_name: string
  model_id: string
  display_name: string | null
  temperature: number
  max_tokens: number
  system_prompt: string | null
  updated_at: string
}

interface NvidiaModel {
  id: string
  object: string
  owned_by: string
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  contract_generator: 'Generates professional service contracts for clients based on intake data and selected services.',
  proposal_writer: 'Creates compelling project proposals tailored to client needs, goals, and budget.',
  chatbot: 'Client-facing AI assistant that answers questions about projects, billing, and DGC services.',
}

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
    } catch (err) {
      setError('Could not connect to NVIDIA NIM API.')
    } finally {
      setModelsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchModels()
  }, [fetchSettings, fetchModels])

  const updateTool = (toolName: string, field: string, value: any) => {
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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Settings</h1>
          <p className="text-gray-500 mt-1">Configure AI model, temperature, and system prompts for each tool.</p>
        </div>
        <Button variant="outline" onClick={fetchModels} disabled={modelsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${modelsLoading ? 'animate-spin' : ''}`} />
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
          <Card key={tool.tool_name}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  {tool.display_name || tool.tool_name}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">{TOOL_DESCRIPTIONS[tool.tool_name] || ''}</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">{tool.tool_name}</Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Model Selector */}
              <div>
                <Label>Model</Label>
                <Select
                  value={tool.model_id}
                  onValueChange={(v) => updateTool(tool.tool_name, 'model_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={modelsLoading ? 'Loading models...' : 'Select a model'} />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <span className="font-mono text-xs">{model.id}</span>
                        <span className="text-xs text-gray-400 ml-2">({model.owned_by})</span>
                      </SelectItem>
                    ))}
                    {/* Always show current model even if not in live list */}
                    {tool.model_id && !models.find((m) => m.id === tool.model_id) && (
                      <SelectItem value={tool.model_id}>
                        <span className="font-mono text-xs">{tool.model_id}</span>
                        <span className="text-xs text-amber-500 ml-2">(current, not in live list)</span>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Display Name */}
              <div>
                <Label>Display Name</Label>
                <Input
                  value={tool.display_name || ''}
                  onChange={(e) => updateTool(tool.tool_name, 'display_name', e.target.value)}
                  placeholder="Friendly name for this tool"
                />
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm font-mono text-gray-500">{tool.temperature.toFixed(2)}</span>
                </div>
                <Slider
                  value={[tool.temperature]}
                  onValueChange={([v]) => updateTool(tool.tool_name, 'temperature', v)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Precise (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={tool.max_tokens}
                  onChange={(e) => updateTool(tool.tool_name, 'max_tokens', parseInt(e.target.value) || 1024)}
                  min={256}
                  max={32768}
                />
              </div>

              {/* System Prompt */}
              <div>
                <Label>System Prompt</Label>
                <Textarea
                  value={tool.system_prompt || ''}
                  onChange={(e) => updateTool(tool.tool_name, 'system_prompt', e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                  placeholder="Enter system instructions for this AI tool..."
                />
              </div>

              {/* Save */}
              <div className="flex items-center gap-3">
                <Button onClick={() => saveTool(tool)} disabled={saving === tool.tool_name}>
                  {saving === tool.tool_name
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    : <><Save className="h-4 w-4 mr-2" /> Save Settings</>}
                </Button>
                {saved === tool.tool_name && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Saved
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  Last updated: {new Date(tool.updated_at).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
