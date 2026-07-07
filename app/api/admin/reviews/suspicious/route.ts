import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getSuspiciousReviewSignals } from '@/modules/reviews/antifraud'
import { logger } from '@/lib/logger'

function parseIntParam(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = value === null ? NaN : parseInt(value, 10)
  const normalized = Number.isNaN(parsed) ? fallback : parsed
  return Math.min(Math.max(normalized, min), max)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const velocityWindowHours = parseIntParam(
      req.nextUrl.searchParams.get('windowHours'),
      24,
      1,
      168
    )
    const velocityThreshold = parseIntParam(
      req.nextUrl.searchParams.get('threshold'),
      5,
      1,
      100
    )
    const sampleLimit = parseIntParam(req.nextUrl.searchParams.get('limit'), 50, 1, 200)

    const signals = await getSuspiciousReviewSignals({
      velocityWindowHours,
      velocityThreshold,
      sampleLimit,
    })
    return NextResponse.json(signals)
  } catch (error) {
    logger.error('admin.reviews.suspicious.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при построении отчёта о подозрительных отзывах' },
      { status: 500 }
    )
  }
}
