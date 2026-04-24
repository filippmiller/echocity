/**
 * Sprint B.6 — FinancialEvent ledger write-through helpers.
 *
 * Append-only semantics:
 *   - Every payment / subscription state transition produces ONE row.
 *   - Never UPDATE, never DELETE. Historic corrections go through
 *     MANUAL_ADJUSTMENT with a descriptive metadata.reason.
 *   - Callers pass amounts in KOPECKS (integer). null for non-monetary events.
 */

import type { Prisma, PrismaClient } from '@prisma/client'
import { FinancialEventType } from '@prisma/client'
import { prisma as defaultPrisma } from '@/lib/prisma'

export type FinancialEventInput = {
  eventType: FinancialEventType
  userId: string
  paymentId?: string | null
  subscriptionId?: string | null
  amount?: number | null
  currency?: string
  metadata?: Prisma.InputJsonValue
}

/**
 * Record a financial event. Prefer passing `tx` (a transaction client from
 * `prisma.$transaction`) so the ledger write shares the same atomic unit as
 * the Payment / Subscription write it describes. Mismatched commits are a
 * silent data-integrity bug class we explicitly guard against.
 */
export async function recordFinancialEvent(
  input: FinancialEventInput,
  tx: PrismaClient | Prisma.TransactionClient = defaultPrisma,
): Promise<void> {
  await tx.financialEvent.create({
    data: {
      eventType: input.eventType,
      userId: input.userId,
      paymentId: input.paymentId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? 'RUB',
      metadata: input.metadata,
    },
  })
}

export { FinancialEventType }
