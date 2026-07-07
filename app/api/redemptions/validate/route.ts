import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { validateAndRedeem } from '@/modules/redemptions/service'
import { getBusinessAccess } from '@/lib/business-access'
import { canScanRedemptions } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized — must be merchant staff' }, { status: 401 })
  }

  let body: { sessionToken?: string; shortCode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { sessionToken, shortCode } = body
  if (!sessionToken && !shortCode) {
    return NextResponse.json({ error: 'sessionToken or shortCode required' }, { status: 400 })
  }

  // Resolve the session to a merchant and validate active access
  const redemptionSession = await prisma.redemptionSession.findFirst({
    where: sessionToken ? { sessionToken, status: 'ACTIVE' } : { shortCode, status: 'ACTIVE' },
    include: { offer: { include: { merchant: true } } },
  })

  if (!redemptionSession) {
    return NextResponse.json({ error: 'SESSION_NOT_FOUND', message: 'Сессия не найдена или истекла' }, { status: 400 })
  }

  const { access } = await getBusinessAccess(
    session,
    redemptionSession.offer.merchantId,
    redemptionSession.offer.branchId,
  )
  if (!canScanRedemptions(access)) {
    return NextResponse.json({ error: 'Unauthorized — must be merchant staff' }, { status: 401 })
  }

  const result = await validateAndRedeem({
    sessionToken,
    shortCode,
    scannedByUserId: session.userId,
    scannedByRole: session.role,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error, message: result.message }, { status: 400 })
  }

  return NextResponse.json(result)
}
