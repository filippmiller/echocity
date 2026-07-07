import { describe, it, expect } from 'vitest'
import { getMoscowTimeInfo, isOfferActiveNow, isBlackoutDate, getScheduleStatus } from '@/lib/schedule-utils'

const MONDAY_12_00 = new Date('2026-07-06T09:00:00.000Z') // Monday 12:00 MSK
const MONDAY_18_00 = new Date('2026-07-06T15:00:00.000Z') // Monday 18:00 MSK
const SATURDAY_12_00 = new Date('2026-07-11T09:00:00.000Z') // Saturday 12:00 MSK

describe('lib/schedule-utils', () => {
  describe('getMoscowTimeInfo', () => {
    it('returns Monday 12:00 for a known Monday noon UTC input', () => {
      const info = getMoscowTimeInfo(MONDAY_12_00)
      expect(info.weekday).toBe(0)
      expect(info.timeStr).toBe('12:00')
    })

    it('returns Monday 18:00 for a known Monday 15:00 UTC input', () => {
      const info = getMoscowTimeInfo(MONDAY_18_00)
      expect(info.weekday).toBe(0)
      expect(info.timeStr).toBe('18:00')
    })
  })

  describe('isOfferActiveNow', () => {
    it('returns true when schedules are empty', () => {
      expect(isOfferActiveNow([])).toBe(true)
      expect(isOfferActiveNow(undefined)).toBe(true)
    })

    it('returns true when the schedule matches current weekday and time', () => {
      expect(isOfferActiveNow([{ weekday: 0, startTime: '10:00', endTime: '20:00' }], MONDAY_12_00)).toBe(true)
    })

    it('returns false when the schedule matches weekday but not time', () => {
      expect(isOfferActiveNow([{ weekday: 0, startTime: '10:00', endTime: '12:00' }], MONDAY_18_00)).toBe(false)
    })

    it('returns false when the schedule matches time but not weekday', () => {
      expect(isOfferActiveNow([{ weekday: 0, startTime: '10:00', endTime: '20:00' }], SATURDAY_12_00)).toBe(false)
    })

    it('ignores blackout schedules', () => {
      expect(
        isOfferActiveNow(
          [
            { weekday: 0, startTime: '10:00', endTime: '20:00', isBlackout: true },
            { weekday: 0, startTime: '18:00', endTime: '22:00' },
          ],
          MONDAY_18_00
        )
      ).toBe(true)
    })

    it('treats all-blackout schedules as always active', () => {
      expect(isOfferActiveNow([{ weekday: 0, startTime: '10:00', endTime: '20:00', isBlackout: true }], MONDAY_12_00)).toBe(true)
    })
  })

  describe('isBlackoutDate', () => {
    it('returns false when blackoutDates is empty', () => {
      expect(isBlackoutDate([], MONDAY_12_00)).toBe(false)
      expect(isBlackoutDate(undefined, MONDAY_12_00)).toBe(false)
    })

    it('returns true when the date matches a blackout date', () => {
      expect(isBlackoutDate([{ date: new Date('2026-07-06T00:00:00.000Z') }], MONDAY_12_00)).toBe(true)
    })

    it('returns false when the date does not match any blackout date', () => {
      expect(isBlackoutDate([{ date: new Date('2026-07-07T00:00:00.000Z') }], MONDAY_12_00)).toBe(false)
    })

    it('accepts string dates', () => {
      expect(isBlackoutDate([{ date: '2026-07-06' }], MONDAY_12_00)).toBe(true)
    })
  })

  describe('getScheduleStatus', () => {
    it('returns open_now when active', () => {
      expect(getScheduleStatus([{ weekday: 0, startTime: '10:00', endTime: '20:00' }], MONDAY_12_00)).toEqual({ kind: 'open_now' })
    })

    it('returns opens_today with earliest start time', () => {
      expect(
        getScheduleStatus(
          [
            { weekday: 0, startTime: '14:00', endTime: '20:00' },
            { weekday: 0, startTime: '13:00', endTime: '20:00' },
          ],
          MONDAY_12_00
        )
      ).toEqual({ kind: 'opens_today', startTime: '13:00' })
    })

    it('returns tomorrow when there is a schedule tomorrow', () => {
      expect(getScheduleStatus([{ weekday: 1, startTime: '10:00', endTime: '20:00' }], MONDAY_18_00)).toEqual({ kind: 'tomorrow' })
    })

    it('returns no_schedule when there is no relevant schedule', () => {
      expect(getScheduleStatus([{ weekday: 2, startTime: '10:00', endTime: '20:00' }], MONDAY_18_00)).toEqual({ kind: 'no_schedule' })
    })
  })
})
