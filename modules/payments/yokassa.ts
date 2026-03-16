import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

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

export async function handleWebhookEvent(body: any) {
  const event = body.event
  const payment = body.object

  if (!payment?.id || !payment?.metadata) {
    logger.warn('ЮKassa webhook: missing payment data')
    return
  }

  const { userId, planCode, subscriptionId } = payment.metadata

  if (event === 'payment.succeeded') {
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
        const endAt = new Date(now)
        endAt.setMonth(endAt.getMonth() + 1)

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

    // If renewal, extend subscription
    if (subscriptionId) {
      const sub = await prisma.userSubscription.findUnique({ where: { id: subscriptionId } })
      if (sub) {
        const newEnd = new Date(sub.endAt)
        newEnd.setMonth(newEnd.getMonth() + 1)
        await prisma.userSubscription.update({
          where: { id: subscriptionId },
          data: { status: 'ACTIVE', endAt: newEnd },
        })
      }
    }

    logger.info('ЮKassa payment succeeded', { paymentId: payment.id, userId })
  }

  if (event === 'payment.canceled') {
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
