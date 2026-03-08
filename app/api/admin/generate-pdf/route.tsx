import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { ContractTemplate } from '@/components/pdf/contract-template'
import { ProposalTemplate } from '@/components/pdf/proposal-template'

export async function POST(request: NextRequest) {
    try {
        await requireAdmin()
        const { clientId, content, type } = await request.json()

        if (!clientId || !content || !['contract', 'proposal'].includes(type)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const supabase = createAdminSupabaseClient()

        // Get client details for the PDF
        const { data: client } = await supabase
            .from('clients')
            .select('full_name, business_name')
            .eq('id', clientId)
            .single()

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        const docData = {
            clientName: client.full_name || 'Client',
            businessName: client.business_name || '',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            content,
        }

        let stream
        if (type === 'contract') {
            stream = await renderToStream(<ContractTemplate data={docData} />)
        } else {
            stream = await renderToStream(<ProposalTemplate data={docData} />)
        }

        // Convert stream to Buffer
        const chunks: Uint8Array[] = []
        for await (const chunk of stream) {
            chunks.push(chunk as Uint8Array)
        }
        const pdfBuffer = Buffer.concat(chunks)

        // Upload to Supabase Storage
        const fileName = `${clientId}/${type}_${Date.now()}.pdf`
        const { error: uploadError } = await supabase.storage
            .from('intake-assets')
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: false
            })

        if (uploadError) {
            console.error('Upload Error:', uploadError)
            throw new Error('Failed to upload PDF')
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('intake-assets')
            .getPublicUrl(fileName)

        return NextResponse.json({ url: publicUrl })
    } catch (error: unknown) {
        console.error('PDF Generation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
