import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { FavoriteEntityType } from '@prisma/client'

/**
 * GET /api/favorites
 * List user's favorites with populated entity data.
 * Query params: entityType (PLACE | OFFER), limit, offset
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const entityType = req.nextUrl.searchParams.get('entityType') as FavoriteEntityType | null
  const idsOnly = req.nextUrl.searchParams.get('idsOnly') === '1'
  const maxLimit = idsOnly ? 500 : 100
  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '50') || 50, 1), maxLimit)
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0') || 0, 0)

  const where: Record<string, unknown> = { userId: session.userId }
  if (entityType && ['PLACE', 'OFFER'].includes(entityType)) {
    where.entityType = entityType
  }

  const favorites = await prisma.favorite.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })

  if (idsOnly) {
    return NextResponse.json({
      favoriteIds: favorites.map((favorite) => favorite.entityId),
    })
  }

  // Separate IDs by type for batch fetching
  const offerIds = favorites.filter(f => f.entityType === 'OFFER').map(f => f.entityId)
  const placeIds = favorites.filter(f => f.entityType === 'PLACE').map(f => f.entityId)

  const [offers, places] = await Promise.all([
    offerIds.length > 0
      ? prisma.offer.findMany({
          where: { id: { in: offerIds } },
          select: {
            id: true,
            title: true,
            subtitle: true,
            offerType: true,
            visibility: true,
            benefitType: true,
            benefitValue: true,
            imageUrl: true,
            lifecycleStatus: true,
            endAt: true,
            branch: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                placeType: true,
              },
            },
          },
        })
      : [],
    placeIds.length > 0
      ? prisma.place.findMany({
          where: { id: { in: placeIds } },
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            placeType: true,
            phone: true,
            addressLine1: true,
            business: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [],
  ])

  const offerMap = new Map(offers.map(o => [o.id, o]))
  const placeMap = new Map(places.map(p => [p.id, p]))

  const populated = favorites.map(fav => ({
    id: fav.id,
    entityType: fav.entityType,
    entityId: fav.entityId,
    createdAt: fav.createdAt,
    entity: fav.entityType === 'OFFER'
      ? offerMap.get(fav.entityId) || null
      : placeMap.get(fav.entityId) || null,
  }))

  return NextResponse.json({ favorites: populated })
}

/**
 * POST /api/favorites
 * Add a favorite. Body: { entityType, entityId }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { entityType?: string; entityId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { entityType, entityId } = body
  if (!entityType || !entityId || !['PLACE', 'OFFER'].includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType or entityId' }, { status: 400 })
  }

  // Validate that the entity exists
  if (entityType === 'OFFER') {
    const offer = await prisma.offer.findUnique({ where: { id: entityId }, select: { id: true } })
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
  } else {
    const place = await prisma.place.findUnique({ where: { id: entityId }, select: { id: true } })
    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_entityType_entityId: {
        userId: session.userId,
        entityType: entityType as FavoriteEntityType,
        entityId,
      },
    },
    update: {},
    create: {
      userId: session.userId,
      entityType: entityType as FavoriteEntityType,
      entityId,
    },
  })

  return NextResponse.json({ favorite }, { status: 201 })
}
