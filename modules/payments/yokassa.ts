/**
 * YooKassa payments integration (Sprint B refactor).
 *
 * Sprint A shipped basic createPayment + handleWebhookEvent with:
 *   - random UUID idempotence keys (not deterministic)
 *   - separate findFirst + create (race on concurrent webhooks)
 *   - rawPayload stored unscrubbed
 *   - no FinancialEvent ledger
 *
 * Sprint B hardens all four:
 *   - B.1: deterministic Idempotence-Key via claimIdempotency(scope, intent)
 *   - B.3: upsert-inside-$transaction so concurrent webhooks collapse safely
 *   - B.4: scrubRawPayload strips card/CVC before persist
 *   - B.6: append-only FinancialEvent ledger row per state change
 *
 * Sprint B.5 (54-ФЗ receipt) is deferred until YooKassa sandbox keys arrive.
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  claimIdempotency,
  completeIdempotency,
  failIdempotency,
} from './idempotency'
import { scrubRawPayload } from './scrub'
import { recordFinancialEvent, FinancialEventType } from './financial-events'

export class YookassaWebhookError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'YookassaWebhookError'
    this.status = status
  }
}

function addOneMonth(date: Date): Date {
  const result = new Date(date)
  const day = result.getDate()
  result.setMonth(result.getMonth() + 1)
  if (result.getDate() < day) {
    result.setDate(0) // last day of previous month
  }
  return result
}

// Sandbox vs. production credentials. Tests MUST NOT hit the production merchant
// account — if we detect a test context and sandbox keys aren't configured,
// we hard-fail instead of falling through to prod.
function resolveYookassaCredentials() {
  const baseUrl = process.env.BASE_URL ?? ''
  const isTestContext =
    process.env.NODE_ENV === 'test' ||
    process.env.PLAYWRIGHT === '1' ||
    baseUrl.startsWith('http://localhost') ||
    baseUrl.startsWith('http://127.0.0.1')

  if (isTestContext) {
    const shopId = process.env.YOKASSA_SANDBOX_SHOP_ID
    const secretKey = process.env.YOKASSA_SANDBOX_SECRET_KEY
    if (!shopId || !secretKey) {
      throw new Error(
        'YooKassa sandbox credentials missing: set YOKASSA_SANDBOX_SHOP_ID and YOKASSA_SANDBOX_SECRET_KEY for test contexts.',
      )
    }
    return { shopId, secretKey, mode: 'sandbox' as const }
  }

  return {
    shopId: process.env.YOKASSA_SHOP_ID || '',
    secretKey: process.env.YOKASSA_SECRET_KEY || '',
    mode: 'production' as const,
  }
}

const YOKASSA_API_URL = 'https://api.yookassa.ru/v3'

function getAuthHeader() {
  const { shopId, secretKey } = resolveYookassaCredentials()
  return 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64')
}

/** Public shape of a YooKassa payment create / get response. */
export type YookassaPaymentResponse = {
  id: string
  status?: string
  confirmation?: { confirmation_url?: string; type?: string; [k: string]: unknown }
  amount?: { value: string; currency: string }
  metadata?: Record<string, string>
  payment_method?: { id?: string; [k: string]: unknown }
  [k: string]: unknown
}

export type CreatePaymentInput = {
  amount: number // kopecks
  currency: string
  description: string
  returnUrl: string
  metadata: Record<string, string>
  savePaymentMethod?: boolean
  /**
   * Optional nonce to force a fresh idempotency slot even when all other
   * intent fields are identical (e.g. "user clicked 'pay again' after a
   * failed attempt"). Do NOT pass a timestamp or random value on every
   * call — that defeats dedup.
   */
  retryNonce?: string
}

/**
 * Create a YooKassa payment with deterministic idempotence.
 */
