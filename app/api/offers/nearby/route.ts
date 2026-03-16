import { NextRequest, NextResponse } from 'next/server'
import { getNearbyOffers } from '@/modules/offers/service'

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') || '0')
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') || '0')
  const radius = parseFloat(req.nextUrl.searchParams.get('radius') || '5')
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'

  if (!lat || !lng) return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })

  const offers = await getNearbyOffers(lat, lng, radius, city)
  return NextResponse.json({ offers })
}
