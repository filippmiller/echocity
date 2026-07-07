import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getContentQualityReport } from '@/modules/admin/content-quality'
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
    const sampleLimit = parseIntParam(req.nextUrl.searchParams.get('limit'), 20, 1, 100)
    const report = await getContentQualityReport(sampleLimit)
    return NextResponse.json(report)
  } catch (error) {
    logger.error('admin.content-quality.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при построении отчёта о качестве контента' },
      { status: 500 }
    )
  }
}
