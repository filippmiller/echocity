import { describe, it, expect } from 'vitest'

/**
 * Module export smoke tests: verify that each service module
 * exports the expected public functions. This catches accidental
 * renames, removed exports, and broken barrel files.
 */

describe('modules/auth/session exports', () => {
  it('exports createSession, getSession, deleteSession', async () => {
    const mod = await import('@/modules/auth/session')
    expect(typeof mod.createSession).toBe('function')
    expect(typeof mod.getSession).toBe('function')
    expect(typeof mod.deleteSession).toBe('function')
  })
})

describe('modules/offers/service exports', () => {
  it('exports offer CRUD and validation functions', async () => {
    const mod = await import('@/modules/offers/service')
    expect(typeof mod.createOffer).toBe('function')
    expect(typeof mod.submitForModeration).toBe('function')
    expect(typeof mod.approveOffer).toBe('function')
    expect(typeof mod.rejectOffer).toBe('function')
    expect(typeof mod.pauseOffer).toBe('function')
    expect(typeof mod.resumeOffer).toBe('function')
    expect(typeof mod.getOfferById).toBe('function')
    expect(typeof mod.getActiveOffersByCity).toBe('function')
    expect(typeof mod.getNearbyOffers).toBe('function')
    expect(typeof mod.validateOfferForRedemption).toBe('function')
    expect(typeof mod.expireOffers).toBe('function')
    expect(typeof mod.activateScheduledOffers).toBe('function')
  })
})

describe('modules/gamification/service exports', () => {
  it('exports XP, mission, and badge functions', async () => {
    const mod = await import('@/modules/gamification/service')
    expect(typeof mod.addXP).toBe('function')
    expect(typeof mod.getOrCreateUserXP).toBe('function')
    expect(typeof mod.checkAndProgressMissions).toBe('function')
    expect(typeof mod.completeMission).toBe('function')
    expect(typeof mod.getUserMissions).toBe('function')
    expect(typeof mod.getAvailableMissions).toBe('function')
    expect(typeof mod.getUserBadges).toBe('function')
    expect(typeof mod.grantBadge).toBe('function')
    expect(typeof mod.checkBadgeEligibility).toBe('function')
  })
})

describe('modules/recommendations/engine exports', () => {
  it('exports personalization and trending functions', async () => {
    const mod = await import('@/modules/recommendations/engine')
    expect(typeof mod.getPersonalizedOffers).toBe('function')
    expect(typeof mod.getTrendingOffers).toBe('function')
    expect(typeof mod.getForYouSection).toBe('function')
    expect(typeof mod.getSimilarOffers).toBe('function')
  })
})

describe('modules/reservations/service exports', () => {
  it('exports reservation management functions', async () => {
    const mod = await import('@/modules/reservations/service')
    expect(typeof mod.getAvailableSlots).toBe('function')
    expect(typeof mod.createReservation).toBe('function')
    expect(typeof mod.confirmReservation).toBe('function')
    expect(typeof mod.cancelReservation).toBe('function')
    expect(typeof mod.getReservationsByPlace).toBe('function')
    expect(typeof mod.getReservationsByUser).toBe('function')
    expect(typeof mod.completeExpiredReservations).toBe('function')
  })
})

describe('modules/bundles/service exports', () => {
  it('exports bundle lifecycle functions', async () => {
    const mod = await import('@/modules/bundles/service')
    expect(typeof mod.createBundle).toBe('function')
    expect(typeof mod.acceptBundleItem).toBe('function')
    expect(typeof mod.activateBundle).toBe('function')
    expect(typeof mod.pauseBundle).toBe('function')
    expect(typeof mod.expireBundles).toBe('function')
    expect(typeof mod.getActiveBundles).toBe('function')
    expect(typeof mod.getBundleDetail).toBe('function')
    expect(typeof mod.redeemBundle).toBe('function')
    expect(typeof mod.getBundlesByMerchant).toBe('function')
    expect(typeof mod.getAllBundles).toBe('function')
  })
})

describe('modules/stories/service exports', () => {
  it('exports story lifecycle functions', async () => {
    const mod = await import('@/modules/stories/service')
    expect(typeof mod.createStory).toBe('function')
    expect(typeof mod.getActiveStories).toBe('function')
    expect(typeof mod.recordView).toBe('function')
    expect(typeof mod.expireStories).toBe('function')
    expect(typeof mod.getStoriesByMerchant).toBe('function')
  })
})

describe('modules/demand/service exports', () => {
  it('exports demand request functions', async () => {
    const mod = await import('@/modules/demand/service')
    expect(typeof mod.createDemandRequest).toBe('function')
    expect(typeof mod.supportDemandRequest).toBe('function')
    expect(typeof mod.getDemandForPlace).toBe('function')
    expect(typeof mod.getDemandByCity).toBe('function')
  })
})

describe('modules/subscriptions/service exports', () => {
  it('exports subscription management functions', async () => {
    const mod = await import('@/modules/subscriptions/service')
    expect(typeof mod.getPlans).toBe('function')
    expect(typeof mod.getUserSubscription).toBe('function')
    expect(typeof mod.createSubscription).toBe('function')
    expect(typeof mod.cancelSubscription).toBe('function')
    expect(typeof mod.expireSubscriptions).toBe('function')
  })
})
