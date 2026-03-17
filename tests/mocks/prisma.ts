import { vi } from 'vitest'

type MockMethod = ReturnType<typeof vi.fn>

interface MockModel {
  findUnique: MockMethod
  findFirst: MockMethod
  findMany: MockMethod
  create: MockMethod
  update: MockMethod
  updateMany: MockMethod
  upsert: MockMethod
  delete: MockMethod
  deleteMany: MockMethod
  count: MockMethod
  aggregate: MockMethod
  groupBy: MockMethod
}

function createMockModel(): MockModel {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(null),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(null),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
  }
}

export interface MockPrismaClient {
  userXP: MockModel
  mission: MockModel
  userMission: MockModel
  badge: MockModel
  userBadge: MockModel
  redemption: MockModel
  referralCode: MockModel
  referral: MockModel
  review: MockModel
  userSavings: MockModel
  offer: MockModel
  favorite: MockModel
  branch: MockModel
  merchant: MockModel
  user: MockModel
  $transaction: MockMethod
  [key: string]: MockModel | MockMethod
}

/**
 * Create a fully typed mock Prisma client.
 * Each model has standard Prisma methods pre-mocked.
 * Tests can override return values per-test:
 *
 *   const mockPrisma = createMockPrismaClient()
 *   mockPrisma.userXP.findUnique.mockResolvedValue({ userId: '1', totalXp: 100, level: 2 })
 */
export function createMockPrismaClient(): MockPrismaClient {
  return {
    userXP: createMockModel(),
    mission: createMockModel(),
    userMission: createMockModel(),
    badge: createMockModel(),
    userBadge: createMockModel(),
    redemption: createMockModel(),
    referralCode: createMockModel(),
    referral: createMockModel(),
    review: createMockModel(),
    userSavings: createMockModel(),
    offer: createMockModel(),
    favorite: createMockModel(),
    branch: createMockModel(),
    merchant: createMockModel(),
    user: createMockModel(),
    $transaction: vi.fn(async (args: any) => {
      if (typeof args === 'function') {
        const client = createMockPrismaClient()
        return args(client)
      }
      return Promise.all(args)
    }),
  }
}

/**
 * Reset all mocks on a mock Prisma client.
 */
export function resetMockPrisma(mockPrisma: MockPrismaClient): void {
  for (const key of Object.keys(mockPrisma)) {
    const value = mockPrisma[key]
    if (typeof value === 'function') {
      (value as MockMethod).mockReset()
    } else if (value && typeof value === 'object') {
      for (const method of Object.values(value)) {
        if (typeof method === 'function') {
          (method as MockMethod).mockReset()
        }
      }
    }
  }
}
