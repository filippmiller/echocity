import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock Prisma client globally
vi.mock('@/lib/prisma', () => ({
  prisma: createMockPrisma(),
}))

function createMockPrisma() {
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '$transaction') {
          return vi.fn(async (args: any) => {
            if (typeof args === 'function') return args(createMockPrisma())
            return Promise.all(args)
          })
        }
        return new Proxy(
          {},
          {
            get: () => vi.fn().mockResolvedValue(null),
          },
        )
      },
    },
  )
}
