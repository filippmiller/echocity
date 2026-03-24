import { NextRequest, NextResponse } from 'next/server'
import { getAvailableMysteryBags } from '@/modules/mystery-bags/service'

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city') || undefined

  const bags = await getAvailableMysteryBags(city)

  return NextResponse.json({ bags })
}
