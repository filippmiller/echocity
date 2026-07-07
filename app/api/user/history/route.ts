import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

// GET /api/user/history - List user's redemptions with offer and branch details
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const [redemptions, total] = await Promise.all([
      prisma.redemption.findMany({
        where: { userId: session.userId },
        orderBy: { redeemedAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          status: true,
          orderAmount: true,
          discountAmount: true,
          currency: true,
          redeemedAt: true,
          offer: {
            select: {
              id: true,
              title: true,
              subtitle: true,
              benefitType: true,
              benefitValue: true,
              offerType: true,
              imageUrl: true,
            },
          },
          branch: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
            },
          },
        },
      }),
      prisma.redemption.count({
        where: { userId: session.userId },
      }),
    ])

    // Enrich with UserSavings savedAmount when available (kopecks → rubles).
    const savingsMap = new Map<string, number>()
    if (redemptions.length > 0) {
      const savings = await prisma.userSavings.findMany({
        where: { redemptionId: { in: redemptions.map((r) => r.id) } },
        select: { redemptionId: true, savedAmount: true },
      })
      savings.forEach((s) => {
        savingsMap.set(s.redemptionId, Math.floor(s.savedAmount / 100))
      })
    }

    return NextResponse.json({
      redemptions: redemptions.map((r) => ({
        ...r,
        savedAmount:
          savingsMap.get(r.id) ?? (r.discountAmount ? Number(r.discountAmount) : null),
      })),
      total,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    logger.error('user.history.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при загрузке истории' },
      { status: 500 }
    )
  }
}
