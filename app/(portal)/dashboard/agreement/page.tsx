'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { DocusealForm } from '@docuseal/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileSignature, CheckCircle, CreditCard, Loader2, AlertCircle, Clock, ExternalLink } from 'lucide-react'

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
  unsigned: { label: 'Awaiting Signature', color: 'bg-gray-100 text-gray-700', icon: FileSignature },
  signed_awaiting_deposit: { label: 'Signed — Awaiting Deposit', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  deposit_paid: { label: 'Deposit Paid', color: 'bg-blue-100 text-blue-800', icon: CreditCard },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

function AgreementSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-100 rounded" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="h-6 w-28 bg-gray-100 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 w-32 bg-gray-100 rounded" />)}
          </div>
          <div className="h-10 w-44 bg-gray-200 rounded" />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * DocuSeal embed for a single agreement.
 * Lazily fetches the embed URL from the API and renders the DocuSeal form.
 */
function DocuSealEmbed({
  agreementId,
  onCompleted,
}: {
  agreementId: string
  onCompleted: () => void
}) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchEmbed() {
      try {
        const res = await fetch(`/api/agreements/docuseal-embed?agreementId=${agreementId}`)
        const data = await res.json()
        if (!cancelled) {
          if (res.ok && data.embedUrl) {
            setEmbedUrl(data.embedUrl)
          } else {
            setError(data.error || 'Failed to load signing form')
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load signing form')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchEmbed()
    return () => { cancelled = true }
  }, [agreementId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading signing form…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        {error}
      </div>
    )
  }

  if (!embedUrl) return null

  return (
    <DocusealForm
      src={embedUrl}
      onComplete={onCompleted}
      className="w-full min-h-[600px] rounded-lg border overflow-hidden"
    />
  )
}

function AgreementContent() {
  const searchParams = useSearchParams()
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [signingId, setSigningId] = useState<string | null>(null)

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

  const handleDocuSealComplete = useCallback(async () => {
    setSigningId(null)
    // Give DocuSeal's webhook a moment to fire before re-fetching
    await new Promise((r) => setTimeout(r, 1500))
    await fetchAgreements()
  }, [fetchAgreements])

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

  if (loading) return <AgreementSkeleton />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Service Agreement</h1>
        <p className="text-gray-500 mt-1">
          Review and sign your service agreement, then pay the deposit to get started.
        </p>
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
            <p className="text-sm text-gray-500 mt-2">
              Once your project intake is reviewed, we&apos;ll prepare a service agreement for you to sign here.
            </p>
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
                    {agreement.signed_at && (
                      <div><span className="text-gray-500">Signed:</span> {new Date(agreement.signed_at).toLocaleDateString()}</div>
                    )}
                    {agreement.deposit_amount && (
                      <div><span className="text-gray-500">Deposit:</span> ${(agreement.deposit_amount / 100).toFixed(2)}</div>
                    )}
                  </div>

                  {agreement.signed_pdf_url && (
                    <a
                      href={agreement.signed_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" /> View Signed Agreement (PDF)
                    </a>
                  )}

                  {/* DocuSeal signing section */}
                  {agreement.status === 'unsigned' && (
                    <>
                      {signingId === agreement.id ? (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                            Please review the agreement fully and click <strong>Sign</strong> inside the form below.
                            Your signature will be legally binding via DocuSeal.
                          </div>
                          <DocuSealEmbed
                            agreementId={agreement.id}
                            onCompleted={handleDocuSealComplete}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSigningId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => setSigningId(agreement.id)}>
                          <FileSignature className="h-4 w-4 mr-2" /> Review &amp; Sign Agreement
                        </Button>
                      )}
                    </>
                  )}

                  {agreement.status === 'signed_awaiting_deposit' && agreement.deposit_amount && (
                    <Button
                      onClick={() => handlePayDeposit(agreement.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Deposit (${(agreement.deposit_amount / 100).toFixed(2)})
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

export default function AgreementPage() {
  return (
    <Suspense fallback={<AgreementSkeleton />}>
      <AgreementContent />
    </Suspense>
  )
}
