import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { cancelSubscription } from '@/modules/subscriptions/service'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const subscription = await cancelSubscription(session.userId)
    return NextResponse.json({ subscription })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
