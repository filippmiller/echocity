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
    default: return `${benefitValue}`
  }
}
