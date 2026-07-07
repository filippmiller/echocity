import { describe, it, expect } from 'vitest'
import { getOfferRecommendations } from '@/lib/offer-recommendations'

const base = {
  title: 'Скидка 20% на всё меню',
  description: 'Акция действует каждый день в нашем заведении для всех гостей.',
  termsText: 'Не суммируется с другими предложениями.',
  imageUrl: 'https://example.com/image.jpg',
  benefitType: 'PERCENT',
  benefitValue: 20,
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
}

describe('getOfferRecommendations', () => {
  it('returns no recommendations for a strong offer', () => {
    const recs = getOfferRecommendations({ ...base, categoryAverageDiscount: 15 })
    expect(recs).toHaveLength(0)
  })

  it('warns about a short title', () => {
    const recs = getOfferRecommendations({ ...base, title: 'Скидка' })
    expect(recs.some((r) => r.type === 'warning' && r.message.includes('Название'))).toBe(true)
  })

  it('warns when discount is below category average', () => {
    const recs = getOfferRecommendations({ ...base, benefitValue: 10, categoryAverageDiscount: 25 })
    const warning = recs.find((r) => r.type === 'warning')
    expect(warning).toBeDefined()
    expect(warning!.message).toContain('ниже средней по категории')
  })

  it('tips about missing description', () => {
    const recs = getOfferRecommendations({ ...base, description: '' })
    expect(recs.some((r) => r.type === 'tip' && r.message.includes('описание'))).toBe(true)
  })

  it('tips about missing terms', () => {
    const recs = getOfferRecommendations({ ...base, termsText: '' })
    expect(recs.some((r) => r.type === 'tip' && r.message.includes('условия'))).toBe(true)
  })

  it('tips about missing image', () => {
    const recs = getOfferRecommendations({ ...base, imageUrl: '' })
    expect(recs.some((r) => r.type === 'tip' && r.message.includes('изображение'))).toBe(true)
  })

  it('tips about short duration', () => {
    const endAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const recs = getOfferRecommendations({ ...base, endAt })
    expect(recs.some((r) => r.type === 'tip' && r.message.includes('Срок действия'))).toBe(true)
  })

  it('tips when end date is missing', () => {
    const recs = getOfferRecommendations({ ...base, endAt: undefined })
    expect(recs.some((r) => r.type === 'tip' && r.message.includes('срок действия'))).toBe(true)
  })
})
