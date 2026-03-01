import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()
    const { data: client } = await supabase.from('clients').select('id').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ products: [] })

    const { data: products } = await supabase
      .from('content_inventory')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ products: products || [] })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerSupabaseClient()
    const { data: client } = await supabase.from('clients').select('id').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const fd = await request.formData()
    const imageFiles = fd.getAll('images') as File[]
    const imageUrls: string[] = []

    for (const file of imageFiles) {
      if (file.size > 0) {
        const ext = file.name.split('.').pop()
        const path = `products/${client.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: uploaded } = await supabase.storage.from('product-images').upload(path, file)
        if (uploaded) {
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
          imageUrls.push(urlData.publicUrl)
        }
      }
    }

    const priceStr = fd.get('price') as string
    const price = priceStr ? Math.round(parseFloat(priceStr) * 100) : null

    const { data: product, error } = await supabase
      .from('content_inventory')
      .insert({
        client_id: client.id,
        product_name: fd.get('product_name') as string,
        description: (fd.get('description') as string) || null,
        price,
        sku: (fd.get('sku') as string) || null,
        category: (fd.get('category') as string) || null,
        variant_size: (fd.get('variant_size') as string) || null,
        variant_color: (fd.get('variant_color') as string) || null,
        condition: (fd.get('condition') as string) || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ product })
  } catch (error: unknown) {
    console.error('API error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
