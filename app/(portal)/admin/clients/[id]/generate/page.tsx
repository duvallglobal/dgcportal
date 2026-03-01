'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FileText, Wand2, Loader2, Copy, CheckCircle, Send } from 'lucide-react'

interface ClientData {
  id: string
  full_name: string | null
  business_name: string | null
  email: string
  intake: {
    business_name: string
    industry: string | null
    services_interested: string[]
    goals: string | null
    timeline: string | null
    budget_range: string | null
  } | null
}

export default function GeneratePage() {
  const params = useParams()
  const clientId = params.id as string
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [docType, setDocType] = useState<'contract' | 'proposal'>('contract')
  const [copied, setCopied] = useState(false)
  const [pushing, setPushing] = useState(false)

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setClientData(data.client)
      }
    } catch (_err) {
      console.error('Failed to fetch client:', _err)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchClient() }, [fetchClient])

  const handleGenerate = async () => {
    setGenerating(true)
    setGeneratedContent('')
    try {
      const res = await fetch('/api/admin/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, docType }),
      })

      if (!res.ok) throw new Error('Generation failed')

      // Stream the response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setGeneratedContent((prev) => prev + chunk)
        }
      }
    } catch (_err) {
      console.error('Generation error:', _err)
      alert('Failed to generate document. Check AI settings.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePushToDocuSeal = async () => {
    setPushing(true)
    try {
      const res = await fetch('/api/admin/push-to-docuseal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, content: generatedContent, docType }),
      })
      if (res.ok) {
        alert('Document pushed to DocuSeal! The client will see it in their Agreement page.')
      } else {
        alert('Failed to push to DocuSeal.')
      }
    } catch (_err) {
      console.error('Push error:', _err)
    } finally {
      setPushing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!clientData) {
    return <div className="text-center py-20 text-gray-500">Client not found.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">AI Document Generator</h1>
        <p className="text-gray-500 mt-1">Generate contracts and proposals for {clientData.full_name || clientData.business_name || 'this client'}.</p>
      </div>

      {/* Client Context */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Client Context</CardTitle>
        </CardHeader>
        <CardContent>
          {clientData.intake ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Business:</span> {clientData.intake.business_name}</div>
              <div><span className="text-gray-500">Industry:</span> {clientData.intake.industry || 'N/A'}</div>
              <div><span className="text-gray-500">Budget:</span> {clientData.intake.budget_range || 'N/A'}</div>
              <div><span className="text-gray-500">Timeline:</span> {clientData.intake.timeline || 'N/A'}</div>
              <div className="col-span-2">
                <span className="text-gray-500">Services: </span>
                {clientData.intake.services_interested.map((s) => (
                  <Badge key={s} variant="outline" className="mr-1 mb-1 text-xs">{s}</Badge>
                ))}
              </div>
              {clientData.intake.goals && (
                <div className="col-span-2"><span className="text-gray-500">Goals: </span>{clientData.intake.goals}</div>
              )}
            </div>
          ) : (
            <p className="text-sm text-amber-600">No intake data found. The AI will generate with limited context.</p>
          )}
        </CardContent>
      </Card>

      {/* Generate Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant={docType === 'contract' ? 'default' : 'outline'}
              onClick={() => setDocType('contract')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" /> Service Contract
            </Button>
            <Button
              variant={docType === 'proposal' ? 'default' : 'outline'}
              onClick={() => setDocType('proposal')}
              className="flex-1"
            >
              <Wand2 className="h-4 w-4 mr-2" /> Project Proposal
            </Button>
          </div>
          <Button
            className="w-full mt-4"
            size="lg"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating {docType}...</>
              : <><Wand2 className="h-4 w-4 mr-2" /> Generate {docType === 'contract' ? 'Contract' : 'Proposal'}</>}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Generated {docType === 'contract' ? 'Contract' : 'Proposal'}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <><CheckCircle className="h-4 w-4 mr-1" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
              </Button>
              <Button size="sm" onClick={handlePushToDocuSeal} disabled={pushing}>
                {pushing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Push to DocuSeal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              rows={25}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
