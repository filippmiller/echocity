export function sanitizeYandexRedirect(redirectTo?: string): string {
  if (!redirectTo) return '/dashboard'
  if (!redirectTo.startsWith('/')) return '/dashboard'
  if (redirectTo.startsWith('//')) return '/dashboard'
  return redirectTo
}
