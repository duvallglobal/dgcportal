'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Brain, Save, Loader2, CheckCircle } from 'lucide-react'

export interface AIToolSettings {
  id: string
  tool_name: string
  model_id: string
  display_name: string | null
  temperature: number
  max_tokens: number
  system_prompt: string | null
  updated_at: string
}

export interface NvidiaModel {
  id: string
  object: string
  owned_by: string
}

export const TOOL_DESCRIPTIONS: Record<string, string> = {
  contract_generator: 'Generates professional service contracts for clients based on intake data and selected services.',
  proposal_writer: 'Creates compelling project proposals tailored to client needs, goals, and budget.',
  chatbot: 'Client-facing AI assistant that answers questions about projects, billing, and DGC services.',
}

interface AIToolCardProps {
  tool: AIToolSettings
  models: NvidiaModel[]
  modelsLoading: boolean
  saving: boolean
  saved: boolean
  onFieldChange: (field: string, value: string | number) => void
  onSave: () => void
}

export function AIToolCard({
  tool,
  models,
  modelsLoading,
  saving,
  saved,
  onFieldChange,
  onSave,
}: AIToolCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            {tool.display_name || tool.tool_name}
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            {TOOL_DESCRIPTIONS[tool.tool_name] || ''}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {tool.tool_name}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>Model</Label>
          <Select
            value={tool.model_id}
            onValueChange={(v) => onFieldChange('model_id', v)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={modelsLoading ? 'Loading models...' : 'Select a model'}
              />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className="font-mono text-xs">{model.id}</span>
                  <span className="text-xs text-gray-400 ml-2">({model.owned_by})</span>
                </SelectItem>
              ))}
              {tool.model_id && !models.find((m) => m.id === tool.model_id) && (
                <SelectItem value={tool.model_id}>
                  <span className="font-mono text-xs">{tool.model_id}</span>
                  <span className="text-xs text-amber-500 ml-2">
                    (current, not in live list)
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Display Name</Label>
          <Input
            value={tool.display_name || ''}
            onChange={(e) => onFieldChange('display_name', e.target.value)}
            placeholder="Friendly name for this tool"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <span className="text-sm font-mono text-gray-500">
              {tool.temperature.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[tool.temperature]}
            onValueChange={([v]) => onFieldChange('temperature', v)}
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

        <div>
          <Label>Max Tokens</Label>
          <Input
            type="number"
            value={tool.max_tokens}
            onChange={(e) =>
              onFieldChange('max_tokens', parseInt(e.target.value) || 1024)
            }
            min={256}
            max={32768}
          />
        </div>

        <div>
          <Label>System Prompt</Label>
          <Textarea
            value={tool.system_prompt || ''}
            onChange={(e) => onFieldChange('system_prompt', e.target.value)}
            rows={6}
            className="font-mono text-xs"
            placeholder="Enter system instructions for this AI tool..."
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Settings
              </>
            )}
          </Button>
          {saved && (
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
  )
}
