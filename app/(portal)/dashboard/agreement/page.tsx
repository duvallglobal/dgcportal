'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { FileSignature, CheckCircle, CreditCard, Loader2, AlertCircle, Clock, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Agreement {
  id: string
  status: 'unsigned' | 'signed_awaiting_deposit' | 'deposit_paid' | 'active'
  deposit_amount: number | null
  signed_at: string | null
  created_at: string
  docuseal_submission_id: string | null
  signed_pdf_url: string | null
}

const STATUS_CONFIG = {
  unsigned: { label: 'Unsigned', color: 'bg-gray-100 text-gray-700', icon: FileSignature },
  signed_awaiting_deposit: { label: 'Signed — Awaiting Deposit', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  deposit_paid: { label: 'Deposit Paid', color: 'bg-blue-100 text-blue-800', icon: CreditCard },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

export default function AgreementPage() {
  const searchParams = useSearchParams()
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [signingId, setSigningId] = useState<string | null>(null)
  const [signedName, setSignedName] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const signed = searchParams.get('signed') === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  const fetchAgreements = useCallback(async () => {
    try {
      const res = await fetch('/api/agreements')
      if (res.ok) {
        const data = await res.json()
        setAgreements(data.agreements || [])
      }
    } catch (err) {
      console.error('Failed to fetch agreements:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgreements() }, [fetchAgreements])

  const handleSign = async (agreementId: string) => {
    if (!signedName.trim() || !consent) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/agreements/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementId, signedName: signedName.trim(), consentChecked: consent }),
      })
      const data = await res.json()
      if (data.redirect) {
        window.location.href = data.redirect
      } else {
        await fetchAgreements()
        setSigningId(null)
        setSignedName('')
        setConsent(false)
      }
    } catch (err) {
      console.error('Signing error:', err)
      alert('Failed to sign agreement. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayDeposit = async (agreementId: string) => {
    try {
      const res = await fetch('/api/agreements/pay-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Deposit payment error:', err)
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Service Agreement</h1>
        <p className="text-gray-500 mt-1">Review and sign your service agreement, then pay the deposit to get started.</p>
      </div>

      {signed && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">Deposit payment received! Your project is now active.</p>
        </div>
      )}

      {canceled && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">Deposit payment was canceled. You can pay at any time below.</p>
        </div>
      )}

      {agreements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSignature className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Agreements Yet</h3>
            <p className="text-sm text-gray-500 mt-2">Once your project intake is reviewed, we'll prepare a service agreement for you to sign here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {agreements.map((agreement) => {
            const config = STATUS_CONFIG[agreement.status]
            const StatusIcon = config.icon

            return (
              <Card key={agreement.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Service Agreement</CardTitle>
                  <Badge className={config.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Created:</span> {new Date(agreement.created_at).toLocaleDateString()}</div>
                    {agreement.signed_at && <div><span className="text-gray-500">Signed:</span> {new Date(agreement.signed_at).toLocaleDateString()}</div>}
                    {agreement.deposit_amount && <div><span className="text-gray-500">Deposit:</span> ${(agreement.deposit_amount / 100).toFixed(2)}</div>}
                  </div>

                  {agreement.signed_pdf_url && (
                    <a href={agreement.signed_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                      <FileSignature className="h-4 w-4" /> View Signed Agreement (PDF)
                    </a>
                  )}

                  {/* Unsigned: show signing form */}
                  {agreement.status === 'unsigned' && (
                    <>
                      {signingId === agreement.id ? (
                        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Shield className="h-4 w-4" />
                            <span>By signing below, you agree to the terms of this service agreement.</span>
                          </div>
                          <div>
                            <Label htmlFor="signedName">Type Your Full Legal Name</Label>
                            <Input
                              id="signedName"
                              value={signedName}
                              onChange={(e) => setSignedName(e.target.value)}
                              placeholder="Your Full Name"
                              className="font-serif text-lg"
                            />
                          </div>
                          <div className="flex items-start gap-3">
                            <Checkbox id="consent" checked={consent} onCheckedChange={(c) => setConsent(!!c)} />
                            <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer">
                              I have read and agree to the terms of this service agreement. I understand that my typed name, IP address, and timestamp will be recorded as my electronic signature.
                            </label>
                          </div>
                          <div className="flex gap-3">
                            <Button onClick={() => handleSign(agreement.id)} disabled={!signedName.trim() || !consent || submitting}>
                              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing...</> : 'Sign Agreement'}
                            </Button>
                            <Button variant="outline" onClick={() => { setSigningId(null); setSignedName(''); setConsent(false) }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={() => setSigningId(agreement.id)}>
                          <FileSignature className="h-4 w-4 mr-2" /> Review & Sign Agreement
                        </Button>
                      )}
                    </>
                  )}

                  {/* Signed but deposit unpaid */}
                  {agreement.status === 'signed_awaiting_deposit' && agreement.deposit_amount && (
                    <Button onClick={() => handlePayDeposit(agreement.id)} className="bg-green-600 hover:bg-green-700">
                      <CreditCard className="h-4 w-4 mr-2" /> Pay Deposit (${(agreement.deposit_amount / 100).toFixed(2)})
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
