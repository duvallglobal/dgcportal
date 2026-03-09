import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { createSubmission, getSubmission } from '@/lib/docuseal'

const DOCUSEAL_TEMPLATE_ID = Number(process.env.DOCUSEAL_TEMPLATE_ID || '0')

/**
 * DocuSeal submission submitter interface
 * Based on DocuSeal API response structure
 */
interface DocuSealSubmitter {
  completed_at?: string
  embed_src?: string
  submission_id?: string | number
  [key: string]: unknown
}

/**
 * DocuSeal submission response interface
 */
interface DocuSealSubmission {
  id?: string | number
  submitters?: DocuSealSubmitter[]
  [key: string]: unknown
}

/**
 * GET /api/agreements/docuseal-embed?agreementId=<id>
 *
 * Returns (or lazily creates) a DocuSeal submission for the given agreement,
 * then returns the embed URL so the frontend <DocusealForm> can render it.
 *
 * Strategy:
 *  - If a docuseal_submission_id already exists, fetch the submission from DocuSeal
 *    to retrieve the embed URL for the first (incomplete) submitter.
 *  - Otherwise, create a new submission in DocuSeal and persist the submission ID.
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const agreementId = searchParams.get('agreementId')
        if (!agreementId) {
            return NextResponse.json({ error: 'agreementId is required' }, { status: 400 })
        }

        const supabase = await createServerSupabaseClient()
        const adminSupabase = createAdminSupabaseClient()

        // Verify the agreement belongs to this user via their client profile
        const { data: profile } = await supabase
            .from('client_profiles')
            .select('id, full_name, email')
            .eq('clerk_user_id', userId)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const { data: agreement, error: agreementError } = await adminSupabase
            .from('service_agreements')
            .select('id, status, docuseal_submission_id, client_id')
            .eq('id', agreementId)
            .eq('client_id', profile.id)
            .single()

        if (agreementError || !agreement) {
            return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
        }

        if (agreement.status !== 'unsigned') {
            return NextResponse.json({ error: 'Agreement already signed' }, { status: 400 })
        }

        // ── Case 1: Submission already created — re-fetch the embed URL from DocuSeal
        if (agreement.docuseal_submission_id) {
            try {
                const submission = await getSubmission(Number(agreement.docuseal_submission_id)) as DocuSealSubmission
                // Find the first submitter that hasn't completed yet
                const pendingSubmitter = submission.submitters
                    ?.find((s: DocuSealSubmitter) => !s.completed_at)
                if (pendingSubmitter?.embed_src) {
                    return NextResponse.json({ embedUrl: pendingSubmitter.embed_src })
                }
            } catch (err) {
                console.warn('DocuSeal: failed to re-fetch submission, will create a new one', err)
            }
        }

        // ── Case 2: No submission yet — create one
        if (!DOCUSEAL_TEMPLATE_ID) {
            return NextResponse.json(
                { error: 'DocuSeal template not configured — set DOCUSEAL_TEMPLATE_ID' },
                { status: 503 }
            )
        }

        const submission = await createSubmission({
            templateId: DOCUSEAL_TEMPLATE_ID,
            submitters: [
                {
                    name: profile.full_name || 'Client',
                    email: profile.email,
                    role: 'Client',
                    fields: [
                        { name: 'name', default_value: profile.full_name || '' },
                        { name: 'email', default_value: profile.email },
                    ],
                },
            ],
        })

        // DocuSeal returns an array of submitters (one submission, multiple possible submitters)
        const submitter = Array.isArray(submission) ? submission[0] : submission?.submitters?.[0]
        const embedUrl: string | undefined = submitter?.embed_src

        if (!embedUrl) {
            console.error('DocuSeal did not return an embed_src', submission)
            return NextResponse.json(
                { error: 'Failed to create DocuSeal submission — no embed URL returned' },
                { status: 502 }
            )
        }

        // Persist the submission ID so we can re-fetch the embed URL on future page loads
        const submissionId = String(submitter?.submission_id ?? submission?.id ?? '')
        if (submissionId) {
            await adminSupabase
                .from('service_agreements')
                .update({
                    docuseal_submission_id: submissionId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', agreementId)
        }

        return NextResponse.json({ embedUrl })
    } catch (error: unknown) {
        console.error('DocuSeal embed error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
