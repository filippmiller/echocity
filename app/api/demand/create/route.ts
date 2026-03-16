import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { createDemandRequest } from '@/modules/demand/service'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.cityId) return NextResponse.json({ error: 'cityId required' }, { status: 400 })

  const result = await createDemandRequest(session.userId, body)
  return NextResponse.json({ result }, { status: 201 })
}
