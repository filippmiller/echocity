import { NextRequest, NextResponse } from 'next/server'
import { getActiveOffersByCity } from '@/modules/offers/service'

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'
  const visibility = req.nextUrl.searchParams.get('visibility') || undefined
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '50') || 50, 1), 100)
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0') || 0, 0)

  const offers = await getActiveOffersByCity(city, { visibility, limit, offset })
  return NextResponse.json({ offers })
}
