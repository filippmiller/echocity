import { describe, it, expect } from 'vitest'

/**
 * Smoke tests for consumer collection discovery routes.
 */

describe('Collection route exports', () => {
  it('GET /api/collections exports a GET handler', async () => {
    const mod = await import('@/app/api/collections/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })

  it('GET /api/districts exports a GET handler', async () => {
    const mod = await import('@/app/api/districts/route')
    expect(mod.GET).toBeDefined()
    expect(typeof mod.GET).toBe('function')
  })
})

describe('Curated collection module exports', () => {
  it('exports curated collection helpers', async () => {
    const mod = await import('@/modules/collections/curated')
    expect(typeof mod.getCuratedCollections).toBe('function')
    expect(typeof mod.getCuratedCollectionBySlug).toBe('function')
    expect(typeof mod.upsertCuratedCollections).toBe('function')
  })
})

describe('Expiring reminder module exports', () => {
  it('exports reminder functions', async () => {
    const mod = await import('@/modules/notifications/expiring-offer-reminders')
    expect(typeof mod.findExpiringSavedOffers).toBe('function')
    expect(typeof mod.sendReminder).toBe('function')
    expect(typeof mod.processExpiringOfferReminders).toBe('function')
  })
})
