import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/demand/[id]/bids — get all merchant responses (bids) for a demand
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: demandId } = await params

  const demand = await prisma.demandRequest.findUnique({
    where: { id: demandId },
    include: {
      place: { select: { title: true, address: true } },
      city: { select: { name: true } },
    },
  })

  if (!demand) {
    return NextResponse.json({ error: 'Запрос не найден' }, { status: 404 })
  }

  const responses = await prisma.demandResponse.findMany({
    where: { demandRequestId: demandId },
    orderBy: { createdAt: 'asc' },
  })

  // Fetch merchant and offer details separately for type safety
  const merchantIds = [...new Set(responses.map((r) => r.merchantId))]
  const offerIds = responses.map((r) => r.offerId).filter((id): id is string => id !== null)

  const [merchants, offers] = await Promise.all([
    prisma.business.findMany({
      where: { id: { in: merchantIds } },
      select: { id: true, name: true, isVerified: true },
    }),
    offerIds.length > 0
      ? prisma.offer.findMany({
          where: { id: { in: offerIds } },
          select: { id: true, title: true, benefitType: true, benefitValue: true, imageUrl: true },
        })
      : Promise.resolve([]),
  ])

  const merchantMap = new Map(merchants.map((m) => [m.id, m]))
  const offerMap = new Map(offers.map((o) => [o.id, o]))

  return NextResponse.json({
    demand: {
      id: demand.id,
      placeName: demand.place?.title ?? demand.placeName ?? 'Любое заведение',
      placeAddress: demand.place?.address ?? null,
      cityName: demand.city.name,
      supportCount: demand.supportCount,
      status: demand.status,
    },
    bids: responses.map((r) => {
      const merchant = merchantMap.get(r.merchantId)
      const offer = r.offerId ? offerMap.get(r.offerId) : null
      return {
        id: r.id,
        merchantId: r.merchantId,
        merchantName: merchant?.name ?? 'Заведение',
        isVerified: merchant?.isVerified ?? false,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
        offer: offer
          ? {
              id: offer.id,
              title: offer.title,
              benefitType: offer.benefitType,
              benefitValue: Number(offer.benefitValue),
              imageUrl: offer.imageUrl,
            }
          : null,
      }
    }),
  })
}
