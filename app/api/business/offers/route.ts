import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createOffer } from '@/modules/offers/service'
import { createOfferSchema } from '@/modules/offers/validation'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  const offers = await prisma.offer.findMany({
    where: { merchantId: { in: merchantIds } },
    include: {
      branch: { select: { id: true, title: true, address: true } },
      limits: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ offers })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createOfferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  // Verify the merchant belongs to this user
  const business = await prisma.business.findFirst({
    where: { id: parsed.data.merchantId, ownerId: session.userId },
  })
  if (!business) {
    return NextResponse.json({ error: 'Business not found or not owned by you' }, { status: 403 })
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
