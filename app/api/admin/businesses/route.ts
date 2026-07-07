import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { calculateBusinessRiskScore } from '@/modules/moderation/risk-score'
import type { BusinessStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') as BusinessStatus | null

  const businesses = await prisma.business.findMany({
    where: status ? { status } : {},
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      _count: { select: { places: true, offers: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const businessIds = businesses.map((b) => b.id)

  const [businessFraudFlags, businessOffers, offerComplaints] =
    businessIds.length > 0
      ? await Promise.all([
          prisma.fraudFlag.findMany({
            where: { entityType: 'BUSINESS', entityId: { in: businessIds }, status: 'OPEN' },
            select: { entityId: true, status: true },
          }),
          prisma.offer.findMany({
            where: { merchantId: { in: businessIds } },
            select: { id: true, merchantId: true },
          }),
          prisma.complaint.findMany({
            where: { status: { in: ['OPEN', 'IN_REVIEW'] }, offerId: { not: null } },
            select: { offerId: true, status: true },
          }),
        ])
      : [[], [], []]

  const fraudFlagsByBusiness = new Map<string, Array<{ status: string }>>()
  for (const f of businessFraudFlags) {
    const list = fraudFlagsByBusiness.get(f.entityId) ?? []
    list.push({ status: f.status })
    fraudFlagsByBusiness.set(f.entityId, list)
  }

  const offerIdsByBusiness = new Map<string, string[]>()
  for (const o of businessOffers) {
    const list = offerIdsByBusiness.get(o.merchantId) ?? []
    list.push(o.id)
    offerIdsByBusiness.set(o.merchantId, list)
  }

  const complaintsByOffer = new Map<string, Array<{ status: string }>>()
  for (const c of offerComplaints) {
    if (!c.offerId) continue
    const list = complaintsByOffer.get(c.offerId) ?? []
    list.push({ status: c.status })
    complaintsByOffer.set(c.offerId, list)
  }

  const businessesWithRisk = businesses.map((business) => {
    const fraudFlags = fraudFlagsByBusiness.get(business.id) ?? []
    const offerIds = offerIdsByBusiness.get(business.id) ?? []
    const complaints = offerIds.flatMap((id) => complaintsByOffer.get(id) ?? [])

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
      fraudFlags,
    )

    return {
      ...business,
      riskScore: risk.score,
      riskReasons: risk.reasons,
    }
  })

  return NextResponse.json({ businesses: businessesWithRisk })
}
