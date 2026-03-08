'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

const QUICK_PROMPTS = [
  'What services does DGC offer?',
  "What's my project status?",
  'Help with billing',
]

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  useEffect(() => {
    if (open && !hasLoaded) {
      setHasLoaded(true)
      fetch('/api/chat')
        .then((res) => res.ok ? res.json() : { messages: [] })
        .then((data) => setMessages(data.messages || []))
        .catch(() => {})
    }
  }, [open, hasLoaded])

  const sendMessage = useCallback(async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || sending) return

    const userMessage: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please check your internet.' },
      ])
    } finally {
      setSending(false)
    }
  }, [input, sending])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const visibleMessages = messages.filter((m) => m.role !== 'system')

  return (
    <>
      {/* Chat Panel */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 w-[380px] rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 origin-bottom-right',
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
        style={{ height: '480px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b bg-[#1a1a2e] text-white rounded-t-2xl">
          <div className="w-9 h-9 rounded-full bg-[#e2b714] flex items-center justify-center">
            <Bot className="h-5 w-5 text-[#1a1a2e]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">DGC Assistant</div>
            <div className="text-xs text-white/60">Ask about your project or services</div>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {visibleMessages.length === 0 && !sending ? (
            <div className="text-center pt-8">
              <Bot className="h-10 w-10 text-[#e2b714] mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">How can I help?</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Ask about your project, billing, or DGC services.</p>
              <div className="flex flex-col gap-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-gray-50 hover:bg-[#e2b714]/10 text-gray-700 hover:text-[#1a1a2e] px-3 py-2 rounded-lg border border-gray-200 hover:border-[#e2b714]/30 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            visibleMessages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#e2b714]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-[#e2b714]" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[#1a1a2e] text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#e2b714]/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-[#e2b714]" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3.5 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex-shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e2b714]/50 focus:border-[#e2b714] disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl bg-[#1a1a2e] text-white flex items-center justify-center hover:bg-[#1a1a2e]/90 disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105',
          open
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-[#e2b714] text-[#1a1a2e] hover:bg-[#c9a112]'
        )}
        style={{ boxShadow: open ? undefined : '0 4px 20px rgba(226, 183, 20, 0.4)' }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  )
}
