import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createAuditEntry, AuditAction } from '@/lib/audit'
import { calculateBusinessRiskScore } from '@/modules/moderation/risk-score'
import type { BusinessStatus } from '@prisma/client'

const updateBusinessSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING']),
  reason: z.string().min(1).max(2000).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: z.infer<typeof updateBusinessSchema>
  try {
    body = updateBusinessSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const existing = await prisma.business.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // For rejection, require a reason
  if (body.status === 'REJECTED' && (!body.reason || !body.reason.trim())) {
    return NextResponse.json({ error: 'Reason is required for rejection' }, { status: 400 })
  }

  const business = await prisma.business.update({
    where: { id },
    data: {
      status: body.status as BusinessStatus,
      ...(body.status === 'REJECTED' && body.reason
        ? { description: `[REJECTED] ${body.reason}\n\n${existing.description || ''}` }
        : {}),
    },
  })

  await createAuditEntry({
    actorId: session.userId,
    actorRole: session.role,
    action: AuditAction.UPDATE,
    entityType: 'Business',
    entityId: id,
    oldValue: {
      status: existing.status,
      description: existing.description,
    },
    newValue: {
      status: business.status,
      description: business.description,
      reason: body.reason ?? null,
    },
    req,
  })

  return NextResponse.json({ business })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      places: { select: { id: true, title: true, address: true, city: true, isActive: true } },
      offers: {
        select: {
          id: true,
          title: true,
          offerType: true,
          approvalStatus: true,
          lifecycleStatus: true,
        },
        take: 20,
      },
      _count: { select: { places: true, offers: true, staff: true, redemptions: true } },
    },
  })

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const offerIds = business.offers.map((o) => o.id)
  const placeIds = business.places.map((p) => p.id)

  const [businessFraudFlags, complaints] = await Promise.all([
    prisma.fraudFlag.findMany({
      where: { entityType: 'BUSINESS', entityId: id, status: 'OPEN' },
      select: { status: true },
    }),
    prisma.complaint.findMany({
      where: {
        status: { in: ['OPEN', 'IN_REVIEW'] },
        OR: [
          ...(offerIds.length > 0 ? [{ offerId: { in: offerIds } }] : []),
          ...(placeIds.length > 0 ? [{ placeId: { in: placeIds } }] : []),
        ],
      },
      select: { status: true },
    }),
  ])

  const risk = calculateBusinessRiskScore(
    {
      status: business.status,
      createdAt: business.createdAt,
      isVerified: business.isVerified,
      supportEmail: business.supportEmail,
      supportPhone: business.supportPhone,
      placesCount: business._count.places,
    },
    complaints,
    businessFraudFlags,
  )

  return NextResponse.json({
    business: {
      ...business,
      riskScore: risk.score,
      riskReasons: risk.reasons,
    },
  })
}
