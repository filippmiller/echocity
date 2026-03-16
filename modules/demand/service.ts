import { prisma } from '@/lib/prisma'

export async function createDemandRequest(userId: string, input: { placeId?: string; placeName?: string; categoryId?: string; cityId: string; lat?: number; lng?: number }) {
  // Check if there's already an active request for this place — auto-support instead of duplicate
  if (input.placeId) {
    const existing = await prisma.demandRequest.findFirst({
      where: { placeId: input.placeId, status: { in: ['OPEN', 'COLLECTING'] } },
    })
    if (existing) {
      return supportDemandRequest(existing.id, userId)
    }
  }

  return prisma.demandRequest.create({
    data: {
      userId,
      placeId: input.placeId ?? null,
      placeName: input.placeName ?? null,
      categoryId: input.categoryId ?? null,
      cityId: input.cityId,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      status: 'OPEN',
      supportCount: 1,
    },
  })
}

export async function supportDemandRequest(demandRequestId: string, userId: string) {
  // Check already supported
  const existing = await prisma.demandSupport.findUnique({
    where: { demandRequestId_userId: { demandRequestId, userId } },
  })
  if (existing) return { alreadySupported: true }

  await prisma.$transaction([
    prisma.demandSupport.create({ data: { demandRequestId, userId } }),
    prisma.demandRequest.update({
      where: { id: demandRequestId },
      data: { supportCount: { increment: 1 } },
    }),
  ])

  return { alreadySupported: false }
}

export async function getDemandForPlace(placeId: string) {
  return prisma.demandRequest.findMany({
    where: { placeId, status: { in: ['OPEN', 'COLLECTING'] } },
    orderBy: { supportCount: 'desc' },
    take: 10,
    include: { _count: { select: { supports: true } } },
  })
}

export async function getDemandByCity(cityId: string, limit = 20) {
  return prisma.demandRequest.findMany({
    where: { cityId, status: { in: ['OPEN', 'COLLECTING'] } },
    orderBy: { supportCount: 'desc' },
    take: limit,
    include: {
      place: { select: { id: true, title: true, address: true } },
      _count: { select: { supports: true } },
    },
  })
}
