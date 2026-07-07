import { useEffect, useState } from 'react'
import type { FeatureFlagKey } from '@/lib/feature-flags'

interface UseFeatureFlagResult {
  enabled: boolean
  loading: boolean
  error: boolean
}

let cachedFlags: Array<{ key: FeatureFlagKey; enabled: boolean; description: string }> | null = null
let cachePromise: Promise<void> | null = null

async function fetchFlags(): Promise<void> {
  const res = await fetch('/api/feature-flags')
  if (!res.ok) {
    cachedFlags = []
    return
  }
  const data = await res.json()
  cachedFlags = Array.isArray(data.flags) ? data.flags : []
}

function ensureFlags(): Promise<void> {
  if (cachedFlags !== null) {
    return Promise.resolve()
  }
  if (!cachePromise) {
    cachePromise = fetchFlags().finally(() => {
      cachePromise = null
    })
  }
  return cachePromise
}

/**
 * Client-side feature flag hook. Fetches flags from /api/feature-flags once
 * per session and returns whether the requested flag is enabled.
 *
 * Unknown or disabled flags fail closed (enabled=false).
 */
export function useFeatureFlag(key: FeatureFlagKey): UseFeatureFlagResult {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    ensureFlags()
      .then(() => {
        if (cancelled) return
        const flag = cachedFlags?.find((f) => f.key === key)
        setEnabled(flag?.enabled ?? false)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setEnabled(false)
        setError(true)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [key])

  return { enabled, loading, error }
}

/**
 * Reset in-memory flag cache. Useful in tests.
 */
export function resetFeatureFlagCache(): void {
  cachedFlags = null
  cachePromise = null
}
