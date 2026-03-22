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
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          logoUrl: true,
        },
      },
      offer: {
        select: {
          id: true,
          title: true,
          benefitType: true,
          benefitValue: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    demand: {
      id: demand.id,
      placeName: demand.place?.title ?? demand.placeName ?? 'Любое заведение',
      placeAddress: demand.place?.address ?? null,
      cityName: demand.city.name,
      supportCount: demand.supportCount,
      status: demand.status,
    },
    bids: responses.map((r) => ({
      id: r.id,
      merchantId: r.merchantId,
      merchantName: r.merchant.name,
      merchantLogo: r.merchant.logoUrl,
      isVerified: r.merchant.isVerified,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
      offer: r.offer
        ? {
            id: r.offer.id,
            title: r.offer.title,
            benefitType: r.offer.benefitType,
            benefitValue: Number(r.offer.benefitValue),
            imageUrl: r.offer.imageUrl,
          }
        : null,
    })),
  })
}
