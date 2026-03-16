import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { updateOfferSchema } from '@/modules/offers/validation'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const offer = await prisma.offer.findUnique({ where: { id }, include: { merchant: true } })
  if (!offer || offer.merchant.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (offer.approvalStatus !== 'DRAFT' && offer.approvalStatus !== 'REJECTED') {
    return NextResponse.json({ error: 'Can only edit DRAFT or REJECTED offers' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = updateOfferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { schedules, blackoutDates, rules, limits, ...simpleFields } = parsed.data
  const updated = await prisma.offer.update({
    where: { id },
    data: {
      ...simpleFields,
      offerType: simpleFields.offerType as any,
      benefitType: simpleFields.benefitType as any,
      visibility: simpleFields.visibility as any,
      startAt: simpleFields.startAt ? new Date(simpleFields.startAt) : undefined,
      endAt: simpleFields.endAt ? new Date(simpleFields.endAt) : undefined,
    },
  })

  return NextResponse.json({ offer: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const offer = await prisma.offer.findUnique({ where: { id }, include: { merchant: true } })
  if (!offer || offer.merchant.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.offer.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
