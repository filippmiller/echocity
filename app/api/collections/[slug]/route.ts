import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const collection = await prisma.collection.findUnique({
    where: { slug, isActive: true },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  // Batch-fetch entities by type to avoid N+1 queries
  const placeIds = collection.items
    .filter((i) => i.entityType === 'place')
    .map((i) => i.entityId)
  const offerIds = collection.items
    .filter((i) => i.entityType === 'offer')
    .map((i) => i.entityId)

  const [places, offers] = await Promise.all([
    placeIds.length > 0
      ? prisma.place.findMany({
          where: { id: { in: placeIds } },
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            placeType: true,
          },
        })
      : Promise.resolve([]),
    offerIds.length > 0
      ? prisma.offer.findMany({
          where: { id: { in: offerIds } },
          select: {
            id: true,
            title: true,
            subtitle: true,
            benefitType: true,
            benefitValue: true,
            offerType: true,
            visibility: true,
            imageUrl: true,
            endAt: true,
            branch: { select: { id: true, title: true, address: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const placeMap = new Map(places.map((p) => [p.id, p]))
  const offerMap = new Map(offers.map((o) => [o.id, o]))

  const populatedItems = collection.items.map((item) => {
    const entity =
      item.entityType === 'place'
        ? placeMap.get(item.entityId) || null
        : item.entityType === 'offer'
          ? offerMap.get(item.entityId) || null
          : null
    return { ...item, entity }
  })

  return NextResponse.json({
    collection: {
      ...collection,
      items: populatedItems,
    },
  })
}
