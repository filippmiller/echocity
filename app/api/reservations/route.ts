import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { createReservation, getReservationsByUser } from '@/modules/reservations/service'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reservations = await getReservationsByUser(session.userId)

  return NextResponse.json({
    reservations: reservations.map((r) => ({
      ...r,
      date: r.date.toISOString(),
      confirmedAt: r.confirmedAt?.toISOString() || null,
      canceledAt: r.canceledAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { placeId, date, timeSlot, partySize, guestName, guestPhone, note } = body

  if (!placeId || !date || !timeSlot || !partySize || !guestName) {
    return NextResponse.json(
      { error: 'placeId, date, timeSlot, partySize, and guestName are required' },
      { status: 400 },
    )
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  if (!/^\d{2}:\d{2}$/.test(timeSlot)) {
    return NextResponse.json({ error: 'timeSlot must be HH:MM' }, { status: 400 })
  }

  if (partySize < 1 || partySize > 20) {
    return NextResponse.json({ error: 'partySize must be 1-20' }, { status: 400 })
  }

  try {
    const reservation = await createReservation(session.userId, {
      placeId,
      date,
      timeSlot,
      partySize: Number(partySize),
      guestName,
      guestPhone,
      note,
    })

    return NextResponse.json({
      reservation: {
        ...reservation,
        date: reservation.date.toISOString(),
        confirmedAt: reservation.confirmedAt?.toISOString() || null,
        canceledAt: reservation.canceledAt?.toISOString() || null,
        createdAt: reservation.createdAt.toISOString(),
        updatedAt: reservation.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка создания бронирования'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
