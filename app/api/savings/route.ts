import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // Monday
  startOfWeek.setHours(0, 0, 0, 0)

  // Try UserSavings table first
  const [allSavings, monthSavings, weekSavings] = await Promise.all([
    prisma.userSavings.aggregate({
      where: { userId: session.userId },
      _sum: { savedAmount: true },
      _count: true,
    }),
    prisma.userSavings.aggregate({
      where: { userId: session.userId, savedAt: { gte: startOfMonth } },
      _sum: { savedAmount: true },
    }),
    prisma.userSavings.aggregate({
      where: { userId: session.userId, savedAt: { gte: startOfWeek } },
      _sum: { savedAmount: true },
    }),
  ])

  let totalSaved = allSavings._sum.savedAmount ?? 0
  let thisMonth = monthSavings._sum.savedAmount ?? 0
  let thisWeek = weekSavings._sum.savedAmount ?? 0
  let redemptionCount = allSavings._count

  // Fallback: if no UserSavings records, calculate from Redemption.discountAmount
  if (redemptionCount === 0) {
    const [allRedemptions, monthRedemptions, weekRedemptions] = await Promise.all([
      prisma.redemption.aggregate({
        where: { userId: session.userId, status: 'SUCCESS', discountAmount: { not: null } },
        _sum: { discountAmount: true },
        _count: true,
      }),
      prisma.redemption.aggregate({
        where: {
          userId: session.userId,
          status: 'SUCCESS',
          discountAmount: { not: null },
          redeemedAt: { gte: startOfMonth },
        },
        _sum: { discountAmount: true },
      }),
      prisma.redemption.aggregate({
        where: {
          userId: session.userId,
          status: 'SUCCESS',
          discountAmount: { not: null },
          redeemedAt: { gte: startOfWeek },
        },
        _sum: { discountAmount: true },
      }),
    ])

    totalSaved = Number(allRedemptions._sum.discountAmount ?? 0) * 100 // convert to kopecks
    thisMonth = Number(monthRedemptions._sum.discountAmount ?? 0) * 100
    thisWeek = Number(weekRedemptions._sum.discountAmount ?? 0) * 100
    redemptionCount = allRedemptions._count
  }

  return NextResponse.json({
    totalSaved: Math.round(totalSaved / 100), // return in rubles
    thisMonth: Math.round(thisMonth / 100),
    thisWeek: Math.round(thisWeek / 100),
    redemptionCount,
  })
}
