import { prisma } from '@/lib/prisma'
import type { BundleStatus, OfferVisibility } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────

export interface CreateBundleInput {
  title: string
  subtitle?: string
  description?: string
  imageUrl?: string
  totalPrice?: number
  discountPercent?: number
  visibility?: OfferVisibility
  cityId?: string
  validFrom: string | Date
  validUntil?: string | Date | null
  items: {
    placeId: string
    merchantId: string
    offerId?: string
    itemTitle: string
    itemValue?: number
  }[]
}

// ─── Create bundle ───────────────────────────────────────

export async function createBundle(createdByUserId: string, input: CreateBundleInput) {
  const status: BundleStatus = input.items.length > 0 ? 'PENDING_PARTNERS' : 'DRAFT'

  const bundle = await prisma.bundle.create({
    data: {
      title: input.title,
      subtitle: input.subtitle ?? null,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      totalPrice: input.totalPrice ?? null,
      discountPercent: input.discountPercent ?? null,
      visibility: input.visibility ?? 'PUBLIC',
      status,
      cityId: input.cityId ?? null,
      createdByUserId,
      validFrom: new Date(input.validFrom),
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      items: {
        create: input.items.map((item, idx) => ({
          placeId: item.placeId,
          merchantId: item.merchantId,
          offerId: item.offerId ?? null,
          itemTitle: item.itemTitle,
          itemValue: item.itemValue ?? null,
          sortOrder: idx,
          accepted: false,
        })),
      },
    },
    include: {
      items: {
        include: {
          place: { select: { id: true, title: true, address: true, city: true } },
          merchant: { select: { id: true, name: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return bundle
}

// ─── Accept bundle item (merchant) ──────────────────────

export async function acceptBundleItem(bundleItemId: string, merchantUserId: string) {
  // Verify ownership
  const item = await prisma.bundleItem.findUnique({
    where: { id: bundleItemId },
    include: {
      merchant: { select: { ownerId: true } },
      bundle: { select: { id: true, status: true } },
    },
  })

  if (!item) throw new Error('Bundle item not found')
  if (item.merchant.ownerId !== merchantUserId) throw new Error('Not your business')
  if (item.accepted) return item

  await prisma.bundleItem.update({
    where: { id: bundleItemId },
    data: { accepted: true },
  })

  // Check if all items are accepted → auto-activate
  const allItems = await prisma.bundleItem.findMany({
    where: { bundleId: item.bundle.id },
  })
  const allAccepted = allItems.every((i) => i.id === bundleItemId || i.accepted)

  if (allAccepted && item.bundle.status === 'PENDING_PARTNERS') {
    await prisma.bundle.update({
      where: { id: item.bundle.id },
      data: { status: 'ACTIVE' },
    })
  }

  return item
}

// ─── Activate bundle (admin force-activate) ─────────────

export async function activateBundle(bundleId: string) {
  return prisma.bundle.update({
    where: { id: bundleId },
    data: { status: 'ACTIVE' },
  })
}

// ─── Pause bundle ───────────────────────────────────────

export async function pauseBundle(bundleId: string) {
  return prisma.bundle.update({
    where: { id: bundleId },
    data: { status: 'PAUSED' },
  })
}

// ─── Expire overdue bundles ─────────────────────────────

export async function expireBundles() {
  const now = new Date()
  return prisma.bundle.updateMany({
    where: {
      status: 'ACTIVE',
      validUntil: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })
}

// ─── Get active bundles (public) ────────────────────────

export async function getActiveBundles(cityId?: string, limit = 20) {
  const now = new Date()

  return prisma.bundle.findMany({
    where: {
      status: 'ACTIVE',
      validFrom: { lte: now },
      OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      ...(cityId ? { cityId } : {}),
    },
    include: {
      items: {
        include: {
          place: { select: { id: true, title: true, address: true, city: true } },
          merchant: { select: { id: true, name: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { redemptions: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// ─── Get bundle detail ──────────────────────────────────

export async function getBundleDetail(bundleId: string) {
  return prisma.bundle.findUnique({
    where: { id: bundleId },
    include: {
      items: {
        include: {
          place: { select: { id: true, title: true, address: true, city: true, lat: true, lng: true } },
          merchant: { select: { id: true, name: true } },
          offer: { select: { id: true, title: true, benefitType: true, benefitValue: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
      city: { select: { id: true, name: true } },
      _count: { select: { redemptions: true } },
    },
  })
}

// ─── Redeem bundle ──────────────────────────────────────

export async function redeemBundle(bundleId: string, userId: string) {
  // Verify bundle is active
  const bundle = await prisma.bundle.findUnique({
    where: { id: bundleId },
    select: { id: true, status: true, validFrom: true, validUntil: true },
  })
  if (!bundle) throw new Error('Bundle not found')
  if (bundle.status !== 'ACTIVE') throw new Error('Bundle is not active')

  const now = new Date()
  if (now < new Date(bundle.validFrom)) throw new Error('Bundle not yet valid')
  if (bundle.validUntil && now > new Date(bundle.validUntil)) throw new Error('Bundle has expired')

  const redemption = await prisma.bundleRedemption.create({
    data: { bundleId, userId },
  })

  return redemption
}

// ─── Get bundles by merchant ────────────────────────────

export async function getBundlesByMerchant(merchantUserId: string) {
  const businesses = await prisma.business.findMany({
    where: { ownerId: merchantUserId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  return prisma.bundle.findMany({
    where: {
      items: { some: { merchantId: { in: merchantIds } } },
    },
    include: {
      items: {
        include: {
          place: { select: { id: true, title: true, address: true } },
          merchant: { select: { id: true, name: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { redemptions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Get all bundles (admin) ────────────────────────────

export async function getAllBundles(statusFilter?: BundleStatus) {
  return prisma.bundle.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      items: {
        include: {
          place: { select: { id: true, title: true } },
          merchant: { select: { id: true, name: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
      createdBy: { select: { id: true, firstName: true, email: true } },
      _count: { select: { redemptions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
