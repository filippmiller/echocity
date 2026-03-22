import { NextRequest, NextResponse } from 'next/server'
import { getDemandForPlace } from '@/modules/demand/service'

/**
 * GET /api/demand/[id]/place — get demand requests for a specific place.
 * The [id] parameter here is the PLACE ID (not demand ID).
 * Route is /api/demand/{placeId}/place to avoid slug conflict with /api/demand/{id}/bids.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: placeId } = await params
  const demands = await getDemandForPlace(placeId)

  if (!demands || demands.length === 0) {
    return NextResponse.json({ demands: [] })
  }

  return NextResponse.json({ demands })
}
