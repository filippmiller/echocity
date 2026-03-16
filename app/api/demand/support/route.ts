import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { supportDemandRequest } from '@/modules/demand/service'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { demandRequestId } = await req.json()
  if (!demandRequestId) return NextResponse.json({ error: 'demandRequestId required' }, { status: 400 })

  const result = await supportDemandRequest(demandRequestId, session.userId)
  return NextResponse.json(result)
}
