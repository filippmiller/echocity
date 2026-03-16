import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { approveOffer } from '@/modules/offers/service'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const offer = await approveOffer(id)
    return NextResponse.json({ offer })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
