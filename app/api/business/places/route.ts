import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { canManagePlaces } from '@/lib/permissions'
import { getBusinessAccessSummary } from '@/lib/business-access'

export const dynamic = 'force-dynamic'

/**
 * GET /api/business/places
 *
 * Returns the current user's accessible businesses and active places.
 * Used by offer creation flows (flash, mystery-bag, wizard) and the places page.
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { merchantIds, access } = await getBusinessAccessSummary(session)
  if (!canManagePlaces(access)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businesses = await prisma.business.findMany({
    where: { id: { in: merchantIds } },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      places: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
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

  // Flat list for legacy flash/mystery-bag pages
  const places = businesses.flatMap((b) =>
    b.places.map((p) => ({
      ...p,
      businessId: b.id,
      businessName: b.name,
      businessType: b.type,
    })),
  )

  return NextResponse.json({ businesses, places })
}
