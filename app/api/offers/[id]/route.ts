import { NextRequest, NextResponse } from 'next/server'
import { getOfferById } from '@/modules/offers/service'
import { logger } from '@/lib/logger'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const offer = await getOfferById(id)
    if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ offer })
  } catch (error) {
    logger.error('offers.get.error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
