import { describe, it, expect } from 'vitest'

/**
 * Schema smoke tests: verify that Prisma-generated enums exist
 * and contain the expected values. This catches schema drift —
 * if someone removes an enum value the test will fail immediately.
 */

// We import the enums directly from @prisma/client.
// If prisma generate hasn't been run, these imports will fail,
// which is itself a useful signal.
import {
  Role,
  OfferType,
  BenefitType,
  OfferVisibility,
  OfferApprovalStatus,
  OfferLifecycleStatus,
  RedemptionChannel,
  ReservationStatus,
  BundleStatus,
  MissionType,
  MissionStatus,
  StoryMediaType,
  SubscriptionStatus,
  BusinessType,
  BusinessStatus,
  DemandStatus,
  RedemptionStatus,
  OfferRuleType,
} from '@prisma/client'

describe('Prisma Enums — Role', () => {
  it('contains ADMIN, CITIZEN, BUSINESS_OWNER, MERCHANT_STAFF', () => {
    expect(Role.ADMIN).toBe('ADMIN')
    expect(Role.CITIZEN).toBe('CITIZEN')
    expect(Role.BUSINESS_OWNER).toBe('BUSINESS_OWNER')
    expect(Role.MERCHANT_STAFF).toBe('MERCHANT_STAFF')
  })

  it('has exactly 4 values', () => {
    const values = Object.values(Role)
    expect(values).toHaveLength(4)
  })
})

describe('Prisma Enums — OfferType', () => {
  const expected = [
    'PERCENT_DISCOUNT',
    'FIXED_PRICE',
    'FREE_ITEM',
    'BUNDLE',
    'FIRST_VISIT',
    'OFF_PEAK',
    'FLASH',
    'REQUEST_ONLY',
    'MYSTERY_BAG',
  ]

  it('contains all 9 offer types', () => {
    for (const val of expected) {
      expect(OfferType).toHaveProperty(val)
    }
  })

  it('has exactly 9 values', () => {
    expect(Object.values(OfferType)).toHaveLength(9)
  })
})

describe('Prisma Enums — BenefitType', () => {
  const expected = ['PERCENT', 'FIXED_AMOUNT', 'FIXED_PRICE', 'FREE_ITEM', 'BUNDLE', 'MYSTERY_BAG']

  it('contains all benefit types', () => {
    for (const val of expected) {
      expect(BenefitType).toHaveProperty(val)
    }
  })

  it('has exactly 6 values', () => {
    expect(Object.values(BenefitType)).toHaveLength(6)
  })
})

describe('Prisma Enums — OfferVisibility', () => {
  it('contains PUBLIC, MEMBERS_ONLY, FREE_FOR_ALL', () => {
    expect(OfferVisibility.PUBLIC).toBe('PUBLIC')
    expect(OfferVisibility.MEMBERS_ONLY).toBe('MEMBERS_ONLY')
    expect(OfferVisibility.FREE_FOR_ALL).toBe('FREE_FOR_ALL')
  })
})

describe('Prisma Enums — OfferApprovalStatus', () => {
  it('contains DRAFT, PENDING, APPROVED, REJECTED', () => {
    expect(OfferApprovalStatus.DRAFT).toBe('DRAFT')
    expect(OfferApprovalStatus.PENDING).toBe('PENDING')
    expect(OfferApprovalStatus.APPROVED).toBe('APPROVED')
    expect(OfferApprovalStatus.REJECTED).toBe('REJECTED')
  })
})

