import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getUserSubscription } from '@/modules/subscriptions/service'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = await getUserSubscription(session.userId)
  return NextResponse.json(status)
}
