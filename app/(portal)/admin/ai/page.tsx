'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Wand2, FileText, Send, Loader2, Bot, User,
  Mail, Copy, CheckCircle, ArrowRight, Sparkles, Settings, FileDown
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AISettingsEditor } from './settings-editor'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  full_name: string
  email: string
  business_name: string | null
}

interface Message {
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolName?: string
}

const TOOLS = [
  {
    id: 'contract',
    label: 'Generate Contract',
    icon: FileText,
    description: 'Create a service contract based on client intake data',
    prompt: 'Generate a service contract for this client.',
  },
  {
    id: 'proposal',
    label: 'Generate Proposal',
    icon: Sparkles,
    description: 'Draft a project proposal tailored to client needs',
    prompt: 'Generate a project proposal for this client.',
  },
  {
    id: 'email',
    label: 'Draft Email',
    icon: Mail,
    description: 'Write a professional email to the client',
    prompt: 'Draft a professional email to this client.',
  },
]

export default function AdminAIAgentPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  const sendMessage = useCallback(async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || sending) return
    if (!selectedClientId) {
      alert('Please select a client first.')
      return
    }

    const userMessage: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/admin/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          message: text,
          docType: text.toLowerCase().includes('contract') ? 'contract' : 'proposal',
        }),
      })

      if (!res.ok) throw new Error('Generation failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk
          const content = fullContent
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content }
            return updated
          })
        }
      } else {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content || data.reply || 'No response.' }])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Failed to generate. Check AI settings and try again.' },
      ])
    } finally {
      setSending(false)
    }
  }, [input, sending, selectedClientId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleGeneratePdf = async (content: string, idx: number) => {
    setGeneratingPdf(idx)
    try {
      // Guess type based on content, simple heuristic
      const type = content.toLowerCase().includes('contract') || content.toLowerCase().includes('agreement') ? 'contract' : 'proposal'

      const res = await fetch('/api/admin/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClientId, content, type })
      })

      if (res.ok) {
        const { url } = await res.json()
        window.open(url, '_blank')
      } else {
        alert('Failed to generate PDF')
      }
    } catch (err) {
      console.error(err)
      alert('Error generating PDF')
    } finally {
      setGeneratingPdf(null)
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Agent</h1>
          <p className="text-gray-500 mt-1">Generate contracts, proposals, and emails with AI assistance.</p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2"><Bot className="h-4 w-4" /> Agent Chat</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2"><Settings className="h-4 w-4" /> AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          {/* Client Selector */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Select Client</label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client for context..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name} {c.business_name ? `— ${c.business_name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedClient && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="outline">{selectedClient.email}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tool Buttons */}
          {selectedClientId && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => sendMessage(tool.prompt)}
                  disabled={sending}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#e2b714] hover:bg-[#e2b714]/5 transition-all text-left group disabled:opacity-50"
                >
                  <div className="p-2 rounded-lg bg-[#1a1a2e] text-[#e2b714] group-hover:bg-[#e2b714] group-hover:text-[#1a1a2e] transition-colors">
                    <tool.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{tool.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tool.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Chat Area */}
          <Card className="flex flex-col" style={{ minHeight: '400px' }}>
            <CardHeader className="border-b bg-gray-50/50 py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#e2b714]" />
                AI Agent Conversation
                {sending && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Wand2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-600">Ready to generate</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    {selectedClientId
                      ? 'Use the tools above or type a custom request. The AI has full context on the selected client.'
                      : 'Select a client above to get started. The AI will use their intake data and project details for context.'}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-[#e2b714]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-[#e2b714]" />
                      </div>
                    )}
                    <div className={cn('max-w-[85%]', msg.role === 'user' ? 'order-first' : '')}>
                      <div
                        className={cn(
                          'rounded-xl px-4 py-3 text-sm',
                          msg.role === 'user'
                            ? 'bg-[#1a1a2e] text-white'
                            : 'bg-gray-50 border text-gray-800'
                        )}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      </div>
                      {msg.role === 'assistant' && msg.content && (
                        <div className="flex gap-2 mt-1.5 ml-1">
                          <button
                            onClick={() => handleCopy(msg.content, i)}
                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                          >
                            {copiedIdx === i
                              ? <><CheckCircle className="h-3 w-3" /> Copied</>
                              : <><Copy className="h-3 w-3" /> Copy</>}
                          </button>

                          <button
                            onClick={() => handleGeneratePdf(msg.content, i)}
                            disabled={generatingPdf === i}
                            className="text-xs text-gray-400 hover:text-[#e2b714] flex items-center gap-1 transition-colors ml-3 disabled:opacity-50"
                          >
                            {generatingPdf === i
                              ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating PDF...</>
                              : <><FileDown className="h-3 w-3" /> Save as PDF</>}
                          </button>
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sending && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#e2b714]/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[#e2b714]" />
                  </div>
                  <div className="bg-gray-50 border rounded-xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedClientId ? 'Ask the AI to generate something...' : 'Select a client first...'}
                    disabled={sending || !selectedClientId}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending || !selectedClientId}
                  className="self-end bg-[#1a1a2e] hover:bg-[#1a1a2e]/90"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {selectedClient && (
                <p className="text-xs text-gray-400 mt-2">
                  <ArrowRight className="h-3 w-3 inline mr-1" />
                  Context: {selectedClient.full_name} {selectedClient.business_name ? `(${selectedClient.business_name})` : ''}
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <AISettingsEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
