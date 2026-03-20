import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/redemptions/session-status?sessionId=...
 * Returns the current status of a redemption session and, if used, the coinTransaction for it.
 */
export async function GET(req: NextRequest) {
  const auth = await getSession()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }

  const redemptionSession = await prisma.redemptionSession.findFirst({
    where: { id: sessionId, userId: auth.userId },
    select: {
      id: true,
      status: true,
      redemption: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!redemptionSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  let earnedCoins = 0
  if (redemptionSession.status === 'USED' && redemptionSession.redemption) {
    const coinTx = await prisma.coinTransaction.findFirst({
      where: {
        userId: auth.userId,
        referenceId: redemptionSession.redemption.id,
        type: 'REDEMPTION_CASHBACK',
      },
      select: { amount: true },
    })
    earnedCoins = coinTx?.amount ?? 0
  }

  return NextResponse.json({
    status: redemptionSession.status,
    earnedCoins,
  })
}
