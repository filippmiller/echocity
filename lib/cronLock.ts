/**
 * Sprint B.7 — pg_try_advisory_lock wrapper + CronRun logging.
 *
 * Problem: horizontal deploys run multiple Next.js instances. Any cron
 * handler scheduled via setInterval / node-cron / etc. would fire on
 * every instance, so a nightly billing job could run N times in
 * parallel and double-charge.
 *
 * Solution: Postgres advisory locks. `pg_try_advisory_lock(key)` returns
 * TRUE only on the first caller and FALSE for everyone else until the
 * lock is released (by `pg_advisory_unlock(key)` or session end). We
 * hash the job name to a 64-bit BIGINT key so different jobs never
 * contend.
 *
 * Every run — whether the lock was acquired or not — writes a CronRun
 * row so observability can tell "did the 05:00 job even attempt to run?"
 * and "how long did it take?".
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Derive a 64-bit BIGINT from the job name. Postgres advisory lock
 * keys are BIGINT; we hash SHA-256 and fold the first 8 bytes to a
 * signed 64-bit int range.
 */
function jobToLockKey(jobName: string): bigint {
  const h = crypto.createHash('sha256').update(jobName).digest()
  // Read as big-endian 64-bit signed.
  const unsigned = h.readBigUInt64BE(0)
  // Fold into signed range: JS BigInt handles negatives, Postgres BIGINT too.
  return unsigned > BigInt('0x7fffffffffffffff')
    ? unsigned - BigInt('0x10000000000000000')
    : unsigned
}

export type CronRunResult<T> = {
  /** true if this process acquired the advisory lock and ran the handler. */
  ran: boolean
  /** The handler return value. undefined if `ran=false`. */
  value?: T
  /** CronRun row id for downstream correlation. */
  runId: string
  /** Error that terminated the handler, if any. */
  error?: Error
}

/**
 * Execute `handler` iff we acquired the advisory lock for `jobName`.
 * Always writes a CronRun row describing what happened.
 *
 * The handler runs inside the same pg connection that holds the lock,
 * and the lock is released at the end (success OR failure). If the
 * process crashes mid-handler, Postgres releases the lock when the
 * connection dies — no stuck-lock scenario.
 */
export async function withCronLock<T>(
  jobName: string,
  handler: () => Promise<T>,
): Promise<CronRunResult<T>> {
  const lockKey = jobToLockKey(jobName)

  // 1. Write a CronRun row FIRST so we know the scheduler fired.
  const run = await prisma.cronRun.create({
    data: { jobName },
  })

  // 2. Try to acquire the advisory lock.
  //    pg_try_advisory_lock returns {pg_try_advisory_lock: boolean}[].
  //    We use $queryRawUnsafe because Prisma's typed raw requires a
  //    parameterized template literal, and BIGINT values need string
  //    serialization.
  let acquired = false
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ pg_try_advisory_lock: boolean }>>(
      `SELECT pg_try_advisory_lock($1::bigint) AS pg_try_advisory_lock`,
      lockKey.toString(),
    )
    acquired = rows[0]?.pg_try_advisory_lock === true
  } catch (e) {
    logger.error('cron: advisory-lock acquire failed', { jobName, error: String(e) })
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), ok: false, error: String(e) },
    })
    return { ran: false, runId: run.id, error: e as Error }
  }

  if (!acquired) {
    await prisma.cronRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        ok: true,
        metadata: { skipped: 'lock-held-by-peer' },
      },
    })
    return { ran: false, runId: run.id }
  }

  // 3. Run the handler, always release the lock in finally.
  try {
    const value = await handler()
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), ok: true },
    })
    return { ran: true, value, runId: run.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), ok: false, error: msg },
    })
    logger.error('cron: handler threw', { jobName, error: msg })
    return { ran: true, runId: run.id, error: err as Error }
  } finally {
    try {
      await prisma.$queryRawUnsafe(
        `SELECT pg_advisory_unlock($1::bigint)`,
        lockKey.toString(),
      )
    } catch (e) {
      logger.warn('cron: advisory-unlock failed (connection may have died)', {
        jobName,
        error: String(e),
      })
    }
  }
}
