import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dal'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { callNvidiaAI, type ChatMessage } from '@/lib/nvidia-ai'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { productId } = await request.json()
    const supabase = await createServerSupabaseClient()

    const { data: client } = await supabase.from('clients').select('id').eq('clerk_user_id', user.userId).single()
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: product } = await supabase
      .from('content_inventory')
      .select('*')
      .eq('id', productId)
      .eq('client_id', client.id)
      .single()

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const msg: ChatMessage = {
      role: 'user',
      content: `Write an optimized e-commerce product description for multi-platform listing (eBay, Poshmark, Mercari, Shopify).\n\nProduct: ${product.product_name}\nCategory: ${product.category || 'N/A'}\nCondition: ${product.condition || 'N/A'}\nSize: ${product.variant_size || 'N/A'}\nColor: ${product.variant_color || 'N/A'}\nPrice: ${product.price ? '$' + (product.price / 100).toFixed(2) : 'N/A'}\nCurrent Description: ${product.description || 'None'}\n\nWrite a compelling, keyword-rich description in 2-3 short paragraphs. Include relevant search keywords naturally.`,
    }

    const description = await callNvidiaAI('chatbot', [msg])

    await supabase
      .from('content_inventory')
      .update({ description, updated_at: new Date().toISOString() })
      .eq('id', productId)

    return NextResponse.json({ description })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
