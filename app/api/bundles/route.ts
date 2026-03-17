import { NextRequest, NextResponse } from 'next/server'
import { getActiveBundles } from '@/modules/bundles/service'

export async function GET(req: NextRequest) {
  const cityId = req.nextUrl.searchParams.get('cityId') || undefined
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 20, 50)

  try {
    const bundles = await getActiveBundles(cityId, limit)
    return NextResponse.json({ bundles })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
