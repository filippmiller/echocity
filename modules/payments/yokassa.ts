import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

function addOneMonth(date: Date): Date {
  const result = new Date(date)
  const day = result.getDate()
  result.setMonth(result.getMonth() + 1)
  if (result.getDate() < day) {
    result.setDate(0) // last day of previous month
  }
  return result
}

const YOKASSA_SHOP_ID = process.env.YOKASSA_SHOP_ID || ''
const YOKASSA_SECRET_KEY = process.env.YOKASSA_SECRET_KEY || ''
const YOKASSA_API_URL = 'https://api.yookassa.ru/v3'

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${YOKASSA_SHOP_ID}:${YOKASSA_SECRET_KEY}`).toString('base64')
}

export async function createPayment(input: {
  amount: number // kopecks
  currency: string
  description: string
  returnUrl: string
  metadata: Record<string, string>
  savePaymentMethod?: boolean
}) {
  const idempotencyKey = crypto.randomUUID()

  const res = await fetch(`${YOKASSA_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
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
    throw new Error(`ЮKassa payment creation failed: ${res.status}`)
  }

  return res.json()
}

export async function createRecurringPayment(savedPaymentMethodId: string, amount: number, description: string) {
  const idempotencyKey = crypto.randomUUID()

  const res = await fetch(`${YOKASSA_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
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

  if (!res.ok) throw new Error(`ЮKassa recurring payment failed: ${res.status}`)
  return res.json()
}

export async function handleWebhookEvent(body: any, rawBody?: string) {
  // Signature verification — mandatory in production
  const webhookSecret = process.env.YOKASSA_WEBHOOK_SECRET
  if (webhookSecret) {
    if (!rawBody) {
      logger.warn('ЮKassa webhook: rawBody required for signature verification')
      throw new Error('Webhook signature verification failed: no rawBody')
    }
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')
    const receivedSignature = body._signature
    if (!receivedSignature ||
        Buffer.byteLength(receivedSignature) !== Buffer.byteLength(expectedSignature) ||
        !crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) {
      logger.warn('ЮKassa webhook: invalid or missing signature')
      throw new Error('Webhook signature verification failed')
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.error('ЮKassa webhook: YOKASSA_WEBHOOK_SECRET not set in production')
    throw new Error('Webhook secret not configured')
  }

  const event = body.event
  const payment = body.object

  // Validate required fields
  if (!event || !payment?.id || !payment?.metadata?.userId) {
    logger.warn('ЮKassa webhook: missing required fields (event, object.id, object.metadata.userId)')
    return
  }

  const { userId, planCode, subscriptionId } = payment.metadata

  if (event === 'payment.succeeded') {
    // Idempotency: skip if payment already recorded
    const existingPayment = await prisma.payment.findFirst({
      where: { externalPaymentId: payment.id },
    })
    if (existingPayment) {
      logger.info('ЮKassa webhook: duplicate payment, skipping', { paymentId: payment.id })
      return
    }

    // Record payment
    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscriptionId || null,
        provider: 'YOKASSA',
        externalPaymentId: payment.id,
        amount: Math.round(parseFloat(payment.amount.value) * 100),
        currency: payment.amount.currency,
        status: 'SUCCESS',
        type: subscriptionId ? 'RENEWAL' : 'SUBSCRIPTION',
        paidAt: new Date(),
        rawPayload: payment,
      },
    })

    // If new subscription (no subscriptionId yet), create it
    if (!subscriptionId && planCode) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } })
      if (plan) {
        const now = new Date()
        const endAt = addOneMonth(now)

        await prisma.userSubscription.create({
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
      }
    }

    // If renewal, extend subscription (only if subscription is ACTIVE or PAST_DUE)
    if (subscriptionId) {
      const sub = await prisma.userSubscription.findUnique({ where: { id: subscriptionId } })
      if (sub && (sub.status === 'ACTIVE' || sub.status === 'PAST_DUE')) {
        const newEnd = addOneMonth(new Date(sub.endAt))
        await prisma.userSubscription.update({
          where: { id: subscriptionId },
          data: { status: 'ACTIVE', endAt: newEnd },
        })
      }
    }

    logger.info('ЮKassa payment succeeded', { paymentId: payment.id, userId })
  }

  if (event === 'payment.canceled') {
    // Idempotency: skip if payment already recorded
    const existingPayment = await prisma.payment.findFirst({
      where: { externalPaymentId: payment.id },
    })
    if (existingPayment) {
      logger.info('ЮKassa webhook: duplicate canceled payment, skipping', { paymentId: payment.id })
      return
    }

    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscriptionId || null,
        provider: 'YOKASSA',
        externalPaymentId: payment.id,
        amount: Math.round(parseFloat(payment.amount.value) * 100),
        currency: payment.amount.currency,
        status: 'FAILED',
        type: subscriptionId ? 'RENEWAL' : 'SUBSCRIPTION',
        failureReason: payment.cancellation_details?.reason,
        rawPayload: payment,
      },
    })

    logger.info('ЮKassa payment canceled', { paymentId: payment.id, userId })
  }
}
