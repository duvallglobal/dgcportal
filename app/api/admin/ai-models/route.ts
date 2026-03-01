import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/dal'
import { fetchAvailableModels } from '@/lib/nvidia-ai'

export async function GET() {
  try {
    await requireAdmin()
    const models = await fetchAvailableModels()
    return NextResponse.json({ models })
  } catch (error: unknown) {
    console.error('Failed to fetch NVIDIA models:', error)
    return NextResponse.json({ error: error.message, models: [] }, { status: 500 })
  }
}
