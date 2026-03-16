import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { createRedemptionSession } from '@/modules/redemptions/service'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { offerId, lat, lng } = await req.json()
  if (!offerId) return NextResponse.json({ error: 'offerId required' }, { status: 400 })

  const result = await createRedemptionSession(session.userId, offerId, lat, lng)

  if (!result.success) {
    return NextResponse.json({ error: result.error, message: result.message }, { status: 400 })
  }

  return NextResponse.json(result, { status: 201 })
}
