import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockPrismaClient, type MockPrismaClient } from '../mocks/prisma'

// Create mock prisma before importing the module
let mockPrisma: MockPrismaClient

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Import after mocks are set up
import { addXP, getOrCreateUserXP, checkAndProgressMissions } from '@/modules/gamification/service'

describe('gamification/service', () => {
  beforeEach(() => {
    mockPrisma = createMockPrismaClient()
    vi.clearAllMocks()
  })

  describe('calculateLevel (tested via addXP)', () => {
    // The formula is: level = floor(sqrt(totalXp / 100)) + 1
    // We test it indirectly through addXP since calculateLevel is not exported.

    it('0 XP → level 1', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 0, level: 1 })
      mockPrisma.userXP.update.mockResolvedValue({ userId: 'u1', totalXp: 0, level: 1 })

      const result = await addXP('u1', 0)
      // totalXp stays 0, level stays 1 → no level update call
      expect(result.level).toBe(1)
    })

    it('100 XP → level 2', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 0, level: 1 })
      // After increment, totalXp = 100
      mockPrisma.userXP.update
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 100, level: 1 }) // first update (increment)
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 100, level: 2 }) // second update (level)

      const result = await addXP('u1', 100)
      // floor(sqrt(100/100)) + 1 = floor(1) + 1 = 2
      expect(result.level).toBe(2)
    })

    it('400 XP → level 3', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 0, level: 1 })
      mockPrisma.userXP.update
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 400, level: 1 })
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 400, level: 3 })

      const result = await addXP('u1', 400)
      // floor(sqrt(400/100)) + 1 = floor(2) + 1 = 3
      expect(result.level).toBe(3)
    })

    it('10000 XP → level 11', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 0, level: 1 })
      mockPrisma.userXP.update
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 10000, level: 1 })
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 10000, level: 11 })

      const result = await addXP('u1', 10000)
      // floor(sqrt(10000/100)) + 1 = floor(10) + 1 = 11
      expect(result.level).toBe(11)
    })

    it('99 XP → level 1 (just below threshold)', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 0, level: 1 })
      mockPrisma.userXP.update.mockResolvedValueOnce({ userId: 'u1', totalXp: 99, level: 1 })

      const result = await addXP('u1', 99)
      // floor(sqrt(99/100)) + 1 = floor(0.994) + 1 = 0 + 1 = 1
      expect(result.level).toBe(1)
    })

    it('900 XP → level 4', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 0, level: 1 })
      mockPrisma.userXP.update
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 900, level: 1 })
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 900, level: 4 })

      const result = await addXP('u1', 900)
      // floor(sqrt(900/100)) + 1 = floor(3) + 1 = 4
      expect(result.level).toBe(4)
    })
  })

  describe('EVENT_TO_MISSION mapping', () => {
    // We test this indirectly through checkAndProgressMissions.
    // If an event type has no mapping, the function returns early.

    it('unknown event type returns early without querying missions', async () => {
      await checkAndProgressMissions('u1', 'unknown_event', 1)
      expect(mockPrisma.mission.findMany).not.toHaveBeenCalled()
    })

    it('redemption event queries FIRST_REDEMPTION and REDEEM_COUNT missions', async () => {
      mockPrisma.mission.findMany.mockResolvedValue([])
      await checkAndProgressMissions('u1', 'redemption', 1)

      expect(mockPrisma.mission.findMany).toHaveBeenCalledOnce()
      const call = mockPrisma.mission.findMany.mock.calls[0][0]
      expect(call.where.type.in).toEqual(['FIRST_REDEMPTION', 'REDEEM_COUNT'])
    })

    it('visit_place event queries VISIT_PLACES missions', async () => {
      mockPrisma.mission.findMany.mockResolvedValue([])
      await checkAndProgressMissions('u1', 'visit_place', 1)

      const call = mockPrisma.mission.findMany.mock.calls[0][0]
      expect(call.where.type.in).toEqual(['VISIT_PLACES'])
    })

    it('referral event queries REFER_FRIENDS missions', async () => {
      mockPrisma.mission.findMany.mockResolvedValue([])
      await checkAndProgressMissions('u1', 'referral', 1)

      const call = mockPrisma.mission.findMany.mock.calls[0][0]
      expect(call.where.type.in).toEqual(['REFER_FRIENDS'])
    })

    it('review event queries WRITE_REVIEWS missions', async () => {
      mockPrisma.mission.findMany.mockResolvedValue([])
      await checkAndProgressMissions('u1', 'review', 1)

      const call = mockPrisma.mission.findMany.mock.calls[0][0]
      expect(call.where.type.in).toEqual(['WRITE_REVIEWS'])
    })

    it('streak event queries STREAK_DAYS missions', async () => {
      mockPrisma.mission.findMany.mockResolvedValue([])
      await checkAndProgressMissions('u1', 'streak', 1)

      const call = mockPrisma.mission.findMany.mock.calls[0][0]
      expect(call.where.type.in).toEqual(['STREAK_DAYS'])
    })

    it('savings event queries SAVE_AMOUNT missions', async () => {
      mockPrisma.mission.findMany.mockResolvedValue([])
      await checkAndProgressMissions('u1', 'savings', 1)

      const call = mockPrisma.mission.findMany.mock.calls[0][0]
      expect(call.where.type.in).toEqual(['SAVE_AMOUNT'])
    })
  })

  describe('addXP', () => {
    it('uses atomic increment on the totalXp field', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 50, level: 1 })
      mockPrisma.userXP.update.mockResolvedValue({ userId: 'u1', totalXp: 75, level: 1 })

      await addXP('u1', 25)

      // The update call should use { increment: amount }
      expect(mockPrisma.userXP.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { totalXp: { increment: 25 } },
      })
    })

    it('creates UserXP record if it does not exist', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue(null)
      mockPrisma.userXP.create.mockResolvedValue({ userId: 'u1', totalXp: 0, level: 1 })
      mockPrisma.userXP.update.mockResolvedValue({ userId: 'u1', totalXp: 50, level: 1 })

      await addXP('u1', 50)

      expect(mockPrisma.userXP.create).toHaveBeenCalledWith({
        data: { userId: 'u1', totalXp: 0, level: 1 },
      })
    })

    it('triggers a second update when level changes', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 80, level: 1 })
      // After incrementing by 20, totalXp = 100 → level should be 2
      mockPrisma.userXP.update
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 100, level: 1 })
        .mockResolvedValueOnce({ userId: 'u1', totalXp: 100, level: 2 })

      await addXP('u1', 20)

      // Should have been called twice: once for XP increment, once for level update
      expect(mockPrisma.userXP.update).toHaveBeenCalledTimes(2)
      expect(mockPrisma.userXP.update).toHaveBeenLastCalledWith({
        where: { userId: 'u1' },
        data: { level: 2 },
      })
    })

    it('does not update level when it has not changed', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue({ userId: 'u1', totalXp: 50, level: 1 })
      // After increment, totalXp = 60 → level still 1
      mockPrisma.userXP.update.mockResolvedValue({ userId: 'u1', totalXp: 60, level: 1 })

      await addXP('u1', 10)

      // Only one update call (the increment), no level update
      expect(mockPrisma.userXP.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('getOrCreateUserXP', () => {
    it('returns existing UserXP when found', async () => {
      const existing = { userId: 'u1', totalXp: 500, level: 3 }
      mockPrisma.userXP.findUnique.mockResolvedValue(existing)

      const result = await getOrCreateUserXP('u1')
      expect(result).toEqual(existing)
      expect(mockPrisma.userXP.create).not.toHaveBeenCalled()
    })

    it('creates new UserXP with 0 XP and level 1 when not found', async () => {
      mockPrisma.userXP.findUnique.mockResolvedValue(null)
      const created = { userId: 'u1', totalXp: 0, level: 1 }
      mockPrisma.userXP.create.mockResolvedValue(created)

      const result = await getOrCreateUserXP('u1')
      expect(result).toEqual(created)
      expect(mockPrisma.userXP.create).toHaveBeenCalledWith({
        data: { userId: 'u1', totalXp: 0, level: 1 },
      })
    })
  })
})
