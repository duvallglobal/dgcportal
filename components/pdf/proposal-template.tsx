import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// DGC Brand fonts
Font.register({
    family: 'Montserrat',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf' },
        { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTURjIg1_i6t8kCHKm45_dJE3gnD_g.ttf', fontWeight: 'bold' }
    ]
})

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Montserrat', backgroundColor: '#ffffff', color: '#1a1a2e' },
    header: { borderBottom: '2 solid #e2b714', paddingBottom: 20, marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    brand: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e' },
    brandSub: { fontSize: 10, color: '#666666', marginTop: 4 },
    docTitle: { fontSize: 32, fontWeight: 'bold', color: '#e2b714', textAlign: 'right' },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', borderBottom: '1 solid #eaeaea', paddingBottom: 5, marginBottom: 10, color: '#1a1a2e', textTransform: 'uppercase' },
    text: { fontSize: 10, lineHeight: 1.6, color: '#333333' },
    row: { flexDirection: 'row', marginBottom: 5 },
    label: { width: 120, fontSize: 10, fontWeight: 'bold', color: '#666666' },
    value: { flex: 1, fontSize: 10, color: '#1a1a2e' },
    contentBox: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 4, marginTop: 10, borderLeft: '3 solid #e2b714' },
    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: '1 solid #eaeaea', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 8, color: '#9ca3af' },
})

export interface ProposalData {
    clientName: string
    businessName: string
    date: string
    content: string // The AI generated proposal text
}

export function ProposalTemplate({ data }: { data: ProposalData }) {
    // Simple paragraph splitter
    const paragraphs = data.content.split('\n\n').filter(Boolean)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>DG Consulting</Text>
                        <Text style={styles.brandSub}>Digital Identity & Automation</Text>
                    </View>
                    <Text style={styles.docTitle}>PROJECT PROPOSAL</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Prepared For</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Date Prepared:</Text>
                        <Text style={styles.value}>{data.date}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Client Name:</Text>
                        <Text style={styles.value}>{data.clientName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Business Name:</Text>
                        <Text style={styles.value}>{data.businessName || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Proposed Solution & Investment</Text>
                    <View style={styles.contentBox}>
                        {paragraphs.map((para, i) => (
                            <Text key={i} style={[styles.text, { marginBottom: 12 }]}>
                                {para.replace(/\*\*/g, '')}
                            </Text>
                        ))}
                    </View>
                </View>

                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>dgc.today | Confidential Proposal</Text>
                    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}
