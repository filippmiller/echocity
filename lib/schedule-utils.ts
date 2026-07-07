/**
 * Shared schedule/time helpers for offers and business hours.
 * All functions default to Europe/Moscow (UTC+3).
 */

export interface ScheduleSlot {
  weekday: number // 0=Monday..6=Sunday
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  isBlackout?: boolean
  timezone?: string
}

export interface BlackoutDate {
  date: Date | string
}

/**
 * Return Moscow weekday (0=Monday..6=Sunday) and HH:MM time string.
 * Accepts an optional date; defaults to now.
 */
export function getMoscowTimeInfo(inputDate?: Date): { weekday: number; timeStr: string } {
  const now = inputDate ?? new Date()
  const moscowOffset = 3 * 60 // UTC+3 in minutes
  const moscow = new Date(now.getTime() + moscowOffset * 60_000)
  const weekday = (moscow.getUTCDay() + 6) % 7 // 0=Monday
  const timeStr = `${String(moscow.getUTCHours()).padStart(2, '0')}:${String(moscow.getUTCMinutes()).padStart(2, '0')}`
  return { weekday, timeStr }
}

function toMoscowDate(inputDate?: Date): Date {
  const now = inputDate ?? new Date()
  const moscowOffset = 3 * 60 // UTC+3 in minutes
  return new Date(now.getTime() + moscowOffset * 60_000)
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

/**
 * Check whether the given date is listed as a blackout date.
 */
export function isBlackoutDate(blackoutDates: BlackoutDate[] | undefined | null, inputDate?: Date): boolean {
  if (!blackoutDates || blackoutDates.length === 0) return false
  const moscow = toMoscowDate(inputDate)
  return blackoutDates.some((bd) => {
    const d = bd.date instanceof Date ? bd.date : new Date(bd.date)
    return isSameCalendarDay(d, moscow)
  })
}

/**
 * Check whether an offer is active now according to its schedules.
 * - Empty schedules = always active.
 * - All schedules are blackouts = always active (no positive schedule defined).
 * - Otherwise at least one non-blackout schedule must match current weekday/time.
 * - Does NOT check blackout dates; combine with isBlackoutDate() when needed.
 */
export function isOfferActiveNow(
  schedules: ScheduleSlot[] | undefined | null,
  inputDate?: Date
): boolean {
  if (!schedules || schedules.length === 0) return true

  const { weekday, timeStr } = getMoscowTimeInfo(inputDate)
  const activeSchedules = schedules.filter((s) => !s.isBlackout)

  // If every schedule is a blackout, we have no positive rule → treat as always active
  if (activeSchedules.length === 0) return true

  return activeSchedules.some(
    (s) => s.weekday === weekday && s.startTime <= timeStr && s.endTime > timeStr
  )
}

export type ScheduleStatus =
  | { kind: 'open_now' }
  | { kind: 'opens_today'; startTime: string }
  | { kind: 'tomorrow' }
  | { kind: 'no_schedule' }

/**
 * Compute a human-friendly schedule status for an offer card.
 */
export function getScheduleStatus(schedules: ScheduleSlot[] | undefined | null, inputDate?: Date): ScheduleStatus {
  if (!schedules || schedules.length === 0) return { kind: 'no_schedule' }

  const { weekday, timeStr } = getMoscowTimeInfo(inputDate)
  const activeSchedules = schedules.filter((s) => !s.isBlackout)

  if (activeSchedules.length === 0) return { kind: 'no_schedule' }

  const openNow = activeSchedules.some(
    (s) => s.weekday === weekday && s.startTime <= timeStr && s.endTime > timeStr
  )
  if (openNow) return { kind: 'open_now' }

  const laterToday = activeSchedules
    .filter((s) => s.weekday === weekday && s.startTime > timeStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
  if (laterToday) return { kind: 'opens_today', startTime: laterToday.startTime }

  const tomorrow = (weekday + 1) % 7
  const hasTomorrow = activeSchedules.some((s) => s.weekday === tomorrow)
  if (hasTomorrow) return { kind: 'tomorrow' }

  return { kind: 'no_schedule' }
}
