export interface OfferRecommendation {
  type: 'warning' | 'tip'
  message: string
}

export interface RecommendationInput {
  title: string
  description: string
  termsText: string
  imageUrl: string
  benefitType: string
  benefitValue: number
  startAt: string
  endAt?: string
  categoryAverageDiscount?: number
}

const MIN_TITLE_LENGTH = 10
const MIN_DESCRIPTION_LENGTH = 20
const MIN_TERMS_LENGTH = 10
const MIN_DURATION_DAYS = 7

/**
 * Returns non-blocking recommendations to help merchants publish a high-quality offer.
 * Warnings signal likely moderation/performance issues; tips are improvements.
 */
export function getOfferRecommendations(input: RecommendationInput): OfferRecommendation[] {
  const recommendations: OfferRecommendation[] = []

  if (!input.title || input.title.trim().length < MIN_TITLE_LENGTH) {
    recommendations.push({
      type: 'warning',
      message: `Название слишком короткое. Опишите предложение понятнее (минимум ${MIN_TITLE_LENGTH} символов).`,
    })
  }

  if (!input.description || input.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    recommendations.push({
      type: 'tip',
      message: 'Добавьте описание: что входит в акцию, почему она выгодна клиенту.',
    })
  }

  if (!input.termsText || input.termsText.trim().length < MIN_TERMS_LENGTH) {
    recommendations.push({
      type: 'tip',
      message: 'Укажите условия использования: время, ограничения, исключения.',
    })
  }

  if (!input.imageUrl || !input.imageUrl.trim()) {
    recommendations.push({
      type: 'tip',
      message: 'Добавьте изображение — предложения с фото получают больше внимания.',
    })
  }

  const start = input.startAt ? new Date(input.startAt) : null
  const end = input.endAt ? new Date(input.endAt) : null
  if (!end || !start || isNaN(start.getTime()) || isNaN(end.getTime())) {
    recommendations.push({
      type: 'tip',
      message: `Укажите срок действия акции. Рекомендуем не менее ${MIN_DURATION_DAYS} дней.`,
    })
  } else {
    const durationDays = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    if (durationDays < MIN_DURATION_DAYS) {
      recommendations.push({
        type: 'tip',
        message: `Срок действия акции короткий (${durationDays} дн.). Рекомендуем минимум ${MIN_DURATION_DAYS} дней для охвата аудитории.`,
      })
    }
  }

  if (
    input.benefitType === 'PERCENT' &&
    typeof input.categoryAverageDiscount === 'number' &&
    input.categoryAverageDiscount > 0 &&
    input.benefitValue < input.categoryAverageDiscount
  ) {
    recommendations.push({
      type: 'warning',
      message: `Ваша скидка (${input.benefitValue}%) ниже средней по категории (${input.categoryAverageDiscount}%). Увеличьте выгоду, чтобы привлечь больше клиентов.`,
    })
  }

  return recommendations
}
