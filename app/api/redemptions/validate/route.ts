import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { validateAndRedeem } from '@/modules/redemptions/service'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'BUSINESS_OWNER' && session.role !== 'MERCHANT_STAFF')) {
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
