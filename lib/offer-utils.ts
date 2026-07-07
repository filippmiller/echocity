/**
 * Shared offer utility functions.
 * Use these instead of duplicating across components.
 */

export function getBenefitBadge(benefitType: string, benefitValue: number): string {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${Math.round(benefitValue)}\u20BD`
    case 'FIXED_PRICE': return `${Math.round(benefitValue)}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    case 'MYSTERY_BAG': return 'Сюрприз'
    default: return `${benefitValue}`
  }
}

/**
 * Compute estimated ruble savings for an offer.
 * Returns null when savings cannot be estimated from available data.
 *
 * Supported:
 * - FIXED_AMOUNT: savings equals the fixed amount.
 * - MYSTERY_BAG: savings = originalValue - salePrice when both present.
 * - FIXED_PRICE: savings = originalValue - fixedPrice when both present.
 * - PERCENT: savings = originalValue * percent / 100 when originalValue present.
 * - FREE_ITEM: savings = itemValue when present in metadata.
 */
export function getEstimatedSavings(
  benefitType: string,
  benefitValue: number,
  metadata?: unknown
): number | null {
  switch (benefitType) {
    case 'FIXED_AMOUNT':
      return Math.round(benefitValue)
    case 'FIXED_PRICE': {
      const originalValue = extractMetadataNumber(metadata, 'originalValue')
      if (originalValue != null && benefitValue != null && originalValue > benefitValue) {
        return Math.round(originalValue - benefitValue)
      }
      return null
    }
    case 'PERCENT': {
      const originalValue = extractMetadataNumber(metadata, 'originalValue')
      if (originalValue != null && benefitValue != null && benefitValue > 0 && benefitValue <= 100) {
        return Math.round((originalValue * benefitValue) / 100)
      }
      return null
    }
    case 'FREE_ITEM': {
      const itemValue = extractMetadataNumber(metadata, 'itemValue')
      if (itemValue != null && itemValue > 0) {
        return Math.round(itemValue)
      }
      return null
    }
    case 'MYSTERY_BAG': {
      const originalValue = extractMetadataNumber(metadata, 'originalValue')
      if (originalValue != null && benefitValue != null && originalValue > benefitValue) {
        return Math.round(originalValue - benefitValue)
      }
      return null
    }
    default:
      return null
  }
}

/**
 * Format a ruble amount for display.
 */
export function formatPrice(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU').replace(/\u00A0/g, ' ')} ₽`
}

/**
 * Extract the original/current price pair from offer metadata when available.
 * Returns null if the data is missing or nonsensical.
 */
export function getPricePair(
  benefitType: string,
  benefitValue: number,
  metadata?: unknown
): { original: number; current: number } | null {
  switch (benefitType) {
    case 'FIXED_PRICE': {
      const originalValue = extractMetadataNumber(metadata, 'originalValue')
      if (originalValue != null && benefitValue != null && originalValue > benefitValue) {
        return { original: originalValue, current: benefitValue }
      }
      return null
    }
    case 'MYSTERY_BAG': {
      const originalValue = extractMetadataNumber(metadata, 'originalValue')
      if (originalValue != null && benefitValue != null && originalValue > benefitValue) {
        return { original: originalValue, current: benefitValue }
      }
      return null
    }
    case 'PERCENT': {
      const originalValue = extractMetadataNumber(metadata, 'originalValue')
      if (originalValue != null && benefitValue != null && benefitValue > 0 && benefitValue <= 100) {
        return { original: originalValue, current: Math.round(originalValue * (1 - benefitValue / 100)) }
      }
      return null
    }
    default:
      return null
  }
}

function extractMetadataNumber(metadata: unknown, key: string): number | null {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const value = (metadata as Record<string, unknown>)[key]
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
  }
  return null
}

/**
 * Build a Yandex Maps route URL.
 * Prefers the native yandexmaps:// scheme on mobile when coordinates are known,
 * falling back to the web URL.
 */
export function buildYandexMapsRouteUrl(
  lat: number,
  lng: number,
  address?: string | null
): string {
  const rtext = `~${lat},${lng}`
  // Web URL works everywhere; native scheme is handled by the OS on mobile.
  const webUrl = `https://yandex.ru/maps/?rtext=${encodeURIComponent(rtext)}`
  if (address) {
    return `${webUrl}&text=${encodeURIComponent(address)}`
  }
  return webUrl
}