describe('Prisma Enums — OfferLifecycleStatus', () => {
  const expected = ['INACTIVE', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED']

  it('contains all lifecycle statuses', () => {
    for (const val of expected) {
      expect(OfferLifecycleStatus).toHaveProperty(val)
    }
  })

  it('has exactly 6 values', () => {
    expect(Object.values(OfferLifecycleStatus)).toHaveLength(6)
  })
})

describe('Prisma Enums — RedemptionChannel', () => {
  it('contains IN_STORE, ONLINE, BOTH', () => {
    expect(RedemptionChannel.IN_STORE).toBe('IN_STORE')
    expect(RedemptionChannel.ONLINE).toBe('ONLINE')
    expect(RedemptionChannel.BOTH).toBe('BOTH')
  })
})

describe('Prisma Enums — ReservationStatus', () => {
  const expected = ['PENDING', 'CONFIRMED', 'CANCELED', 'NO_SHOW', 'COMPLETED']

  it('contains all reservation statuses', () => {
    for (const val of expected) {
      expect(ReservationStatus).toHaveProperty(val)
    }
  })

  it('has exactly 5 values', () => {
    expect(Object.values(ReservationStatus)).toHaveLength(5)
  })
})

describe('Prisma Enums — BundleStatus', () => {
  const expected = ['DRAFT', 'PENDING_PARTNERS', 'ACTIVE', 'PAUSED', 'EXPIRED']

  it('contains all bundle statuses', () => {
    for (const val of expected) {
      expect(BundleStatus).toHaveProperty(val)
    }
  })

  it('has exactly 5 values', () => {
    expect(Object.values(BundleStatus)).toHaveLength(5)
  })
})

describe('Prisma Enums — MissionType', () => {
  const expected = [
    'FIRST_REDEMPTION',
    'REDEEM_COUNT',
    'VISIT_PLACES',
    'REFER_FRIENDS',
    'WRITE_REVIEWS',
    'STREAK_DAYS',
    'SAVE_AMOUNT',
    'EXPLORE_CATEGORIES',
  ]

  it('contains all mission types', () => {
    for (const val of expected) {
      expect(MissionType).toHaveProperty(val)
    }
  })

  it('has exactly 8 values', () => {
    expect(Object.values(MissionType)).toHaveLength(8)
  })
})

describe('Prisma Enums — MissionStatus', () => {
  it('contains ACTIVE, COMPLETED, EXPIRED', () => {
    expect(MissionStatus.ACTIVE).toBe('ACTIVE')
    expect(MissionStatus.COMPLETED).toBe('COMPLETED')
    expect(MissionStatus.EXPIRED).toBe('EXPIRED')
  })
})

describe('Prisma Enums — StoryMediaType', () => {
  it('contains IMAGE and VIDEO', () => {
    expect(StoryMediaType.IMAGE).toBe('IMAGE')
    expect(StoryMediaType.VIDEO).toBe('VIDEO')
  })

  it('has exactly 2 values', () => {
    expect(Object.values(StoryMediaType)).toHaveLength(2)
  })
})

describe('Prisma Enums — SubscriptionStatus', () => {
  const expected = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED']

  it('contains all subscription statuses', () => {
    for (const val of expected) {
      expect(SubscriptionStatus).toHaveProperty(val)
    }
  })
})

describe('Prisma Enums — BusinessType', () => {
  const expected = ['CAFE', 'RESTAURANT', 'BAR', 'BEAUTY', 'NAILS', 'HAIR', 'DRYCLEANING', 'OTHER']

  it('contains all business types', () => {
    for (const val of expected) {
      expect(BusinessType).toHaveProperty(val)
    }
  })

  it('has exactly 8 values', () => {
    expect(Object.values(BusinessType)).toHaveLength(8)
  })
})

describe('Prisma Enums — BusinessStatus', () => {
  it('contains PENDING, APPROVED, REJECTED, SUSPENDED', () => {
    expect(BusinessStatus.PENDING).toBe('PENDING')
    expect(BusinessStatus.APPROVED).toBe('APPROVED')
    expect(BusinessStatus.REJECTED).toBe('REJECTED')
    expect(BusinessStatus.SUSPENDED).toBe('SUSPENDED')
  })
})

describe('Prisma Enums — DemandStatus', () => {
  it('contains OPEN, COLLECTING, FULFILLED, EXPIRED', () => {
    expect(DemandStatus.OPEN).toBe('OPEN')
    expect(DemandStatus.COLLECTING).toBe('COLLECTING')
    expect(DemandStatus.FULFILLED).toBe('FULFILLED')
    expect(DemandStatus.EXPIRED).toBe('EXPIRED')
  })
})

describe('Prisma Enums — RedemptionStatus', () => {
  it('contains SUCCESS, REJECTED, REVERSED, FRAUD_SUSPECTED', () => {
    expect(RedemptionStatus.SUCCESS).toBe('SUCCESS')
    expect(RedemptionStatus.REJECTED).toBe('REJECTED')
    expect(RedemptionStatus.REVERSED).toBe('REVERSED')
    expect(RedemptionStatus.FRAUD_SUSPECTED).toBe('FRAUD_SUSPECTED')
  })
})

describe('Prisma Enums — OfferRuleType', () => {
  const expected = [
    'FIRST_TIME_ONLY',
    'ONCE_PER_DAY',
    'ONCE_PER_WEEK',
    'ONCE_PER_MONTH',
    'ONCE_PER_LIFETIME',
    'MIN_CHECK',
    'GEO_RADIUS',
    'EXCLUDED_CATEGORIES',
    'ALLOWED_CATEGORIES',
    'MIN_PARTY_SIZE',
  ]

  it('contains all rule types', () => {
    for (const val of expected) {
      expect(OfferRuleType).toHaveProperty(val)
    }
  })

  it('has exactly 10 values', () => {
    expect(Object.values(OfferRuleType)).toHaveLength(10)
  })
})
