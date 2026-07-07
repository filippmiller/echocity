// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFeatureFlag, resetFeatureFlagCache } from '@/lib/useFeatureFlag'

const mockFetch = vi.fn()

describe('useFeatureFlag', () => {
  beforeEach(() => {
    resetFeatureFlagCache()
    globalThis.fetch = mockFetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns enabled=false while loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ flags: [{ key: 'ENABLE_BUNDLE_EXPERIMENT', enabled: true, description: '' }] }),
    })

    const { result } = renderHook(() => useFeatureFlag('ENABLE_BUNDLE_EXPERIMENT'))
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.enabled).toBe(true)
  })

  it('fails closed when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    const { result } = renderHook(() => useFeatureFlag('ENABLE_BUNDLE_EXPERIMENT'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.enabled).toBe(false)
    expect(result.current.error).toBe(true)
  })

  it('fails closed for unknown flags', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ flags: [] }),
    })

    const { result } = renderHook(() => useFeatureFlag('ENABLE_BUNDLE_EXPERIMENT'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.enabled).toBe(false)
  })
})
