import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/profile/savings — savings tracker dashboard data
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.userId
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [lifetimeAgg, monthlyAgg, prevMonthAgg, monthlySeries] = await Promise.all([
    prisma.userSavings.aggregate({
      where: { userId },
      _sum: { savedAmount: true },
      _count: true,
    }),
    prisma.userSavings.aggregate({
      where: { userId, savedAt: { gte: monthStart } },
      _sum: { savedAmount: true },
      _count: true,
    }),
    prisma.userSavings.aggregate({
      where: { userId, savedAt: { gte: prevMonthStart, lt: monthStart } },
      _sum: { savedAmount: true },
    }),
    prisma.$queryRaw<Array<{ month: string; total: bigint }>>`
      SELECT TO_CHAR(us."savedAt", 'YYYY-MM') as month,
             COALESCE(SUM(us."savedAmount"), 0) as total
      FROM "UserSavings" us
      WHERE us."userId" = ${userId}
        AND us."savedAt" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
      GROUP BY TO_CHAR(us."savedAt", 'YYYY-MM')
      ORDER BY month ASC
    `.catch(() => [] as Array<{ month: string; total: bigint }>),
  ])

  const lifetimeRubles = Math.floor((lifetimeAgg._sum?.savedAmount ?? 0) / 100)
  const monthlyRubles = Math.floor((monthlyAgg._sum?.savedAmount ?? 0) / 100)
  const prevMonthRubles = Math.floor((prevMonthAgg._sum?.savedAmount ?? 0) / 100)
  const lifetimeCount = lifetimeAgg._count ?? 0
  const monthlyCount = monthlyAgg._count ?? 0

  return NextResponse.json({
    lifetime: { rubles: lifetimeRubles, count: lifetimeCount },
    thisMonth: { rubles: monthlyRubles, count: monthlyCount },
    prevMonth: { rubles: prevMonthRubles },
    monthOverMonth: prevMonthRubles > 0
      ? Math.round(((monthlyRubles - prevMonthRubles) / prevMonthRubles) * 100)
      : null,
    categories: [],
    monthlySeries: monthlySeries.map((m) => ({
      month: m.month,
      rubles: Math.floor(Number(m.total) / 100),
    })),
  })
}
