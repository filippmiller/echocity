import { describe, it, expect } from 'vitest'
import { createOfferSchema } from '@/modules/offers/validation'

/**
 * Helper that builds a minimal valid offer payload.
 * Tests override individual fields to check validation.
 */
function validOfferPayload(overrides: Record<string, any> = {}) {
  return {
    merchantId: 'merchant-1',
    branchId: 'branch-1',
    title: 'Free Coffee Monday',
    offerType: 'PERCENT_DISCOUNT' as const,
    benefitType: 'PERCENT' as const,
    benefitValue: 15,
    startAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('offers/validation — createOfferSchema', () => {
  describe('valid payloads', () => {
    it('passes with minimal required fields', () => {
      const result = createOfferSchema.safeParse(validOfferPayload())
      expect(result.success).toBe(true)
    })

    it('passes with all optional fields populated', () => {
      const result = createOfferSchema.safeParse(
        validOfferPayload({
          subtitle: 'A great deal',
          description: 'Enjoy a discount on your order.',
          visibility: 'MEMBERS_ONLY',
          currency: 'RUB',
          minOrderAmount: 500,
          maxDiscountAmount: 200,
          endAt: new Date(Date.now() + 86400000).toISOString(),
          termsText: 'Some terms',
          imageUrl: 'https://example.com/image.jpg',
          redemptionChannel: 'BOTH',
          onlineUrl: 'https://example.com/redeem',
          promoCode: 'SAVE15',
          schedules: [{ weekday: 1, startTime: '09:00', endTime: '17:00' }],
          blackoutDates: [{ date: new Date().toISOString(), reason: 'Holiday' }],
          rules: [{ ruleType: 'FIRST_TIME_ONLY' }],
          limits: { dailyLimit: 100, perUserDailyLimit: 1 },
        }),
      )
      expect(result.success).toBe(true)
    })

    it('accepts all valid offerType values', () => {
      const types = [
        'PERCENT_DISCOUNT',
        'FIXED_PRICE',
        'FREE_ITEM',
        'BUNDLE',
        'FIRST_VISIT',
        'OFF_PEAK',
        'FLASH',
        'REQUEST_ONLY',
      ]
      for (const offerType of types) {
        const result = createOfferSchema.safeParse(validOfferPayload({ offerType }))
        expect(result.success, `offerType "${offerType}" should be valid`).toBe(true)
      }
    })

    it('accepts all valid benefitType values', () => {
      const types = ['PERCENT', 'FIXED_AMOUNT', 'FIXED_PRICE', 'FREE_ITEM', 'BUNDLE']
      for (const benefitType of types) {
        const result = createOfferSchema.safeParse(validOfferPayload({ benefitType }))
        expect(result.success, `benefitType "${benefitType}" should be valid`).toBe(true)
      }
    })
  })

  describe('missing required fields', () => {
    it('fails when title is missing', () => {
      const payload = validOfferPayload()
      delete payload.title
      const result = createOfferSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('fails when merchantId is missing', () => {
      const payload = validOfferPayload()
      delete payload.merchantId
      const result = createOfferSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('fails when branchId is missing', () => {
      const payload = validOfferPayload()
      delete payload.branchId
      const result = createOfferSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('fails when offerType is missing', () => {
      const payload = validOfferPayload()
      delete payload.offerType
      const result = createOfferSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('fails when benefitType is missing', () => {
      const payload = validOfferPayload()
      delete payload.benefitType
      const result = createOfferSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('fails when benefitValue is missing', () => {
      const payload = validOfferPayload()
      delete payload.benefitValue
      const result = createOfferSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('fails when startAt is missing', () => {
      const payload = validOfferPayload()
      delete payload.startAt
      const result = createOfferSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })

  describe('invalid field values', () => {
    it('fails when offerType is invalid', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ offerType: 'BOGUS_TYPE' }))
      expect(result.success).toBe(false)
    })

    it('fails when benefitType is invalid', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ benefitType: 'MAGIC' }))
      expect(result.success).toBe(false)
    })

    it('fails when benefitValue is negative', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ benefitValue: -10 }))
      expect(result.success).toBe(false)
    })

    it('fails when benefitValue is zero', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ benefitValue: 0 }))
      expect(result.success).toBe(false)
    })

    it('fails when benefitValue is not a number', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ benefitValue: 'ten' }))
      expect(result.success).toBe(false)
    })

    it('fails when title is too short (< 3 chars)', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ title: 'AB' }))
      expect(result.success).toBe(false)
    })

    it('fails when title exceeds 100 chars', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ title: 'A'.repeat(101) }))
      expect(result.success).toBe(false)
    })

    it('fails when subtitle exceeds 200 chars', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ subtitle: 'B'.repeat(201) }))
      expect(result.success).toBe(false)
    })

    it('fails when startAt is not a valid datetime', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ startAt: 'not-a-date' }))
      expect(result.success).toBe(false)
    })

    it('fails when visibility is invalid', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ visibility: 'PRIVATE' }))
      expect(result.success).toBe(false)
    })

    it('fails when redemptionChannel is invalid', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ redemptionChannel: 'CARRIER_PIGEON' }))
      expect(result.success).toBe(false)
    })

    it('fails when imageUrl is not a valid URL', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ imageUrl: 'not-a-url' }))
      expect(result.success).toBe(false)
    })

    it('fails when schedule weekday is out of range', () => {
      const result = createOfferSchema.safeParse(
        validOfferPayload({ schedules: [{ weekday: 7, startTime: '09:00', endTime: '17:00' }] }),
      )
      expect(result.success).toBe(false)
    })

    it('fails when schedule time format is wrong', () => {
      const result = createOfferSchema.safeParse(
        validOfferPayload({ schedules: [{ weekday: 1, startTime: '9am', endTime: '5pm' }] }),
      )
      expect(result.success).toBe(false)
    })

    it('fails when minOrderAmount is negative', () => {
      const result = createOfferSchema.safeParse(validOfferPayload({ minOrderAmount: -100 }))
      expect(result.success).toBe(false)
    })
  })

  describe('defaults', () => {
    it('defaults visibility to PUBLIC', () => {
      const result = createOfferSchema.safeParse(validOfferPayload())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.visibility).toBe('PUBLIC')
      }
    })

    it('defaults currency to RUB', () => {
      const result = createOfferSchema.safeParse(validOfferPayload())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('RUB')
      }
    })

    it('defaults redemptionChannel to IN_STORE', () => {
      const result = createOfferSchema.safeParse(validOfferPayload())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.redemptionChannel).toBe('IN_STORE')
      }
    })
  })
})
