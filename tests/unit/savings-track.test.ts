import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockMarkReferralEligible } = vi.hoisted(() => ({
  mockMarkReferralEligible: vi.fn(),
}))

vi.mock('@/modules/referrals/service', () => ({
  markReferralEligible: mockMarkReferralEligible,
}))

let mockPrisma: {
  userSavings: { create: ReturnType<typeof vi.fn> }
  redemption: { count: ReturnType<typeof vi.fn> }
}

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return mockPrisma
  },
}))

import { trackSaving } from '@/modules/savings/track'

describe('modules/savings/track', () => {
  beforeEach(() => {
    mockPrisma = {
      userSavings: { create: vi.fn() },
      redemption: { count: vi.fn() },
    }
    vi.clearAllMocks()
  })

  it('creates a savings record', async () => {
    mockPrisma.userSavings.create.mockResolvedValue({ id: 's1' })
    mockPrisma.redemption.count.mockResolvedValue(1)
    mockMarkReferralEligible.mockResolvedValue(null)

    await trackSaving('user-1', 'red-1', 1500, 'RUB')

    expect(mockPrisma.userSavings.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        redemptionId: 'red-1',
        savedAmount: 1500,
        currency: 'RUB',
      },
    })
  })

  it('returns early on unique constraint violation', async () => {
    const error = new Error('Unique constraint') as Error & { code: string }
    error.code = 'P2002'
    mockPrisma.userSavings.create.mockRejectedValue(error)

    await expect(trackSaving('user-1', 'red-1', 1500)).resolves.toBeUndefined()
    expect(mockPrisma.redemption.count).not.toHaveBeenCalled()
    expect(mockMarkReferralEligible).not.toHaveBeenCalled()
  })

  it('re-throws non-unique errors', async () => {
    mockPrisma.userSavings.create.mockRejectedValue(new Error('DB down'))

    await expect(trackSaving('user-1', 'red-1', 1500)).rejects.toThrow('DB down')
  })

  it('marks referral eligible on first successful redemption without granting reward', async () => {
    mockPrisma.userSavings.create.mockResolvedValue({ id: 's1' })
    mockPrisma.redemption.count.mockResolvedValue(1)
    mockMarkReferralEligible.mockResolvedValue({ id: 'ref-1', status: 'COMPLETED' })

    await trackSaving('user-1', 'red-1', 1500)

    expect(mockMarkReferralEligible).toHaveBeenCalledWith('user-1')
  })

  it('does not mark referral eligible when it is not the first redemption', async () => {
    mockPrisma.userSavings.create.mockResolvedValue({ id: 's1' })
    mockPrisma.redemption.count.mockResolvedValue(3)

    await trackSaving('user-1', 'red-1', 1500)

    expect(mockMarkReferralEligible).not.toHaveBeenCalled()
  })
})
