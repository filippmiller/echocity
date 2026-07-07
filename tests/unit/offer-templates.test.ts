import { describe, it, expect } from 'vitest'
import { OFFER_TEMPLATES } from '@/lib/offer-templates'

describe('OFFER_TEMPLATES', () => {
  it('has at least one template per supported niche', () => {
    const niches = ['CAFE', 'RESTAURANT', 'BAR', 'BEAUTY', 'NAILS', 'HAIR', 'DRYCLEANING']
    for (const niche of niches) {
      const matches = OFFER_TEMPLATES.filter((t) => t.niche === niche || t.niche === 'ALL')
      expect(matches.length).toBeGreaterThan(0)
    }
  })

  it('every template has required defaults', () => {
    for (const template of OFFER_TEMPLATES) {
      expect(template.id).toBeTruthy()
      expect(template.name).toBeTruthy()
      expect(template.defaults.title).toContain('{value}')
      expect(template.defaults.offerType).toBeTruthy()
      expect(template.defaults.benefitType).toBeTruthy()
      expect(template.defaults.benefitValue).toBeGreaterThan(0)
      expect(template.defaults.visibility).toBeTruthy()
      expect(template.defaults.redemptionChannel).toBeTruthy()
    }
  })

  it('filters templates by niche', () => {
    const cafeTemplates = OFFER_TEMPLATES.filter((t) => t.niche === 'ALL' || t.niche === 'CAFE')
    expect(cafeTemplates.some((t) => t.id === 'cafe-happy-hours')).toBe(true)
    expect(cafeTemplates.some((t) => t.id === 'nails-combo')).toBe(false)
  })
})
