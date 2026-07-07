import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createOffer } from '@/modules/offers/service'
import { createOfferSchema } from '@/modules/offers/validation'
import { getBusinessAccess } from '@/lib/business-access'
import { canManageOffers } from '@/lib/permissions'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessible = await prisma.business.findMany({
    where: {
      OR: [
        { ownerId: session.userId },
        { staff: { some: { userId: session.userId, isActive: true } } },
      ],
    },
    select: { id: true },
  })
  const merchantIds = accessible.map((b) => b.id)

  const offers = await prisma.offer.findMany({
    where: { merchantId: { in: merchantIds } },
    include: {
      branch: { select: { id: true, title: true, address: true } },
      limits: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ offers })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createOfferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  // Verify the user can manage offers for this merchant
  const { access } = await getBusinessAccess(session, parsed.data.merchantId, parsed.data.branchId)
  if (!canManageOffers(access)) {
    return NextResponse.json({ error: 'Business not found or access denied' }, { status: 403 })
  }

  const branch = await prisma.place.findFirst({
    where: {
      id: parsed.data.branchId,
      businessId: parsed.data.merchantId,
      isActive: true,
    },
    select: { id: true },
  })

  if (!branch) {
    return NextResponse.json({ error: 'Branch not found or does not belong to this business' }, { status: 403 })
  }

  const offer = await createOffer(parsed.data, session.userId)
  return NextResponse.json({ offer }, { status: 201 })
}
