import { NextRequest, NextResponse } from 'next/server'
import { getDemandForPlace } from '@/modules/demand/service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const demand = await getDemandForPlace(id)
  return NextResponse.json({ demand })
}
