/**
 * Pure helpers for review anti-fraud checks.
 */

export function getAllowedStoragePrefixes(): string[] {
  return [process.env.MINIO_PUBLIC_BASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map((value) => value.replace(/\/$/, ''))
}

export function isOwnStorageUrl(url: string, prefixes: string[]): boolean {
  if (!url || !prefixes.length) return false
  return prefixes.some((prefix) => url.startsWith(prefix))
}

export function hasRecentReview(
  latestReview: { createdAt: Date } | null | undefined,
  now: Date,
  windowMs = 24 * 60 * 60 * 1000
): boolean {
  if (!latestReview) return false
  return now.getTime() - new Date(latestReview.createdAt).getTime() < windowMs
}
