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

  // Populate items with actual entity data
  const populatedItems = await Promise.all(
    collection.items.map(async (item) => {
      if (item.entityType === 'place') {
        const place = await prisma.place.findUnique({
          where: { id: item.entityId },
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            placeType: true,
          },
        })
        return { ...item, entity: place }
      }

      if (item.entityType === 'offer') {
        const offer = await prisma.offer.findUnique({
          where: { id: item.entityId },
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
        return { ...item, entity: offer }
      }

      return { ...item, entity: null }
    })
  )

  return NextResponse.json({
    collection: {
      ...collection,
      items: populatedItems,
    },
  })
}
