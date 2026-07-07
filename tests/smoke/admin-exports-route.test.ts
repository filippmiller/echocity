import { describe, it, expect } from 'vitest'

/**
 * Smoke tests for the admin CSV exports route.
 * Verifies the route module exports a GET handler.
 */

describe('Admin exports route', () => {
  it('GET /api/admin/exports exports a GET handler', async () => {
    const mod = await import('@/app/api/admin/exports/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })
})
