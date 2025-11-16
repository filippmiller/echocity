import { NextRequest, NextResponse } from 'next/server'
import { searchBusinesses, isYandexMapsConfigured, YandexMapsNotConfiguredError } from '@/modules/yandex/places'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const searchSchema = z.object({
  text: z.string().min(1, 'Search text is required'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Yandex Maps is configured
    if (!isYandexMapsConfigured()) {
      return NextResponse.json(
        { error: 'YANDEX_MAPS_NOT_CONFIGURED', message: 'Yandex Maps API is not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')
    const limit = searchParams.get('limit')

    // Validate input
    const validation = searchSchema.safeParse({ text, limit })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { text: searchText, limit: searchLimit } = validation.data

    // Search businesses
    try {
      const results = await searchBusinesses({
        text: searchText,
        limit: searchLimit,
      })

      // Return simplified format for frontend
      const simplifiedResults = results.map((result) => ({
        id: result.id,
        name: result.name,
        address: result.address,
        phones: result.phones,
        coordinates: result.coordinates,
      }))

      logger.info('yandex.places.search.success', {
        userId: session.userId,
        query: searchText,
        resultsCount: simplifiedResults.length,
      })

      return NextResponse.json({ results: simplifiedResults })
    } catch (error) {
      if (error instanceof YandexMapsNotConfiguredError) {
        return NextResponse.json(
          { error: 'YANDEX_MAPS_NOT_CONFIGURED', message: error.message },
          { status: 503 }
        )
      }

      logger.error('yandex.places.search.error', {
        userId: session.userId,
        query: searchText,
        error: String(error),
      })

      return NextResponse.json(
        { error: 'Failed to search businesses', message: String(error) },
        { status: 502 }
      )
    }
  } catch (error) {
    logger.error('yandex.places.search.api.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

