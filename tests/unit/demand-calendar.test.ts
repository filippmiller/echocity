import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    redemption: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { getDemandCalendar } from '@/modules/analytics/demand-calendar'

describe('analytics/demand-calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns fallback for empty merchant list', async () => {
    const result = await getDemandCalendar([])
    expect(result).toHaveLength(1)
    expect(result[0].weekday).toBe(-1)
    expect(result[0].recommendation).toContain('Недостаточно данных')
  })

  it('returns fallback when no redemption history exists', async () => {
    mockPrisma.redemption.findMany.mockResolvedValue([])

    const result = await getDemandCalendar(['merchant-1'])

    expect(result).toHaveLength(1)
    expect(result[0].weekday).toBe(-1)
    expect(result[0].redemptionCount).toBe(0)
    expect(result[0].recommendation).toContain('четверг–пятницу')
  })

  it('aggregates by weekday without hour buckets for small datasets', async () => {
    mockPrisma.redemption.findMany.mockResolvedValue([
      { redeemedAt: new Date('2024-06-03T12:00:00.000Z') }, // Monday
      { redeemedAt: new Date('2024-06-03T14:00:00.000Z') }, // Monday
      { redeemedAt: new Date('2024-06-05T18:00:00.000Z') }, // Wednesday
      { redeemedAt: new Date('2024-06-06T20:00:00.000Z') }, // Thursday
    ])

    const result = await getDemandCalendar(['merchant-1'])

    expect(result.length).toBeGreaterThan(0)
    expect(result[0].weekdayLabel).toBe('Понедельник')
    expect(result[0].redemptionCount).toBe(2)
    expect(result[0].recommendation).toContain('Понедельник')
    expect(result[0].hourBucket).toBeUndefined()
  })

  it('includes hour buckets when enough redemptions exist', async () => {
    const redemptions = Array.from({ length: 35 }, (_, i) => ({
      redeemedAt: new Date(`2024-06-0${(i % 5) + 3}T${14 + (i % 6)}:00:00.000Z`),
    }))
    mockPrisma.redemption.findMany.mockResolvedValue(redemptions)

    const result = await getDemandCalendar(['merchant-1'])

    expect(result.some((s) => s.hourBucket)).toBe(true)
  })

  it('applies city and category filters', async () => {
    mockPrisma.redemption.findMany.mockResolvedValue([
      { redeemedAt: new Date('2024-06-04T12:00:00.000Z') },
    ])

    await getDemandCalendar(['merchant-1'], {
      city: 'Санкт-Петербург',
      category: 'CAFE',
      daysBack: 30,
    })

    const callArg = mockPrisma.redemption.findMany.mock.calls[0][0]
    expect(callArg.where.branch).toEqual({
      city: 'Санкт-Петербург',
      placeType: 'CAFE',
    })
  })

  it('caps daysBack to a reasonable range', async () => {
    mockPrisma.redemption.findMany.mockResolvedValue([])

    await getDemandCalendar(['merchant-1'], { daysBack: 1000 })

    const callArg = mockPrisma.redemption.findMany.mock.calls[0][0]
    const cutoff = callArg.where.redeemedAt.gte as Date
    const diffDays = (Date.now() - cutoff.getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeLessThanOrEqual(366)
  })
})
