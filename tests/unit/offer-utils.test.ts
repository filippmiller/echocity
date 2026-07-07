import { describe, it, expect } from 'vitest'
import { getBenefitBadge, getEstimatedSavings, buildYandexMapsRouteUrl } from '@/lib/offer-utils'

describe('lib/offer-utils', () => {
  describe('getBenefitBadge', () => {
    it('renders percent discount', () => {
      expect(getBenefitBadge('PERCENT', 20)).toBe('-20%')
    })

    it('renders fixed amount discount with ruble sign', () => {
      expect(getBenefitBadge('FIXED_AMOUNT', 150)).toBe('-150₽')
    })

    it('renders fixed price', () => {
      expect(getBenefitBadge('FIXED_PRICE', 199)).toBe('199₽')
    })

    it('renders free item label', () => {
      expect(getBenefitBadge('FREE_ITEM', 0)).toBe('Бесплатно')
    })

    it('renders bundle label', () => {
      expect(getBenefitBadge('BUNDLE', 0)).toBe('Комплект')
    })

    it('renders mystery bag label', () => {
      expect(getBenefitBadge('MYSTERY_BAG', 0)).toBe('Сюрприз')
    })
  })

  describe('getEstimatedSavings', () => {
    it('returns fixed amount as savings', () => {
      expect(getEstimatedSavings('FIXED_AMOUNT', 250)).toBe(250)
    })

    it('rounds fixed amount savings', () => {
      expect(getEstimatedSavings('FIXED_AMOUNT', 249.7)).toBe(250)
    })

    it('computes mystery bag savings from original and sale price', () => {
      expect(getEstimatedSavings('MYSTERY_BAG', 300, { originalValue: 1000 })).toBe(700)
    })

    it('returns null when mystery bag metadata is missing', () => {
      expect(getEstimatedSavings('MYSTERY_BAG', 300)).toBeNull()
    })

    it('returns null when original value is not greater than sale price', () => {
      expect(getEstimatedSavings('MYSTERY_BAG', 500, { originalValue: 400 })).toBeNull()
    })

    it('parses originalValue from string metadata', () => {
      expect(getEstimatedSavings('MYSTERY_BAG', 200, { originalValue: '800' })).toBe(600)
    })

    it('returns null for percent discounts without anchor price', () => {
      expect(getEstimatedSavings('PERCENT', 20)).toBeNull()
    })

    it('returns null for free items', () => {
      expect(getEstimatedSavings('FREE_ITEM', 0)).toBeNull()
    })
  })

  describe('buildYandexMapsRouteUrl', () => {
    it('builds a web route URL with coordinates', () => {
      const url = buildYandexMapsRouteUrl(59.9343, 30.3351)
      expect(url).toBe('https://yandex.ru/maps/?rtext=~59.9343%2C30.3351')
    })

    it('appends address text when provided', () => {
      const url = buildYandexMapsRouteUrl(59.9343, 30.3351, 'Невский проспект, 1')
      expect(url).toContain('rtext=~59.9343%2C30.3351')
      expect(url).toContain('text=%D0%9D%D0%B5%D0%B2%D1%81%D0%BA%D0%B8%D0%B9%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%2C%201')
    })

    it('handles negative coordinates', () => {
      const url = buildYandexMapsRouteUrl(-33.8688, 151.2093)
      expect(url).toContain('rtext=~-33.8688%2C151.2093')
    })
  })
})
