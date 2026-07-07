import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFindUnique, mockFindMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    featureFlag: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
    },
  },
}))

import {
  getFeatureFlag,
  getAllFeatureFlags,
  getPublicFeatureFlags,
  FEATURE_FLAGS,
  type FeatureFlagKey,
} from '@/lib/feature-flags'

describe('lib/feature-flags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('FEATURE_FLAG_')) {
        delete process.env[key]
      }
    }
  })

  it('returns conservative default false for known flags when DB is empty', async () => {
    mockFindUnique.mockResolvedValue(null)
    const flag = await getFeatureFlag('ENABLE_BUNDLE_EXPERIMENT')
    expect(flag.enabled).toBe(false)
    expect(flag.key).toBe('ENABLE_BUNDLE_EXPERIMENT')
  })

  it('fails closed for unknown flag keys', async () => {
    const flag = await getFeatureFlag('UNKNOWN_FLAG')
    expect(flag.enabled).toBe(false)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('uses env override over DB value', async () => {
    process.env.FEATURE_FLAG_ENABLE_BUNDLE_EXPERIMENT = 'true'
    mockFindUnique.mockResolvedValue({ key: 'ENABLE_BUNDLE_EXPERIMENT', enabled: false })
    const flag = await getFeatureFlag('ENABLE_BUNDLE_EXPERIMENT')
    expect(flag.enabled).toBe(true)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('env override can disable a flag', async () => {
    process.env.FEATURE_FLAG_ENABLE_BUNDLE_EXPERIMENT = 'false'
    mockFindUnique.mockResolvedValue({ key: 'ENABLE_BUNDLE_EXPERIMENT', enabled: true })
    const flag = await getFeatureFlag('ENABLE_BUNDLE_EXPERIMENT')
    expect(flag.enabled).toBe(false)
  })

  it('parses common truthy env values', async () => {
    for (const value of ['true', '1', 'yes', 'on']) {
      process.env.FEATURE_FLAG_ENABLE_MYSTERY_BAGS = value
      const flag = await getFeatureFlag('ENABLE_MYSTERY_BAGS')
      expect(flag.enabled).toBe(true)
      delete process.env.FEATURE_FLAG_ENABLE_MYSTERY_BAGS
    }
  })

  it('falls back to DB value when env override is missing', async () => {
    mockFindUnique.mockResolvedValue({
      key: 'ENABLE_GROUP_DEALS',
      enabled: true,
      description: 'db desc',
      allowedRoles: ['ADMIN'],
    })
    const flag = await getFeatureFlag('ENABLE_GROUP_DEALS')
    expect(flag.enabled).toBe(true)
    expect(flag.description).toBe('db desc')
    expect(flag.allowedRoles).toEqual(['ADMIN'])
  })

  it('fails closed on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('db down'))
    const flag = await getFeatureFlag('ENABLE_DEMAND_RESPONSES')
    expect(flag.enabled).toBe(false)
  })

  it('getAllFeatureFlags returns all known flags', async () => {
    mockFindMany.mockResolvedValue([])
    const flags = await getAllFeatureFlags()
    expect(flags).toHaveLength(FEATURE_FLAGS.length)
    expect(flags.every((f) => !f.enabled)).toBe(true)
  })

  it('getPublicFeatureFlags strips allowedRoles', async () => {
    mockFindMany.mockResolvedValue([
      { key: 'ENABLE_STORIES', enabled: true, description: 'desc', allowedRoles: ['ADMIN'] },
    ])
    const flags = await getPublicFeatureFlags()
    const stories = flags.find((f) => f.key === 'ENABLE_STORIES')
    expect(stories).toEqual({ key: 'ENABLE_STORIES', enabled: true, description: 'desc' })
    expect(flags.every((f) => !('allowedRoles' in f))).toBe(true)
  })
})