export async function createPayment(
  input: CreatePaymentInput,
): Promise<YookassaPaymentResponse> {
  const intent = {
    userId: input.metadata.userId,
    planCode: input.metadata.planCode ?? null,
    subscriptionId: input.metadata.subscriptionId ?? null,
    amount: input.amount,
    currency: input.currency,
    returnUrl: input.returnUrl,
    retryNonce: input.retryNonce ?? null,
  }

  const claim = await claimIdempotency('yokassa:createPayment', intent)
  if (claim.kind === 'completed') return claim.response as YookassaPaymentResponse
  if (claim.kind === 'in-progress') {
    throw new Error('payment-already-in-flight')
  }
  if (claim.kind === 'failed') {
    throw new Error('prior-payment-attempt-failed; pass retryNonce to try again')
  }

  // claim.kind === 'claimed' — we hold the slot and MUST complete or fail it.
  const idempotencyKey = claim.key

  try {
    const res = await fetch(`${YOKASSA_API_URL}/payments`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
        // YooKassa wants its own header — we reuse our deterministic key.
        'Idempotence-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: {
          value: (input.amount / 100).toFixed(2),
          currency: input.currency,
        },
        confirmation: {
          type: 'redirect',
          return_url: input.returnUrl,
        },
        capture: true,
        description: input.description,
        metadata: input.metadata,
        save_payment_method: input.savePaymentMethod || false,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      logger.error('ЮKassa createPayment failed', { status: res.status, body: err })
      await failIdempotency('yokassa:createPayment', idempotencyKey)
      throw new Error(`ЮKassa payment creation failed: ${res.status}`)
    }

    const body = (await res.json()) as YookassaPaymentResponse
    await completeIdempotency('yokassa:createPayment', idempotencyKey, body)

    // Ledger: intent was accepted by YooKassa (state = pending/awaiting_capture).
    await recordFinancialEvent({
      eventType: FinancialEventType.PAYMENT_INTENT_CREATED,
      userId: input.metadata.userId,
      amount: input.amount,
      currency: input.currency,
      metadata: {
        externalPaymentId: String(body.id ?? ''),
        planCode: input.metadata.planCode ?? null,
        subscriptionId: input.metadata.subscriptionId ?? null,
      },
    })

    return body
  } catch (err) {
    // Best-effort marking; the original error is the one that matters.
    try {
      await failIdempotency('yokassa:createPayment', idempotencyKey)
    } catch {
      // Swallow.
    }
    throw err
  }
}

export async function createRecurringPayment(
  savedPaymentMethodId: string,
  amount: number,
  description: string,
  userId: string,
): Promise<YookassaPaymentResponse> {
  const intent = {
    savedPaymentMethodId,
    amount,
    currency: 'RUB',
  }
  const claim = await claimIdempotency('yokassa:recurring', intent)
  if (claim.kind === 'completed') return claim.response as YookassaPaymentResponse
  if (claim.kind === 'in-progress') throw new Error('recurring-payment-already-in-flight')
  if (claim.kind === 'failed') throw new Error('prior-recurring-attempt-failed')

  const idempotencyKey = claim.key
  try {
    const res = await fetch(`${YOKASSA_API_URL}/payments`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: { value: (amount / 100).toFixed(2), currency: 'RUB' },
        capture: true,
        payment_method_id: savedPaymentMethodId,
        description,
      }),
    })
    if (!res.ok) {
      await failIdempotency('yokassa:recurring', idempotencyKey)
      throw new Error(`ЮKassa recurring payment failed: ${res.status}`)
    }
    const body = (await res.json()) as YookassaPaymentResponse
    await completeIdempotency('yokassa:recurring', idempotencyKey, body)
    await recordFinancialEvent({
      eventType: FinancialEventType.PAYMENT_INTENT_CREATED,
      userId,
      amount,
      currency: 'RUB',
      metadata: { kind: 'recurring', externalPaymentId: String(body.id ?? '') },
    })
    return body
  } catch (err) {
    try {
      await failIdempotency('yokassa:recurring', idempotencyKey)
    } catch {
      // Swallow.
    }
    throw err
  }
}

type YookassaWebhookPayload = {
  event: string
  object: {
    id: string
    amount: { value: string; currency: string }
    metadata: {
      userId: string
      planCode?: string
      subscriptionId?: string
    }
    payment_method?: { id?: string; [k: string]: unknown }
    cancellation_details?: { reason?: string }
    [k: string]: unknown
  }
  _signature?: string
}

/**
 * Handle a YooKassa webhook. Atomicity guarantees:
 *   - Payment upsert on externalPaymentId + FinancialEvent + Subscription
 *     write live in ONE prisma.$transaction so a mid-flight crash leaves
 *     either all-three or none.
 *   - P2002 (unique constraint) is mapped to a no-op ack.
 */
