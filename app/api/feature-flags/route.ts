import { NextResponse } from 'next/server'
import { getPublicFeatureFlags } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

/**
 * Public feature flags endpoint.
 * Returns non-sensitive flag key + enabled state only.
 * No authentication required; cached for a short time by CDN if present.
 */
export async function GET() {
  try {
    const flags = await getPublicFeatureFlags()
    return NextResponse.json(
      { flags },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      }
    )
  } catch {
    // Fail closed: return empty flags rather than expose errors.
    return NextResponse.json(
      { flags: [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}
