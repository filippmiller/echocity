import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { getReservationsByPlace } from '@/modules/reservations/service'
import type { ReservationStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const date = searchParams.get('date') || undefined
  const placeId = searchParams.get('placeId') || undefined
  const status = (searchParams.get('status') as ReservationStatus) || undefined

  // Get all places owned by this merchant
  const places = await prisma.place.findMany({
    where: {
      OR: [
        { businessAccount: { ownerUserId: session.userId } },
        { business: { ownerId: session.userId } },
      ],
    },
    select: { id: true, title: true },
  })

  const placeIds = places.map((p) => p.id)

  if (placeIds.length === 0) {
    return NextResponse.json({ reservations: [], places: [] })
  }

  // If a specific placeId is requested, verify merchant owns it
  const targetPlaceId = placeId && placeIds.includes(placeId) ? placeId : undefined

  let reservations
  if (targetPlaceId) {
    reservations = await getReservationsByPlace(targetPlaceId, date, status)
  } else {
    // Get reservations for all merchant's places
    const allReservations = await Promise.all(
      placeIds.map((pid) => getReservationsByPlace(pid, date, status)),
    )
    reservations = allReservations.flat()
    reservations.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime()
      if (dateCompare !== 0) return dateCompare
      return a.timeSlot.localeCompare(b.timeSlot)
    })
  }

  return NextResponse.json({
    reservations: reservations.map((r) => ({
      ...r,
      date: r.date.toISOString(),
      confirmedAt: r.confirmedAt?.toISOString() || null,
      canceledAt: r.canceledAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    places,
  })
}
