export type OnboardingSource = 'telegram' | 'referral' | 'organic' | 'direct'

export function detectSource(): OnboardingSource {
  if (typeof window === 'undefined') return 'direct'
  const params = new URLSearchParams(window.location.search)
  if (params.get('utm_source') === 'telegram' || params.get('from') === 'tg') return 'telegram'
  if (params.get('ref') || params.get('referral')) return 'referral'
  if (document.referrer && !document.referrer.includes(window.location.hostname)) return 'organic'
  return 'direct'
}
