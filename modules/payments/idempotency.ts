/**
 * Sprint B.1 — Deterministic idempotence for payment and cron operations.
 *
 * Design:
 *   - Key is derived from scope + a canonical JSON serialisation of the
 *     "logical intent" (e.g. userId, planCode, amount). Same intent →
 *     same key across retries → no duplicate charge.
 *   - Before running the side-effect we insert a row with status
 *     IN_PROGRESS; concurrent duplicates see that row and either wait
 *     (cooperative) or fail-fast (the caller decides).
 *   - On success we UPDATE status=COMPLETED and store the response JSON,
 *     so a late retry returns the cached result without re-calling the
 *     downstream API.
 *   - On failure we UPDATE status=FAILED; a retry policy at the caller
 *     can delete the FAILED row and try again after a backoff.
 *   - A 24-hour TTL lets a background sweep reclaim rows; we never rely
 *     on the TTL for correctness, only storage hygiene.
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000

export type IdempotencyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

/**
 * Canonical-JSON-stable SHA-256 of the intent object, prefixed with `scope:`.
 *
 * IMPORTANT: the intent must be derived from the LOGICAL operation, not
 * the entire request payload. For createPayment we use:
 *   { userId, planCode, amount, currency, nonce? }
 * where `nonce` is OPTIONAL and lets callers intentionally create a
 * distinct key when they want a truly-new attempt (e.g. user clicked
 * "pay again after failure"). Do NOT include timestamps — they would
 * make every call a fresh key and defeat the whole mechanism.
 */
export function deriveIdempotenceKey(scope: string, intent: Record<string, unknown>): string {
  const canonical = canonicalise(intent)
  const h = crypto.createHash('sha256').update(`${scope}:${canonical}`).digest('hex')
  return h
}

/** Sort keys recursively so { a:1, b:2 } and { b:2, a:1 } hash identically. */
function canonicalise(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(canonicalise).join(',')}]`
  const obj = v as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalise(obj[k])}`).join(',')}}`
}

export type IdempotencyRecord = {
  scope: string
  key: string
  status: IdempotencyStatus
  response: unknown
}

/**
 * Attempt to claim an idempotency slot. Returns:
 *   - { kind: 'claimed', key } — caller should execute the operation
 *   - { kind: 'in-progress', key } — another worker is executing; caller should
 *     either wait or return a generic "try again" to the user
 *   - { kind: 'completed', key, response } — cached result; return it directly
 *   - { kind: 'failed', key } — previous attempt failed; caller can retry
 *     (we do NOT delete here; the caller decides to retry and calls {@link resetIdempotency})
 */
export async function claimIdempotency(
  scope: string,
  intent: Record<string, unknown>,
): Promise<
  | { kind: 'claimed'; key: string }
  | { kind: 'in-progress'; key: string }
  | { kind: 'completed'; key: string; response: unknown }
  | { kind: 'failed'; key: string }
> {
  const key = deriveIdempotenceKey(scope, intent)
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS)

  try {
    await prisma.idempotency.create({
      data: { scope, key, status: 'IN_PROGRESS', expiresAt },
    })
    return { kind: 'claimed', key }
  } catch (e) {
    // P2002 = unique-constraint violation → slot already exists.
    const code = (e as { code?: string }).code
    if (code !== 'P2002') throw e
  }

  const existing = await prisma.idempotency.findUnique({
    where: { scope_key: { scope, key } },
  })
  if (!existing) return { kind: 'claimed', key } // race: the other row disappeared
  if (existing.status === 'COMPLETED') {
    return { kind: 'completed', key, response: existing.response as unknown }
  }
  if (existing.status === 'FAILED') return { kind: 'failed', key }
  return { kind: 'in-progress', key }
}

/** Mark an in-progress claim as COMPLETED and cache the response. */
export async function completeIdempotency(
  scope: string,
  key: string,
  response: unknown,
): Promise<void> {
  await prisma.idempotency.update({
    where: { scope_key: { scope, key } },
    data: { status: 'COMPLETED', response: response as Prisma.InputJsonValue },
  })
}

/** Mark an in-progress claim as FAILED. The caller may decide to retry. */
export async function failIdempotency(scope: string, key: string): Promise<void> {
  await prisma.idempotency.update({
    where: { scope_key: { scope, key } },
    data: { status: 'FAILED' },
  })
}

/**
 * Explicitly release a FAILED slot so a retry can re-claim it.
 * Only callable on rows with status FAILED to prevent accidental reset
 * of an IN_PROGRESS or COMPLETED row.
 */
export async function resetIdempotency(scope: string, key: string): Promise<void> {
  await prisma.idempotency.deleteMany({
    where: { scope, key, status: 'FAILED' },
  })
}

/** Sweep expired rows. Called from the cron runner on a schedule. */
export async function sweepExpiredIdempotency(now: Date = new Date()): Promise<number> {
  const res = await prisma.idempotency.deleteMany({
    where: { expiresAt: { lt: now } },
  })
  return res.count
}
