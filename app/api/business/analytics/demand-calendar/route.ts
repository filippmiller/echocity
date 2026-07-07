import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getBusinessAccessSummary } from '@/lib/business-access'
import { canViewAnalytics } from '@/lib/permissions'
import { getDemandCalendar } from '@/modules/analytics/demand-calendar'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { merchantIds, access } = await getBusinessAccessSummary(session)
  if (!canViewAnalytics(access)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') || undefined
  const category = searchParams.get('category') || undefined
  const daysBackRaw = searchParams.get('daysBack')
  const daysBack = daysBackRaw ? Number(daysBackRaw) : undefined

  const calendar = await getDemandCalendar(merchantIds, {
    city,
    category,
    daysBack,
  })

  return NextResponse.json({ calendar })
}
