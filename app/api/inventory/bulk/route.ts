import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()
    const { data: client } = await supabase.from('clients').select('id').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const fd = await request.formData()
    const csvFile = fd.get('csv') as File
    if (!csvFile) return NextResponse.json({ error: 'No CSV file' }, { status: 400 })

    const text = await csvFile.text()
    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) return NextResponse.json({ error: 'CSV must have header + at least 1 row' }, { status: 400 })

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/("[^"]*"|[^,]+)/g)?.map((v) => v.replace(/^"|"$/g, '').trim()) || []
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })

      if (!row.product_name) continue

      rows.push({
        client_id: client.id,
        product_name: row.product_name,
        description: row.description || null,
        price: row.price ? Math.round(parseFloat(row.price) * 100) : null,
        sku: row.sku || null,
        category: row.category || null,
        variant_size: row.variant_size || null,
        variant_color: row.variant_color || null,
        condition: row.condition || null,
        image_urls: row.image_urls ? row.image_urls.split(';').filter(Boolean) : null,
        status: 'pending',
      })
    }

    if (rows.length === 0) return NextResponse.json({ error: 'No valid rows found' }, { status: 400 })

    const { error } = await supabase.from('content_inventory').insert(rows)
    if (error) console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return NextResponse.json({ count: rows.length })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
