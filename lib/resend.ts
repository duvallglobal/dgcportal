import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set — email functionality will be disabled')
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  if (!resend) {
    console.warn('Email not sent — RESEND_API_KEY not configured')
    return null
  }

  const { data, error } = await resend.emails.send({
    from: from || 'DGC Portal <portal@dgc.today>',
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })

  if (error) {
    console.error('Failed to send email:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return data
}
