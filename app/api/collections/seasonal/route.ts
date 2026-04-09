import { NextResponse } from 'next/server'
import { getSeasonalCollections } from '@/modules/collections/seasonal'
import { logger } from '@/lib/logger'
import { cached } from '@/lib/cache'

export const revalidate = 3600

const FIVE_MINUTES = 5 * 60 * 1000

export async function GET() {
  try {
    const collections = await cached('collections:seasonal', FIVE_MINUTES, getSeasonalCollections)
    return NextResponse.json({ collections }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    logger.error('collections.seasonal.error', { error: String(error) })
    return NextResponse.json({ collections: [] })
  }
}
