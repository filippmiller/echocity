import { prisma } from '@/lib/prisma'
import type { ReservationStatus } from '@prisma/client'

// ── Types ──────────────────────────────────────────────

interface SlotInfo {
  time: string
  available: boolean
  tablesLeft: number
}

interface CreateReservationInput {
  placeId: string
  date: string       // "YYYY-MM-DD"
  timeSlot: string   // "19:00"
  partySize: number
  guestName: string
  guestPhone?: string
  note?: string
}

// ── Helpers ────────────────────────────────────────────

/** Parse "HH:MM" to total minutes since midnight */
function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Convert total minutes to "HH:MM" string */
function toTimeStr(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Get the weekday index (0=Mon..6=Sun) matching our OfferSchedule convention */
function getWeekday(date: Date): number {
  const jsDay = date.getDay() // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1
}

/** Parse openingHours JSON into { open, close } for a given date */
function getOpenClose(openingHours: unknown, date: Date): { open: number; close: number } | null {
  if (!openingHours || typeof openingHours !== 'object') return null

  const weekday = getWeekday(date)
  const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const dayKey = dayNames[weekday]

  const oh = openingHours as Record<string, unknown>

  // Support format: { "mon": { "open": "10:00", "close": "22:00" }, ... }
  const dayData = oh[dayKey] as { open?: string; close?: string } | undefined
  if (dayData?.open && dayData?.close) {
    return { open: parseTime(dayData.open), close: parseTime(dayData.close) }
  }

  // Support format: { "open": "10:00", "close": "22:00" } (same every day)
  if (typeof (oh as { open?: string }).open === 'string' && typeof (oh as { close?: string }).close === 'string') {
    return { open: parseTime((oh as { open: string }).open), close: parseTime((oh as { close: string }).close) }
  }

  // Default: 10:00–22:00
  return { open: 600, close: 1320 }
}

/** Check if two time ranges overlap */
function overlaps(
  startA: number, endA: number,
  startB: number, endB: number,
): boolean {
  return startA < endB && startB < endA
}

// ── Available Slots ────────────────────────────────────

export async function getAvailableSlots(
  placeId: string,
  dateStr: string,
  partySize: number,
): Promise<{ slots: SlotInfo[] }> {
  const date = new Date(dateStr + 'T00:00:00')

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true, openingHours: true },
  })
  if (!place) return { slots: [] }

  const hours = getOpenClose(place.openingHours, date)
  const openMin = hours?.open ?? 600   // default 10:00
  const closeMin = hours?.close ?? 1320 // default 22:00

  // Generate 30-min slots from open to 2h before close
  const lastSlotMin = closeMin - 120
  const slotTimes: string[] = []
  for (let m = openMin; m <= lastSlotMin; m += 30) {
    slotTimes.push(toTimeStr(m))
  }

  if (slotTimes.length === 0) return { slots: [] }

  // Get all tables that fit the party size
  const tables = await prisma.tableConfig.findMany({
    where: { placeId, isActive: true, seats: { gte: partySize } },
    orderBy: { seats: 'asc' },
  })

  const hasTables = tables.length > 0

  // Get existing reservations for this date (excluding canceled)
  const dayStart = new Date(dateStr + 'T00:00:00Z')
  const dayEnd = new Date(dateStr + 'T23:59:59Z')

  const existingReservations = await prisma.reservation.findMany({
    where: {
      placeId,
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { tableId: true, timeSlot: true, durationMin: true, partySize: true },
  })

  const slots: SlotInfo[] = slotTimes.map((time) => {
    const slotStart = parseTime(time)
    const slotEnd = slotStart + 90 // default duration

    if (hasTables) {
      // Count how many fitting tables are free at this slot
      let freeCount = 0
      for (const table of tables) {
        const isOccupied = existingReservations.some((r) => {
          if (r.tableId !== table.id) return false
          const rStart = parseTime(r.timeSlot)
          const rEnd = rStart + (r.durationMin || 90)
          return overlaps(slotStart, slotEnd, rStart, rEnd)
        })
        if (!isOccupied) freeCount++
      }
      return { time, available: freeCount > 0, tablesLeft: freeCount }
    } else {
      // No table configs — allow unlimited reservations (basic mode)
      const reservedCount = existingReservations.filter((r) => {
        const rStart = parseTime(r.timeSlot)
        const rEnd = rStart + (r.durationMin || 90)
        return overlaps(slotStart, slotEnd, rStart, rEnd)
      }).length
      // Cap at 20 concurrent reservations for places without table config
      const maxConcurrent = 20
      const left = maxConcurrent - reservedCount
      return { time, available: left > 0, tablesLeft: left }
    }
  })

  return { slots }
}

// ── Create Reservation ─────────────────────────────────

