import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createPayment } from '@/modules/payments/yokassa'
import { switchSubscription } from '@/modules/subscriptions/service'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planCode } = await req.json()
  if (!planCode) return NextResponse.json({ error: 'planCode required' }, { status: 400 })

  // Check plan exists
  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.code === 'free') return NextResponse.json({ error: 'Cannot subscribe to free plan' }, { status: 400 })

  // Check if user already has active subscription
  const existing = await prisma.userSubscription.findFirst({
    where: { userId: session.userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    include: { plan: true },
  })
  if (existing) {
    if (existing.plan.code === plan.code) {
      return NextResponse.json({ error: 'Already subscribed to this plan' }, { status: 409 })
    }

    const subscription = await switchSubscription(session.userId, plan.code)
    return NextResponse.json({ subscription, switched: true }, { status: 200 })
  }

  // If plan has trial days, create subscription directly (no payment needed for trial)
  if (plan.trialDays > 0) {
    const { createSubscription } = await import('@/modules/subscriptions/service')
    const subscription = await createSubscription(session.userId, planCode)
    return NextResponse.json({ subscription, trial: true }, { status: 201 })
  }

  // Create ЮKassa payment
  try {
    const origin = req.headers.get('origin') || req.nextUrl.origin
    const payment = await createPayment({
      amount: plan.monthlyPrice,
      currency: plan.currency,
      description: `Подписка ${plan.name} — ${plan.monthlyPrice / 100} ₽/мес`,
      returnUrl: `${origin}/subscription?status=success`,
      metadata: {
        userId: session.userId,
        planCode: plan.code,
      },
      savePaymentMethod: true,
    })

    return NextResponse.json({
      confirmationUrl: payment.confirmation?.confirmation_url,
      paymentId: payment.id,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Payment creation failed: ' + e.message }, { status: 500 })
  }
}
