import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminSupabaseClient()

    const { data: clients } = await supabase
      .from('clients')
      .select('full_name, email, business_name, phone, created_at')
      .order('created_at', { ascending: false })

    if (!clients || clients.length === 0) {
      return new NextResponse('No data', { status: 200 })
    }

    const headers = ['Full Name', 'Email', 'Business Name', 'Phone', 'Joined']
    const rows = clients.map((c) => [
      c.full_name || '',
      c.email,
      c.business_name || '',
      c.phone || '',
      new Date(c.created_at).toISOString().split('T')[0],
    ])

    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const csv = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dgc-clients-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
