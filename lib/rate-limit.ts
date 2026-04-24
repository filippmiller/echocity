type RateLimitRule = {
  key: string
  limit: number
  windowMs: number
}

type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

type Bucket = {
  count: number
  resetAt: number
}

declare global {
   
  var __cityechoRateLimitStore: Map<string, Bucket> | undefined
}

const store = globalThis.__cityechoRateLimitStore ?? new Map<string, Bucket>()
globalThis.__cityechoRateLimitStore = store

let pruneCursor = 0

function getBucket(cacheKey: string, now: number, windowMs: number): Bucket {
  const existing = store.get(cacheKey)
  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + windowMs }
    store.set(cacheKey, fresh)
    return fresh
  }

  return existing
}

function pruneExpired(now: number) {
  pruneCursor += 1
  if (pruneCursor % 100 !== 0) return

  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key)
    }
  }
}

export function consumeRateLimit(rule: RateLimitRule, actorId: string, now = Date.now()): RateLimitResult {
  pruneExpired(now)

  const cacheKey = `${rule.key}:${actorId}`
  const bucket = getBucket(cacheKey, now, rule.windowMs)
  bucket.count += 1

  const remaining = Math.max(rule.limit - bucket.count, 0)
  const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1)

  return {
    allowed: bucket.count <= rule.limit,
    limit: rule.limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds,
  }
}

export function resetRateLimitStore() {
  store.clear()
  pruneCursor = 0
}

export type { RateLimitRule, RateLimitResult }
