import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateRiskScore,
  calculateBusinessRiskScore,
  type RiskScoreOffer,
  type RiskScoreBusiness,
  type RiskScoreComplaint,
  type RiskScoreFraudFlag,
} from '@/modules/moderation/risk-score'

describe('moderation/risk-score — offer scoring', () => {
  const now = new Date('2026-01-15T12:00:00.000Z')

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function baseOffer(overrides: Partial<RiskScoreOffer> = {}): RiskScoreOffer {
    return {
      description: 'A nice offer',
      imageUrl: 'https://example.com/image.jpg',
      benefitType: 'PERCENT',
      benefitValue: 10,
      startAt: now,
      endAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ...overrides,
    }
  }

  function baseBusiness(overrides: Partial<RiskScoreBusiness> = {}): RiskScoreBusiness {
    return {
      status: 'APPROVED',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      isVerified: true,
      supportEmail: 'support@example.com',
      supportPhone: '+79990000000',
      placesCount: 2,
      ...overrides,
    }
  }

  it('returns zero score for a clean offer and business', () => {
    const result = calculateRiskScore(baseOffer(), baseBusiness(), [], [])
    expect(result.score).toBe(0)
    expect(result.reasons).toEqual([])
  })

  it('adds risk for missing image', () => {
    const result = calculateRiskScore(baseOffer({ imageUrl: null }), baseBusiness(), [], [])
    expect(result.reasons).toContain('Missing offer image')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for missing description', () => {
    const result = calculateRiskScore(baseOffer({ description: '' }), baseBusiness(), [], [])
    expect(result.reasons).toContain('Missing offer description')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for discount > 90%', () => {
    const result = calculateRiskScore(baseOffer({ benefitValue: 95 }), baseBusiness(), [], [])
    expect(result.reasons).toContain('Discount percent (95%) exceeds 90%')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for pending business', () => {
    const result = calculateRiskScore(baseOffer(), baseBusiness({ status: 'PENDING' }), [], [])
    expect(result.reasons).toContain('Business approval status is PENDING')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for active complaints', () => {
    const complaints: RiskScoreComplaint[] = [{ status: 'OPEN' }, { status: 'IN_REVIEW' }]
    const result = calculateRiskScore(baseOffer(), baseBusiness(), complaints, [])
    expect(result.reasons).toContain('2 active complaint(s)')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for active fraud flags', () => {
    const flags: RiskScoreFraudFlag[] = [{ status: 'OPEN' }, { status: 'OPEN' }]
    const result = calculateRiskScore(baseOffer(), baseBusiness(), [], flags)
    expect(result.reasons).toContain('2 active fraud flag(s)')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for short duration (< 24 hours)', () => {
    const result = calculateRiskScore(
      baseOffer({ endAt: new Date(now.getTime() + 60 * 60 * 1000) }),
      baseBusiness(),
      [],
      []
    )
    expect(result.reasons).toContain('Offer duration is less than 24 hours')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for young business (< 7 days)', () => {
    const result = calculateRiskScore(
      baseOffer(),
      baseBusiness({ createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }),
      [],
      []
    )
    expect(result.reasons).toContain('Business is less than 7 days old')
    expect(result.score).toBeGreaterThan(0)
  })

  it('caps the score at 100', () => {
    const complaints: RiskScoreComplaint[] = Array.from({ length: 10 }, () => ({ status: 'OPEN' }))
    const flags: RiskScoreFraudFlag[] = Array.from({ length: 10 }, () => ({ status: 'OPEN' }))
    const result = calculateRiskScore(
      baseOffer({ imageUrl: '', description: '', benefitValue: 99 }),
      baseBusiness({ status: 'PENDING', createdAt: new Date(now.getTime() - 1000) }),
      complaints,
      flags
    )
    expect(result.score).toBe(100)
  })
})

describe('moderation/risk-score — business scoring', () => {
  const now = new Date('2026-01-15T12:00:00.000Z')

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(now.getTime())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function baseBusiness(overrides: Partial<RiskScoreBusiness> = {}): RiskScoreBusiness {
    return {
      status: 'APPROVED',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      isVerified: true,
      supportEmail: 'support@example.com',
      supportPhone: '+79990000000',
      placesCount: 2,
      ...overrides,
    }
  }

  it('returns zero score for a clean business', () => {
    const result = calculateBusinessRiskScore(baseBusiness(), [], [])
    expect(result.score).toBe(0)
    expect(result.reasons).toEqual([])
  })

  it('adds risk for pending status', () => {
    const result = calculateBusinessRiskScore(baseBusiness({ status: 'PENDING' }), [], [])
    expect(result.reasons).toContain('Business approval status is PENDING')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for no places', () => {
    const result = calculateBusinessRiskScore(baseBusiness({ placesCount: 0 }), [], [])
    expect(result.reasons).toContain('Business has no places')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for no verified contact', () => {
    const result = calculateBusinessRiskScore(
      baseBusiness({ isVerified: false, supportEmail: null, supportPhone: null }),
      [],
      []
    )
    expect(result.reasons).toContain('Business has no verified contact')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for active complaints', () => {
    const complaints: RiskScoreComplaint[] = [{ status: 'OPEN' }, { status: 'IN_REVIEW' }]
    const result = calculateBusinessRiskScore(baseBusiness(), complaints, [])
    expect(result.reasons).toContain('2 active complaint(s)')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for active fraud flags', () => {
    const flags: RiskScoreFraudFlag[] = [{ status: 'OPEN' }, { status: 'OPEN' }]
    const result = calculateBusinessRiskScore(baseBusiness(), [], flags)
    expect(result.reasons).toContain('2 active fraud flag(s)')
    expect(result.score).toBeGreaterThan(0)
  })

  it('adds risk for young business age', () => {
    const result = calculateBusinessRiskScore(
      baseBusiness({ createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }),
      [],
      []
    )
    expect(result.reasons).toContain('Business is less than 7 days old')
    expect(result.score).toBeGreaterThan(0)
  })

  it('caps the score at 100 and aggregates all factors', () => {
    const complaints: RiskScoreComplaint[] = Array.from({ length: 10 }, () => ({ status: 'OPEN' }))
    const flags: RiskScoreFraudFlag[] = Array.from({ length: 10 }, () => ({ status: 'OPEN' }))
    const result = calculateBusinessRiskScore(
      baseBusiness({
        status: 'PENDING',
        placesCount: 0,
        isVerified: false,
        supportEmail: null,
        supportPhone: null,
        createdAt: new Date(now.getTime() - 1000),
      }),
      complaints,
      flags
    )
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBe(95)
    expect(result.reasons).toHaveLength(6)
  })
})
