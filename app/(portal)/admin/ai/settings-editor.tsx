'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Save, CheckCircle } from 'lucide-react'

interface AISetting {
    id: string
    tool_name: string
    model_id: string
    display_name: string | null
    temperature: number
    max_tokens: number
    system_prompt: string | null
}

interface NvidiaModel {
    id: string
}

export function AISettingsEditor() {
    const [settings, setSettings] = useState<AISetting[]>([])
    const [models, setModels] = useState<NvidiaModel[]>([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [savedId, setSavedId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const [resSettings, resModels] = await Promise.all([
                    fetch('/api/admin/ai-settings'),
                    fetch('/api/admin/ai-models')
                ])
                if (resSettings.ok) {
                    const data = await resSettings.json()
                    setSettings(data.settings || [])
                }
                if (resModels.ok) {
                    const data = await resModels.json()
                    setModels(data.models || [])
                }
            } catch (err) {
                console.error('Failed to fetch AI settings:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleUpdate = (id: string, field: keyof AISetting, value: string | number | null) => {
        setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const handleSave = async (setting: AISetting) => {
        setSavingId(setting.id)
        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(setting),
            })
            if (res.ok) {
                setSavedId(setting.id)
                setTimeout(() => setSavedId(null), 2000)
            } else {
                alert('Failed to save settings')
            }
        } catch (err) {
            console.error(err)
            alert('Error saving settings')
        } finally {
            setSavingId(null)
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
        <div className="space-y-6">
            {settings.map((setting) => (
                <Card key={setting.id} className="border-gray-200">
                    <CardHeader className="border-b bg-gray-50/50 pb-4">
                        <CardTitle className="text-lg text-[#1a1a2e]">{setting.display_name || setting.tool_name}</CardTitle>
                        <CardDescription className="font-mono text-xs text-gray-500">Tool ID: {setting.tool_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1.5">AI Model</label>
                                <Select
                                    value={setting.model_id}
                                    onValueChange={(val) => handleUpdate(setting.id, 'model_id', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {models.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.id}</SelectItem>
                                        ))}
                                        {/* Fallback if models API fails or doesn't include the current one */}
                                        {!models.find(m => m.id === setting.model_id) && (
                                            <SelectItem value={setting.model_id}>{setting.model_id}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Temperature</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="2"
                                        value={setting.temperature}
                                        onChange={(e) => handleUpdate(setting.id, 'temperature', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Max Tokens</label>
                                    <Input
                                        type="number"
                                        step="1"
                                        value={setting.max_tokens}
                                        onChange={(e) => handleUpdate(setting.id, 'max_tokens', parseInt(e.target.value, 10))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1.5">System Prompt</label>
                            <Textarea
                                rows={5}
                                value={setting.system_prompt || ''}
                                onChange={(e) => handleUpdate(setting.id, 'system_prompt', e.target.value)}
                                className="font-mono text-xs"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={() => handleSave(setting)}
                                disabled={savingId === setting.id}
                                className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 gap-2"
                            >
                                {savingId === setting.id ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                                ) : savedId === setting.id ? (
                                    <><CheckCircle className="h-4 w-4 text-emerald-400" /> Saved</>
                                ) : (
                                    <><Save className="h-4 w-4" /> Save Configuration</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
