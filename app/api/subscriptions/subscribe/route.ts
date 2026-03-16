import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { createSubscription } from '@/modules/subscriptions/service'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planCode } = await req.json()
  if (!planCode) return NextResponse.json({ error: 'planCode required' }, { status: 400 })

  try {
    // Phase 1: stub — creates subscription directly (real payment in ЮKassa integration)
    const subscription = await createSubscription(session.userId, planCode)
    return NextResponse.json({ subscription }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
