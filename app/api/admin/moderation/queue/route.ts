import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { calculateRiskScore } from '@/modules/moderation/risk-score'
import type { RiskScoreResult } from '@/modules/moderation/risk-score'

const PER_TYPE_LIMIT = 100
const OVERALL_LIMIT = 200

type QueueItemType = 'offer' | 'business' | 'complaint'

interface QueueItem {
  id: string
  type: QueueItemType
  title: string
  createdAt: string
  riskScore?: number
  reasons?: string[]
  meta: Record<string, unknown>
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const filterType = req.nextUrl.searchParams.get('type') as QueueItemType | null

  const [pendingOffers, pendingBusinesses, openComplaints] = await Promise.all([
    filterType && filterType !== 'offer'
      ? Promise.resolve([])
      : prisma.offer.findMany({
          where: { approvalStatus: 'PENDING' },
          include: {
            merchant: { select: { id: true, name: true, status: true, createdAt: true } },
            branch: { select: { id: true, title: true, city: true } },
            createdBy: { select: { id: true, firstName: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: PER_TYPE_LIMIT,
        }),
    filterType && filterType !== 'business'
      ? Promise.resolve([])
      : prisma.business.findMany({
          where: { status: 'PENDING' },
          include: {
            owner: { select: { id: true, firstName: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: PER_TYPE_LIMIT,
        }),
    filterType && filterType !== 'complaint'
      ? Promise.resolve([])
      : prisma.complaint.findMany({
          where: { status: { in: ['OPEN', 'IN_REVIEW'] } },
          include: {
            user: { select: { id: true, firstName: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: PER_TYPE_LIMIT,
        }),
  ])

  // Batch fetch risk-relevant data for pending offers
  const offerIds = pendingOffers.map((o) => o.id)
  const [offerComplaints, offerFraudFlags] =
    offerIds.length > 0
      ? await Promise.all([
          prisma.complaint.findMany({
            where: { offerId: { in: offerIds }, status: { in: ['OPEN', 'IN_REVIEW'] } },
            select: { offerId: true, status: true },
          }),
          prisma.fraudFlag.findMany({
            where: { entityType: 'OFFER', entityId: { in: offerIds }, status: 'OPEN' },
            select: { entityId: true, status: true },
          }),
        ])
      : [[] as Array<{ offerId: string | null; status: string }>, [] as Array<{ entityId: string; status: string }>]

  const complaintsByOffer = new Map<string, Array<{ status: string }>>()
  for (const c of offerComplaints) {
    if (!c.offerId) continue
    const list = complaintsByOffer.get(c.offerId) ?? []
    list.push({ status: c.status })
    complaintsByOffer.set(c.offerId, list)
  }

  const flagsByOffer = new Map<string, Array<{ status: string }>>()
  for (const f of offerFraudFlags) {
    const list = flagsByOffer.get(f.entityId) ?? []
    list.push({ status: f.status })
    flagsByOffer.set(f.entityId, list)
  }

  const items: QueueItem[] = []

  for (const offer of pendingOffers) {
    const complaints = complaintsByOffer.get(offer.id) ?? []
    const fraudFlags = flagsByOffer.get(offer.id) ?? []

    const risk: RiskScoreResult = calculateRiskScore(
      {
        description: offer.description,
        imageUrl: offer.imageUrl,
        benefitType: offer.benefitType,
        benefitValue: offer.benefitValue,
        startAt: offer.startAt,
        endAt: offer.endAt,
      },
      { status: offer.merchant.status, createdAt: offer.merchant.createdAt },
      complaints,
      fraudFlags,
    )

    items.push({
      id: offer.id,
      type: 'offer',
      title: offer.title,
      createdAt: offer.createdAt.toISOString(),
      riskScore: risk.score,
      reasons: risk.reasons,
      meta: {
        merchantId: offer.merchant.id,
        merchantName: offer.merchant.name,
        branchTitle: offer.branch.title,
        city: offer.branch.city,
        createdByName: offer.createdBy.firstName,
        createdByEmail: offer.createdBy.email,
        offerType: offer.offerType,
        benefitType: offer.benefitType,
        benefitValue: Number(offer.benefitValue),
      },
    })
  }

  for (const business of pendingBusinesses) {
    items.push({
      id: business.id,
      type: 'business',
      title: business.name,
      createdAt: business.createdAt.toISOString(),
      meta: {
        ownerName: business.owner.firstName,
        ownerEmail: business.owner.email,
      },
    })
  }

  for (const complaint of openComplaints) {
    items.push({
      id: complaint.id,
      type: 'complaint',
      title: `${complaint.type}: ${complaint.description.slice(0, 80)}${complaint.description.length > 80 ? '…' : ''}`,
      createdAt: complaint.createdAt.toISOString(),
      meta: {
        complaintType: complaint.type,
        priority: complaint.priority,
        status: complaint.status,
        userEmail: complaint.user.email,
      },
    })
  }

  items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const limited = items.slice(0, OVERALL_LIMIT)

  return NextResponse.json({ items: limited })
}
