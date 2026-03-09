import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import * as React from 'react'

interface AdminAgreementSignedProps {
    clientName: string
    clientEmail: string
    agreementId: string
    signedAt: string
    depositAmount?: number | null
    signedPdfUrl?: string | null
    adminUrl: string
}

export function AdminAgreementSigned({
    clientName,
    clientEmail,
    agreementId,
    signedAt,
    depositAmount,
    signedPdfUrl,
    adminUrl,
}: AdminAgreementSignedProps) {
    const formattedDate = new Date(signedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    const formattedDeposit = depositAmount
        ? `$${(depositAmount / 100).toFixed(2)} `
        : null

    return (
        <Html>
            <Head />
            <Preview>
                {clientName} has signed their service agreement
                {depositAmount ? ' — awaiting deposit payment' : ' — agreement is now active'}
            </Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={logo}>DGC Portal</Heading>
                        <Text style={tagline}>Admin Notification</Text>
                    </Section>

                    {/* Status Banner */}
                    <Section style={bannerSection}>
                        <div style={banner}>
                            <Text style={bannerText}>✅ Agreement Signed</Text>
                        </div>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        <Heading as="h2" style={h2}>
                            A client has signed their service agreement
                        </Heading>
                        <Text style={paragraph}>
                            <strong>{clientName}</strong> ({clientEmail}) has completed the electronic
                            signature on their service agreement via DocuSeal.
                        </Text>

                        {/* Details Table */}
                        <Section style={detailsBox}>
                            <table style={table} width="100%">
                                <tbody>
                                    <tr>
                                        <td style={labelCell}>Client Name</td>
                                        <td style={valueCell}>{clientName}</td>
                                    </tr>
                                    <tr style={altRow}>
                                        <td style={labelCell}>Email</td>
                                        <td style={valueCell}>{clientEmail}</td>
                                    </tr>
                                    <tr>
                                        <td style={labelCell}>Agreement ID</td>
                                        <td style={valueCell}>
                                            <code style={code}>{agreementId}</code>
                                        </td>
                                    </tr>
                                    <tr style={altRow}>
                                        <td style={labelCell}>Signed At</td>
                                        <td style={valueCell}>{formattedDate}</td>
                                    </tr>
                                    {formattedDeposit && (
                                        <tr>
                                            <td style={labelCell}>Deposit Required</td>
                                            <td style={{ ...valueCell, fontWeight: 700, color: '#065f46' }}>
                                                {formattedDeposit}
                                            </td>
                                        </tr>
                                    )}
                                    <tr style={formattedDeposit ? altRow : {}}>
                                        <td style={labelCell}>Status</td>
                                        <td style={valueCell}>
                                            {formattedDeposit ? (
                                                <span style={statusBadgeYellow}>Awaiting Deposit</span>
                                            ) : (
                                                <span style={statusBadgeGreen}>Active</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Section>

                        {/* Next Step Callout */}
                        {formattedDeposit && (
                            <Section style={callout}>
                                <Text style={calloutText}>
                                    💡 <strong>Action Required:</strong> The client needs to pay their{' '}
                                    {formattedDeposit} deposit before the project goes active. Monitor the
                                    client record for the deposit payment.
                                </Text>
                            </Section>
                        )}

                        {/* CTA Buttons */}
                        <Section style={ctaSection}>
                            <Button href={adminUrl} style={primaryButton}>
                                View Client in Admin
                            </Button>
                            {signedPdfUrl && (
                                <Button href={signedPdfUrl} style={secondaryButton}>
                                    Download Signed Agreement (PDF)
                                </Button>
                            )}
                        </Section>
                    </Section>

                    <Hr style={hr} />
                    <Text style={footer}>
                        This is an automated notification from the{' '}
                        <Link href="https://dgc.today" style={footerLink}>
                            DGC Portal
                        </Link>
                        . Do not reply to this email.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container: React.CSSProperties = {
    maxWidth: '600px',
    margin: '40px auto',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)',
}

const header: React.CSSProperties = {
    backgroundColor: '#111827',
    padding: '32px 40px 24px',
    textAlign: 'center',
}

const logo: React.CSSProperties = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 800,
    margin: '0',
    letterSpacing: '-0.5px',
}

const tagline: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '13px',
    margin: '4px 0 0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
}

const bannerSection: React.CSSProperties = {
    padding: '0',
}

const banner: React.CSSProperties = {
    backgroundColor: '#d1fae5',
    padding: '12px 40px',
    borderBottom: '1px solid #a7f3d0',
    textAlign: 'center',
}

const bannerText: React.CSSProperties = {
    color: '#065f46',
    fontSize: '15px',
    fontWeight: 600,
    margin: '0',
}

const content: React.CSSProperties = {
    padding: '32px 40px',
}

const h2: React.CSSProperties = {
    color: '#111827',
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 12px',
}

const paragraph: React.CSSProperties = {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 24px',
}

const detailsBox: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '24px',
}

const table: React.CSSProperties = {
    borderCollapse: 'collapse',
}

const labelCell: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
    width: '40%',
    borderBottom: '1px solid #f3f4f6',
}

const valueCell: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: '13px',
    color: '#111827',
    borderBottom: '1px solid #f3f4f6',
}

const altRow: React.CSSProperties = {
    backgroundColor: '#f9fafb',
}

const code: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
}

const statusBadgeGreen: React.CSSProperties = {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '2px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
}

const statusBadgeYellow: React.CSSProperties = {
    backgroundColor: '#fef9c3',
    color: '#92400e',
    padding: '2px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
}

const callout: React.CSSProperties = {
    backgroundColor: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '0 16px',
    marginBottom: '24px',
}

const calloutText: React.CSSProperties = {
    color: '#78350f',
    fontSize: '14px',
    lineHeight: '1.5',
}

const ctaSection: React.CSSProperties = {
    textAlign: 'center',
}

const primaryButton: React.CSSProperties = {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-block',
    margin: '0 8px 8px 0',
}

const secondaryButton: React.CSSProperties = {
    backgroundColor: '#ffffff',
    color: '#374151',
    padding: '11px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-block',
    border: '1px solid #d1d5db',
    margin: '0 0 8px',
}

const hr: React.CSSProperties = {
    borderColor: '#e5e7eb',
    margin: '0 40px',
}

const footer: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '12px',
    textAlign: 'center',
    padding: '20px 40px',
    margin: '0',
}

const footerLink: React.CSSProperties = {
    color: '#6b7280',
}

export default AdminAgreementSigned
