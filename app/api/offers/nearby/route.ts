import { NextRequest, NextResponse } from 'next/server'
import { getNearbyOffers } from '@/modules/offers/service'

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') || '0')
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') || '0')
  const radius = parseFloat(req.nextUrl.searchParams.get('radius') || '5')
  const city = req.nextUrl.searchParams.get('city') || 'Санкт-Петербург'

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Invalid lat/lng: lat must be -90..90, lng must be -180..180' }, { status: 400 })
  }

  const offers = await getNearbyOffers(lat, lng, radius, city)
  return NextResponse.json({ offers })
}
