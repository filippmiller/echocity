import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface CreateMysteryBagInput {
  merchantId: string
  branchId: string
  title: string
  salePrice: number
  originalValue: number
  contentsHint: string
  pickupWindowStart: string // "19:00"
  pickupWindowEnd: string   // "21:00"
  quantity: number
}

export async function createMysteryBag(userId: string, input: CreateMysteryBagInput) {
  const now = new Date()
  // Set endAt to today's pickup window end (Moscow timezone)
  const [endH, endM] = input.pickupWindowEnd.split(':').map(Number)
  const endAt = new Date(now)
  endAt.setHours(endH, endM, 0, 0)
  // If the pickup window end has passed, set for tomorrow
  if (endAt <= now) {
    endAt.setDate(endAt.getDate() + 1)
  }

  const offer = await prisma.offer.create({
    data: {
      merchantId: input.merchantId,
      branchId: input.branchId,
      title: input.title,
      offerType: 'MYSTERY_BAG',
      visibility: 'PUBLIC',
      benefitType: 'FIXED_PRICE',
      benefitValue: input.salePrice,
      currency: 'RUB',
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt,
      redemptionChannel: 'IN_STORE',
      createdByUserId: userId,
      metadata: {
        originalValue: input.originalValue,
        contentsHint: input.contentsHint,
        pickupWindowStart: input.pickupWindowStart,
        pickupWindowEnd: input.pickupWindowEnd,
      },
      limits: {
        create: { totalLimit: input.quantity },
      },
    },
  })

  logger.info('mysteryBag.created', { offerId: offer.id, quantity: input.quantity })
  return offer
}

export async function getAvailableMysteryBags(city?: string) {
  const now = new Date()

  const bags = await prisma.offer.findMany({
    where: {
      offerType: 'MYSTERY_BAG',
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      endAt: { gt: now },
    },
    include: {
      branch: {
        select: { id: true, title: true, city: true, address: true, lat: true, lng: true },
      },
      merchant: { select: { name: true } },
      limits: { select: { totalLimit: true } },
      _count: { select: { redemptions: true } },
    },
    orderBy: { endAt: 'asc' },
  })

  return bags
    .filter((b) => !city || b.branch.city === city)
    .map((bag) => {
      const metadata = bag.metadata as any
      const totalLimit = bag.limits?.totalLimit ?? 0
      const redeemed = bag._count.redemptions
      return {
        id: bag.id,
        title: bag.title,
        salePrice: Number(bag.benefitValue),
        originalValue: metadata?.originalValue ?? 0,
        contentsHint: metadata?.contentsHint ?? '',
        pickupWindowStart: metadata?.pickupWindowStart ?? '',
        pickupWindowEnd: metadata?.pickupWindowEnd ?? '',
        remaining: Math.max(0, totalLimit - redeemed),
        totalQuantity: totalLimit,
        endAt: bag.endAt,
        branch: bag.branch,
        merchantName: bag.merchant.name,
      }
    })
    .filter((b) => b.remaining > 0)
}
