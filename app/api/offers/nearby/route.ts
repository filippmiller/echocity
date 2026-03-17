import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { validateGeoProximity } from '@/modules/redemptions/geo'

/**
 * GET /api/offers/nearby
 * Returns active, approved offers sorted by distance from the user's location.
 *
 * Query params:
 *   lat     - user latitude (required)
 *   lng     - user longitude (required)
 *   radius  - search radius in meters (default 2000)
 *   limit   - max results (default 20, max 100)
 */
export async function GET(req: NextRequest) {
  const latStr = req.nextUrl.searchParams.get('lat')
  const lngStr = req.nextUrl.searchParams.get('lng')
  const radiusStr = req.nextUrl.searchParams.get('radius')
  const limitStr = req.nextUrl.searchParams.get('limit')

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: 'Invalid lat/lng: lat must be -90..90, lng must be -180..180' },
      { status: 400 },
    )
  }

  const radius = Math.min(Math.max(parseInt(radiusStr || '2000') || 2000, 100), 50000)
  const limit = Math.min(Math.max(parseInt(limitStr || '20') || 20, 1), 100)

  // Fetch all active approved offers where the branch has coordinates
  const offers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      branch: {
        isActive: true,
        lat: { not: null },
        lng: { not: null },
      },
    },
    include: {
      branch: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          lat: true,
          lng: true,
          placeType: true,
        },
      },
      merchant: { select: { id: true, name: true } },
      limits: true,
    },
  })

  // Calculate distance and filter by radius using Haversine
  const offersWithDistance = offers
    .map((offer) => {
      const branchLat = offer.branch.lat as number
      const branchLng = offer.branch.lng as number
      const { valid, distanceMeters } = validateGeoProximity(lat, lng, branchLat, branchLng, radius)
      return { offer, distanceMeters, withinRadius: valid }
    })
    .filter((item) => item.withinRadius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit)

  // Optionally check favorites if user is authenticated
  let favoriteOfferIds = new Set<string>()
  const session = await getSession().catch(() => null)
  if (session) {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.userId,
        entityType: 'OFFER',
        entityId: { in: offersWithDistance.map((o) => o.offer.id) },
      },
      select: { entityId: true },
    })
    favoriteOfferIds = new Set(favorites.map((f) => f.entityId))
  }

  const result = offersWithDistance.map(({ offer, distanceMeters }) => ({
    id: offer.id,
    title: offer.title,
    subtitle: offer.subtitle,
    benefitType: offer.benefitType,
    benefitValue: Number(offer.benefitValue),
    offerType: offer.offerType,
    visibility: offer.visibility,
    imageUrl: offer.imageUrl,
    distance: distanceMeters,
    isFavorite: favoriteOfferIds.has(offer.id),
    branch: {
      id: offer.branch.id,
      title: offer.branch.title,
      address: offer.branch.address,
      city: offer.branch.city,
      lat: offer.branch.lat,
      lng: offer.branch.lng,
      placeType: offer.branch.placeType,
    },
    merchant: offer.merchant
      ? { id: offer.merchant.id, name: offer.merchant.name }
      : null,
    maxRedemptions: offer.limits?.totalLimit ?? null,
    expiresAt: offer.endAt?.toISOString() ?? null,
  }))

  return NextResponse.json({ offers: result, count: result.length })
}
