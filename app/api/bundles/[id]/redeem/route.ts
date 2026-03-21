import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { redeemBundle } from '@/modules/bundles/service'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const redemption = await redeemBundle(id, session.userId)
    return NextResponse.json({ redemption }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    const status = message.includes('not found') ? 404
      : message.includes('not active') || message.includes('expired') || message.includes('not yet') ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
