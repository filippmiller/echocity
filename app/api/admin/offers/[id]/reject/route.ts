import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { rejectOffer } from '@/modules/offers/service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { reason } = await req.json()
  if (!reason) return NextResponse.json({ error: 'reason required' }, { status: 400 })

  try {
    const offer = await rejectOffer(id, reason)
    return NextResponse.json({ offer })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
