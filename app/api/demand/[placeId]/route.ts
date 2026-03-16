import { NextRequest, NextResponse } from 'next/server'
import { getDemandForPlace } from '@/modules/demand/service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params
  const demand = await getDemandForPlace(placeId)
  return NextResponse.json({ demand })
}
