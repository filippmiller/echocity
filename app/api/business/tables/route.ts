import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const placeId = req.nextUrl.searchParams.get('placeId') || undefined

  // Get merchant's places
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
    return NextResponse.json({ tables: [], places: [] })
  }

  const whereClause = placeId && placeIds.includes(placeId)
    ? { placeId }
    : { placeId: { in: placeIds } }

  const tables = await prisma.tableConfig.findMany({
    where: whereClause,
    include: {
      place: { select: { id: true, title: true } },
      _count: {
        select: {
          reservations: {
            where: {
              status: { in: ['PENDING', 'CONFIRMED'] },
              date: {
                gte: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z'),
                lte: new Date(new Date().toISOString().split('T')[0] + 'T23:59:59Z'),
              },
            },
          },
        },
      },
    },
    orderBy: [{ placeId: 'asc' }, { tableNumber: 'asc' }],
  })

  return NextResponse.json({
    tables: tables.map((t) => ({
      id: t.id,
      placeId: t.placeId,
      placeName: t.place.title,
      tableNumber: t.tableNumber,
      seats: t.seats,
      zone: t.zone,
      isActive: t.isActive,
      todayReservations: t._count.reservations,
    })),
    places,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { placeId, tableNumber, seats, zone } = body

  if (!placeId || !tableNumber || !seats) {
    return NextResponse.json(
      { error: 'placeId, tableNumber, and seats are required' },
      { status: 400 },
    )
  }

  // Verify merchant owns the place
  const place = await prisma.place.findFirst({
    where: {
      id: placeId,
      OR: [
        { businessAccount: { ownerUserId: session.userId } },
        { business: { ownerId: session.userId } },
      ],
    },
  })

  if (!place) {
    return NextResponse.json({ error: 'Заведение не найдено' }, { status: 403 })
  }

  // Check if table number already exists
  const existing = await prisma.tableConfig.findUnique({
    where: { placeId_tableNumber: { placeId, tableNumber: String(tableNumber) } },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Стол с таким номером уже существует' },
      { status: 409 },
    )
  }

  const table = await prisma.tableConfig.create({
    data: {
      placeId,
      tableNumber: String(tableNumber),
      seats: Number(seats),
      zone: zone || null,
    },
  })

  return NextResponse.json({ table }, { status: 201 })
}
