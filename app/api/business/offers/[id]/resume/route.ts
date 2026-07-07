import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { resumeOffer } from '@/modules/offers/service'
import { getBusinessAccess } from '@/lib/business-access'
import { canManageOffers } from '@/lib/permissions'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const offer = await prisma.offer.findUnique({ where: { id }, include: { merchant: true } })
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  const { access } = await getBusinessAccess(session, offer.merchantId, offer.branchId)
  if (!canManageOffers(access)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updated = await resumeOffer(id, session.userId)
    return NextResponse.json({ offer: updated })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
