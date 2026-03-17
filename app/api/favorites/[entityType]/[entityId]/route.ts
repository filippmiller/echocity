import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { FavoriteEntityType } from '@prisma/client'

/**
 * DELETE /api/favorites/:entityType/:entityId
 * Remove a favorite. Verifies ownership via session.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { entityType, entityId } = await params

  if (!['PLACE', 'OFFER'].includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 })
  }

  // Delete only if it belongs to this user (ownership check via composite unique)
  try {
    await prisma.favorite.delete({
      where: {
        userId_entityType_entityId: {
          userId: session.userId,
          entityType: entityType as FavoriteEntityType,
          entityId,
        },
      },
    })
  } catch {
    // Record not found is fine -- idempotent delete
  }

  return new NextResponse(null, { status: 204 })
}
