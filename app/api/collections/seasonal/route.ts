import { NextResponse } from 'next/server'
import { getSeasonalCollections } from '@/modules/collections/seasonal'

// Revalidate once per hour — collections only change monthly but
// we refresh hourly so new offers get picked up without a redeploy.
export const revalidate = 3600

export async function GET() {
  try {
    const collections = await getSeasonalCollections()
    return NextResponse.json({ collections })
  } catch (error) {
    console.error('[seasonal-collections] error:', error)
    return NextResponse.json({ collections: [] })
  }
}
