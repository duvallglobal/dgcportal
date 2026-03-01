const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_URL || 'http://localhost:3001'
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY || ''

interface DocuSealSubmitter {
  name: string
  email: string
  role: string
  fields?: Array<{ name: string; default_value: string }>
}

interface CreateSubmissionOptions {
  templateId: number
  submitters: DocuSealSubmitter[]
}

/**
 * Create a signing submission in DocuSeal.
 * Returns the submission data including the embed URL for the signing form.
 */
export async function createSubmission({ templateId, submitters }: CreateSubmissionOptions) {
  const response = await fetch(`${DOCUSEAL_API_URL}/api/submissions`, {
    method: 'POST',
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId,
      send_email: false,
      submitters,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`DocuSeal API error (${response.status}): ${errorBody}`)
  }

  return response.json()
}

/**
 * Get a submission by ID from DocuSeal.
 */
export async function getSubmission(submissionId: number) {
  const response = await fetch(`${DOCUSEAL_API_URL}/api/submissions/${submissionId}`, {
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`DocuSeal API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * List available templates from DocuSeal.
 */
export async function listTemplates() {
  const response = await fetch(`${DOCUSEAL_API_URL}/api/templates`, {
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`DocuSeal API error: ${response.statusText}`)
  }

  return response.json()
}
