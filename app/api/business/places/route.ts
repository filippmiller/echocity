import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/business/places
 *
 * Returns the current business owner's businesses and active places.
 * Used by offer creation flows (flash, mystery-bag, wizard) and the places page.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
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
