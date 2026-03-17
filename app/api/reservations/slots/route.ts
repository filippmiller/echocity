import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/modules/reservations/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const placeId = searchParams.get('placeId')
  const date = searchParams.get('date')
  const partySize = parseInt(searchParams.get('partySize') || '2', 10)

  if (!placeId || !date) {
    return NextResponse.json(
      { error: 'placeId and date are required' },
      { status: 400 },
    )
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'date must be in YYYY-MM-DD format' },
      { status: 400 },
    )
  }

  if (partySize < 1 || partySize > 20) {
    return NextResponse.json(
      { error: 'partySize must be between 1 and 20' },
      { status: 400 },
    )
  }

  const result = await getAvailableSlots(placeId, date, partySize)
  return NextResponse.json(result)
}
