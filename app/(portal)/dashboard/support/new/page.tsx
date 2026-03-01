'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Paperclip } from 'lucide-react'

export default function NewTicketPage() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('subject', subject.trim())
      formData.append('description', description.trim())
      formData.append('priority', priority)
      if (file) formData.append('attachment', file)

      const res = await fetch('/api/tickets', { method: 'POST', body: formData })

      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/support/${data.ticket.id}`)
      } else {
        alert('Failed to create ticket. Please try again.')
      }
    } catch (_err) {
      console.error('Ticket creation error:', _err)
      alert('Failed to create ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">New Support Ticket</h1>
        <p className="text-gray-500 mt-1">Describe your issue and we&apos;ll get back to you as soon as possible.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of your issue" />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue in detail..." rows={6} />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Attachment (optional)</Label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="ticket-file" />
                <label htmlFor="ticket-file" className="cursor-pointer">
                  <Paperclip className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">{file ? file.name : 'Click to attach a file'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Max 10MB</p>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting || !subject.trim() || !description.trim()}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : 'Create Ticket'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
