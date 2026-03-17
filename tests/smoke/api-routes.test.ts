import { describe, it, expect } from 'vitest'

/**
 * Smoke tests: verify all major API route modules export the correct handler functions.
 * These tests ensure routes are properly wired — they do NOT call the handlers
 * (which would require a full Next.js runtime), but they confirm the modules
 * resolve and export functions of the expected HTTP method names.
 */

describe('API Route Exports', () => {
  // ── Public GET routes ───────────────────────────────────

  it('GET /api/offers exports a GET handler', async () => {
    const mod = await import('@/app/api/offers/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/subscriptions/plans exports a GET handler', async () => {
    const mod = await import('@/app/api/subscriptions/plans/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/gamification/missions exports a GET handler', async () => {
    const mod = await import('@/app/api/gamification/missions/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/stories exports a GET handler', async () => {
    const mod = await import('@/app/api/stories/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/bundles exports a GET handler', async () => {
    const mod = await import('@/app/api/bundles/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/reservations/slots exports a GET handler', async () => {
    const mod = await import('@/app/api/reservations/slots/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/offers/nearby exports a GET handler', async () => {
    const mod = await import('@/app/api/offers/nearby/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/offers/recommended exports a GET handler', async () => {
    const mod = await import('@/app/api/offers/recommended/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  // ── Auth routes ─────────────────────────────────────────

  it('POST /api/auth/login exports a POST handler', async () => {
    const mod = await import('@/app/api/auth/login/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  it('POST /api/auth/register exports a POST handler', async () => {
    const mod = await import('@/app/api/auth/register/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  it('POST /api/auth/logout exports a POST handler', async () => {
    const mod = await import('@/app/api/auth/logout/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })

  // ── Admin routes ────────────────────────────────────────

  it('GET /api/admin/analytics exports a GET handler', async () => {
    const mod = await import('@/app/api/admin/analytics/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  // ── Business routes ─────────────────────────────────────

  it('GET /api/business/analytics exports a GET handler', async () => {
    const mod = await import('@/app/api/business/analytics/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/business/demand exports a GET handler', async () => {
    const mod = await import('@/app/api/business/demand/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/business/stories exports a GET handler', async () => {
    const mod = await import('@/app/api/business/stories/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('POST /api/business/stories exports a POST handler', async () => {
    const mod = await import('@/app/api/business/stories/route')
    expect(mod.POST).toBeDefined()
    expect(typeof mod.POST).toBe('function')
  })
})
