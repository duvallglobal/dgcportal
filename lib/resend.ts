import { Resend } from 'resend'
import { render } from '@react-email/render'
import type { ReactElement } from 'react'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set — email functionality will be disabled')
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  /** Raw HTML string — used when no React Email component is provided */
  html?: string
  /** React Email component — rendered server-side; takes precedence over html */
  react?: ReactElement
  from?: string
}

export async function sendEmail({ to, subject, html, react, from }: SendEmailOptions) {
  if (!resend) {
    console.warn('Email not sent — RESEND_API_KEY not configured')
    return null
  }

  // Prefer React Email component render over raw html
  const finalHtml = react ? await render(react) : (html ?? '')

  const { data, error } = await resend.emails.send({
    from: from || 'DGC Portal <portal@dgc.today>',
    to: Array.isArray(to) ? to : [to],
    subject,
    html: finalHtml,
  })

  if (error) {
    console.error('Failed to send email:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return data
}