export async function createReservation(userId: string, input: CreateReservationInput) {
  const { placeId, date: dateStr, timeSlot, partySize, guestName, guestPhone, note } = input

  // Verify slot is available
  const { slots } = await getAvailableSlots(placeId, dateStr, partySize)
  const slot = slots.find((s) => s.time === timeSlot)
  if (!slot || !slot.available) {
    throw new Error('Выбранное время недоступно')
  }

  // Try to auto-assign a table (smallest fitting free table)
  let tableId: string | null = null

  const tables = await prisma.tableConfig.findMany({
    where: { placeId, isActive: true, seats: { gte: partySize } },
    orderBy: { seats: 'asc' },
  })

  if (tables.length > 0) {
    const dayStart = new Date(dateStr + 'T00:00:00Z')
    const dayEnd = new Date(dateStr + 'T23:59:59Z')

    const existingReservations = await prisma.reservation.findMany({
      where: {
        placeId,
        date: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { tableId: true, timeSlot: true, durationMin: true },
    })

    const slotStart = parseTime(timeSlot)
    const slotEnd = slotStart + 90

    for (const table of tables) {
      const isOccupied = existingReservations.some((r) => {
        if (r.tableId !== table.id) return false
        const rStart = parseTime(r.timeSlot)
        const rEnd = rStart + (r.durationMin || 90)
        return overlaps(slotStart, slotEnd, rStart, rEnd)
      })
      if (!isOccupied) {
        tableId = table.id
        break
      }
    }
  }

  const date = new Date(dateStr + 'T00:00:00Z')

  return prisma.reservation.create({
    data: {
      placeId,
      tableId,
      userId,
      guestName,
      guestPhone: guestPhone || null,
      partySize,
      date,
      timeSlot,
      note: note || null,
    },
    include: {
      place: { select: { id: true, title: true, address: true } },
      table: { select: { id: true, tableNumber: true, zone: true, seats: true } },
    },
  })
}

// ── Confirm Reservation ────────────────────────────────

export async function confirmReservation(reservationId: string, merchantUserId: string) {
  // Verify the merchant owns a business that owns this place
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      place: { select: { businessId: true, businessAccountId: true, businessAccount: { select: { ownerUserId: true } } } },
    },
  })
  if (!reservation) throw new Error('Бронирование не найдено')

  // Check merchant access
  const ownsViaBusinessAccount = reservation.place.businessAccount?.ownerUserId === merchantUserId
  let ownsViaBusiness = false
  if (reservation.place.businessId) {
    const business = await prisma.business.findFirst({
      where: { id: reservation.place.businessId, ownerId: merchantUserId },
    })
    ownsViaBusiness = !!business
  }
  if (!ownsViaBusinessAccount && !ownsViaBusiness) {
    throw new Error('Нет доступа')
  }

  return prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
  })
}

// ── Cancel Reservation ─────────────────────────────────

export async function cancelReservation(reservationId: string, userId: string, reason?: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      place: {
        select: {
          businessId: true,
          businessAccount: { select: { ownerUserId: true } },
        },
      },
    },
  })
  if (!reservation) throw new Error('Бронирование не найдено')

  // Allow cancel by the user who made it, or by the merchant
  const isOwner = reservation.userId === userId
  const isMerchantViaAccount = reservation.place.businessAccount?.ownerUserId === userId
  let isMerchantViaBusiness = false
  if (reservation.place.businessId) {
    const biz = await prisma.business.findFirst({
      where: { id: reservation.place.businessId, ownerId: userId },
    })
    isMerchantViaBusiness = !!biz
  }

  if (!isOwner && !isMerchantViaAccount && !isMerchantViaBusiness) {
    throw new Error('Нет доступа')
  }

  return prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'CANCELED', canceledAt: new Date(), cancelReason: reason || null },
  })
}

// ── Get Reservations by Place ──────────────────────────

export async function getReservationsByPlace(
  placeId: string,
  date?: string,
  status?: ReservationStatus,
) {
  const where: Record<string, unknown> = { placeId }

  if (date) {
    const dayStart = new Date(date + 'T00:00:00Z')
    const dayEnd = new Date(date + 'T23:59:59Z')
    where.date = { gte: dayStart, lte: dayEnd }
  }

  if (status) {
    where.status = status
  }

  return prisma.reservation.findMany({
    where,
    include: {
      table: { select: { id: true, tableNumber: true, zone: true, seats: true } },
      user: { select: { email: true, firstName: true, phone: true } },
    },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
  })
}

// ── Get Reservations by User ───────────────────────────

export async function getReservationsByUser(userId: string) {
  return prisma.reservation.findMany({
    where: { userId },
    include: {
      place: { select: { id: true, title: true, address: true, city: true } },
      table: { select: { id: true, tableNumber: true, zone: true, seats: true } },
    },
    orderBy: [{ date: 'desc' }, { timeSlot: 'desc' }],
  })
}

// ── Complete Expired Reservations (Cron) ───────────────

export async function completeExpiredReservations(): Promise<number> {
  const now = new Date()

  // Find confirmed/pending reservations where date+time+duration is in the past
  const candidates = await prisma.reservation.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PENDING'] },
      date: { lt: now },
    },
    select: { id: true, date: true, timeSlot: true, durationMin: true },
  })

  const toComplete: string[] = []
  for (const r of candidates) {
    const [h, m] = r.timeSlot.split(':').map(Number)
    const reservationEnd = new Date(r.date)
    reservationEnd.setUTCHours(h, m || 0, 0, 0)
    reservationEnd.setUTCMinutes(reservationEnd.getUTCMinutes() + (r.durationMin || 90))

    if (reservationEnd < now) {
      toComplete.push(r.id)
    }
  }

  if (toComplete.length === 0) return 0

  const result = await prisma.reservation.updateMany({
    where: { id: { in: toComplete } },
    data: { status: 'COMPLETED' },
  })

  return result.count
}
