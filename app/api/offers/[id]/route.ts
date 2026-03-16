import { NextRequest, NextResponse } from 'next/server'
import { getOfferById } from '@/modules/offers/service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const offer = await getOfferById(id)
    if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ offer })
  } catch (error) {
    console.error('GET /api/offers/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
