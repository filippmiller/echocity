import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { FavoriteEntityType } from '@prisma/client'

/**
 * GET /api/favorites/check?entityType=OFFER&entityId=xxx
 * Check if an entity is favorited by the current user.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ isFavorited: false })
  }

  const entityType = req.nextUrl.searchParams.get('entityType') as FavoriteEntityType | null
  const entityId = req.nextUrl.searchParams.get('entityId')

  if (!entityType || !entityId || !['PLACE', 'OFFER'].includes(entityType)) {
    return NextResponse.json({ isFavorited: false })
  }

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_entityType_entityId: {
        userId: session.userId,
        entityType,
        entityId,
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ isFavorited: !!favorite })
}
