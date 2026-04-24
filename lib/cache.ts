type CacheEntry<T> = { data: T; expiresAt: number }

declare global {
   
  var __appCache: Map<string, CacheEntry<unknown>> | undefined
}

const store = globalThis.__appCache ?? new Map<string, CacheEntry<unknown>>()
globalThis.__appCache = store

/** Get a cached value, or compute and cache it with the given TTL (ms). */
export async function cached<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const existing = store.get(key) as CacheEntry<T> | undefined
  if (existing && existing.expiresAt > now) {
    return existing.data
  }

  const data = await compute()
  store.set(key, { data, expiresAt: now + ttlMs })
  return data
}

/** Invalidate a specific cache key or all keys matching a prefix. */
export function invalidateCache(keyOrPrefix: string) {
  if (store.has(keyOrPrefix)) {
    store.delete(keyOrPrefix)
    return
  }
  // Prefix match
  for (const key of store.keys()) {
    if (key.startsWith(keyOrPrefix)) store.delete(key)
  }
}