export async function handleWebhookEvent(
  body: YookassaWebhookPayload | Record<string, unknown>,
  rawBody?: string,
): Promise<void> {
  // Signature verification — mandatory in production when secret is configured.
  const webhookSecret = process.env.YOKASSA_WEBHOOK_SECRET
  if (webhookSecret) {
    if (!rawBody) {
      logger.warn('ЮKassa webhook: rawBody required for signature verification')
      throw new YookassaWebhookError('Webhook signature verification failed: no rawBody', 400)
    }
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')
    const receivedSignature = (body as { _signature?: string })._signature
    if (
      !receivedSignature ||
      Buffer.byteLength(receivedSignature) !== Buffer.byteLength(expectedSignature) ||
      !crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))
    ) {
      logger.warn('ЮKassa webhook: invalid or missing signature')
      throw new YookassaWebhookError('Webhook signature verification failed', 401)
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.error('ЮKassa webhook: YOKASSA_WEBHOOK_SECRET not set in production')
    throw new YookassaWebhookError('Webhook secret not configured', 500)
  }

  const event = (body as YookassaWebhookPayload).event
  const payment = (body as YookassaWebhookPayload).object

  if (!event || !payment?.id || !payment?.metadata?.userId) {
    logger.warn('ЮKassa webhook: missing required fields')
    throw new YookassaWebhookError(
      'Missing required fields: event, object.id, object.metadata.userId',
      400,
    )
  }

  const { userId, planCode, subscriptionId } = payment.metadata
  const amountKopecks = Math.round(parseFloat(payment.amount.value) * 100)
  const scrubbed = scrubRawPayload(payment)

  if (event === 'payment.succeeded') {
    try {
      await prisma.$transaction(async (tx) => {
        const payRow = await tx.payment.upsert({
          where: { externalPaymentId: payment.id },
          update: {
            status: 'SUCCESS',
            paidAt: new Date(),
            rawPayload: scrubbed as never,
          },
          create: {
            userId,
            subscriptionId: subscriptionId ?? null,
            provider: 'YOKASSA',
            externalPaymentId: payment.id,
            amount: amountKopecks,
            currency: payment.amount.currency,
            status: 'SUCCESS',
            type: subscriptionId ? 'RENEWAL' : 'SUBSCRIPTION',
            paidAt: new Date(),
            rawPayload: scrubbed as never,
          },
        })

        await recordFinancialEvent(
          {
            eventType: FinancialEventType.PAYMENT_SUCCEEDED,
            userId,
            paymentId: payRow.id,
            subscriptionId: subscriptionId ?? null,
            amount: amountKopecks,
            currency: payment.amount.currency,
            metadata: { externalPaymentId: payment.id, planCode: planCode ?? null },
          },
          tx,
        )

        // New subscription path.
        if (!subscriptionId && planCode) {
          const plan = await tx.subscriptionPlan.findUnique({ where: { code: planCode } })
          if (plan) {
            const now = new Date()
            const endAt = addOneMonth(now)
            const sub = await tx.userSubscription.create({
              data: {
                userId,
                planId: plan.id,
                status: 'ACTIVE',
                startAt: now,
                endAt,
                autoRenew: true,
                externalSubscriptionId: payment.payment_method?.id,
              },
            })
            await recordFinancialEvent(
              {
                eventType: FinancialEventType.SUBSCRIPTION_STARTED,
                userId,
                paymentId: payRow.id,
                subscriptionId: sub.id,
                amount: amountKopecks,
                currency: payment.amount.currency,
                metadata: { planCode },
              },
              tx,
            )
          }
        }

        // Renewal path.
        if (subscriptionId) {
          const sub = await tx.userSubscription.findUnique({ where: { id: subscriptionId } })
          if (sub && (sub.status === 'ACTIVE' || sub.status === 'PAST_DUE')) {
            const newEnd = addOneMonth(new Date(sub.endAt))
            await tx.userSubscription.update({
              where: { id: subscriptionId },
              data: { status: 'ACTIVE', endAt: newEnd },
            })
            await recordFinancialEvent(
              {
                eventType: FinancialEventType.SUBSCRIPTION_RENEWED,
                userId,
                paymentId: payRow.id,
                subscriptionId,
                amount: amountKopecks,
                currency: payment.amount.currency,
                metadata: { newEnd: newEnd.toISOString() },
              },
              tx,
            )
          }
        }
      })

      logger.info('ЮKassa payment succeeded', { paymentId: payment.id, userId })
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'P2002') {
        logger.info('ЮKassa webhook: duplicate payment, acknowledged', {
          paymentId: payment.id,
        })
        return
      }
      throw e
    }
    return
  }

  if (event === 'payment.canceled') {
    try {
      await prisma.$transaction(async (tx) => {
        const payRow = await tx.payment.upsert({
          where: { externalPaymentId: payment.id },
          update: {
            status: 'FAILED',
            failureReason: payment.cancellation_details?.reason,
            rawPayload: scrubbed as never,
          },
          create: {
            userId,
            subscriptionId: subscriptionId ?? null,
            provider: 'YOKASSA',
            externalPaymentId: payment.id,
            amount: amountKopecks,
            currency: payment.amount.currency,
            status: 'FAILED',
            type: subscriptionId ? 'RENEWAL' : 'SUBSCRIPTION',
            failureReason: payment.cancellation_details?.reason,
            rawPayload: scrubbed as never,
          },
        })

        await recordFinancialEvent(
          {
            eventType: FinancialEventType.PAYMENT_CANCELED,
            userId,
            paymentId: payRow.id,
            subscriptionId: subscriptionId ?? null,
            amount: amountKopecks,
            currency: payment.amount.currency,
            metadata: {
              externalPaymentId: payment.id,
              reason: payment.cancellation_details?.reason ?? null,
            },
          },
          tx,
        )
      })
      logger.info('ЮKassa payment canceled', { paymentId: payment.id, userId })
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'P2002') {
        logger.info('ЮKassa webhook: duplicate canceled payment, acknowledged', {
          paymentId: payment.id,
        })
        return
      }
      throw e
    }
  }
}
