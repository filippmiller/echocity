import { describe, expect, it, beforeEach } from 'vitest'
import { consumeRateLimit, resetRateLimitStore } from '@/lib/rate-limit'

describe('rate-limit', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('allows requests within the configured window', () => {
    const baseTime = 1_700_000_000_000

    const first = consumeRateLimit({ key: 'test', limit: 2, windowMs: 60_000 }, 'actor-1', baseTime)
    const second = consumeRateLimit({ key: 'test', limit: 2, windowMs: 60_000 }, 'actor-1', baseTime + 1_000)

    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(1)
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(0)
  })

  it('blocks requests after the limit is exceeded', () => {
    const baseTime = 1_700_000_000_000

    consumeRateLimit({ key: 'test', limit: 1, windowMs: 60_000 }, 'actor-1', baseTime)
    const blocked = consumeRateLimit({ key: 'test', limit: 1, windowMs: 60_000 }, 'actor-1', baseTime + 1_000)

    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets counts after the window expires', () => {
    const baseTime = 1_700_000_000_000
    const rule = { key: 'test', limit: 1, windowMs: 5_000 }

    consumeRateLimit(rule, 'actor-1', baseTime)
    const reset = consumeRateLimit(rule, 'actor-1', baseTime + 5_100)

    expect(reset.allowed).toBe(true)
    expect(reset.remaining).toBe(0)
  })

  it('tracks actors independently', () => {
    const baseTime = 1_700_000_000_000
    const rule = { key: 'test', limit: 1, windowMs: 60_000 }

    consumeRateLimit(rule, 'actor-1', baseTime)
    const otherActor = consumeRateLimit(rule, 'actor-2', baseTime + 1_000)

    expect(otherActor.allowed).toBe(true)
    expect(otherActor.remaining).toBe(0)
  })
})
