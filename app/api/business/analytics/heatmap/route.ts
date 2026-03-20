import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/business/analytics/heatmap
 * Returns redemption counts grouped by day-of-week and hour for the last 30 days.
 * Response: { cells: Array<{ day: number; hour: number; count: number }> }
 * day: 0=Monday … 6=Sunday (ISO weekday - 1)
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }
  if (session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  if (merchantIds.length === 0) {
    return NextResponse.json({ cells: [] })
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const redemptions = await prisma.redemption.findMany({
    where: {
      merchantId: { in: merchantIds },
      status: 'SUCCESS',
      redeemedAt: { gte: thirtyDaysAgo },
    },
    select: { redeemedAt: true },
  })

  // Build a 7x24 map: key = `day-hour`
  const countMap: Record<string, number> = {}

  for (const r of redemptions) {
    const date = r.redeemedAt
    // getDay(): 0=Sunday, 1=Monday... convert to 0=Monday, 6=Sunday
    const jsDay = date.getDay() // 0=Sun
    const day = jsDay === 0 ? 6 : jsDay - 1 // 0=Mon, 6=Sun
    const hour = date.getHours()
    const key = `${day}-${hour}`
    countMap[key] = (countMap[key] || 0) + 1
  }

  // Flatten to array
  const cells: { day: number; hour: number; count: number }[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const count = countMap[`${day}-${hour}`] || 0
      if (count > 0) {
        cells.push({ day, hour, count })
      }
    }
  }

  return NextResponse.json({ cells })
}
