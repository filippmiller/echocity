import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface CreateCorporatePlanInput {
  companyName: string
  legalName?: string
  inn?: string
  billingEmail: string
  billingPhone?: string
  contactName: string
  maxSeats: number
  monthlyBudget: number // kopecks per employee per month
}

export async function createCorporatePlan(input: CreateCorporatePlanInput) {
  const plan = await prisma.corporatePlan.create({
    data: input,
  })
  logger.info('corporate.planCreated', { planId: plan.id, company: input.companyName })
  return plan
}

export async function addEmployee(planId: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  })

  if (!user) {
    return { error: 'USER_NOT_FOUND' }
  }

  const plan = await prisma.corporatePlan.findUnique({
    where: { id: planId },
    select: { maxSeats: true, _count: { select: { employees: { where: { isActive: true } } } } },
  })

  if (!plan) return { error: 'PLAN_NOT_FOUND' }
  if (plan._count.employees >= plan.maxSeats) return { error: 'SEATS_FULL' }

  const employee = await prisma.corporateEmployee.upsert({
    where: { corporatePlanId_userId: { corporatePlanId: planId, userId: user.id } },
    update: { isActive: true },
    create: { corporatePlanId: planId, userId: user.id },
  })

  logger.info('corporate.employeeAdded', { planId, userId: user.id })
  return { employee }
}

export async function removeEmployee(planId: string, userId: string) {
  await prisma.corporateEmployee.update({
    where: { corporatePlanId_userId: { corporatePlanId: planId, userId } },
    data: { isActive: false },
  })
  logger.info('corporate.employeeRemoved', { planId, userId })
}

export async function distributeMonthlyCredits(planId: string): Promise<number> {
  const plan = await prisma.corporatePlan.findUnique({
    where: { id: planId, status: 'ACTIVE' },
    include: {
      employees: {
        where: { isActive: true },
        select: { userId: true },
      },
    },
  })

  if (!plan || plan.employees.length === 0) return 0

  const coinsPerEmployee = Math.round(plan.monthlyBudget / 100) // kopecks -> coins (1 coin = 1 rub)

  const operations = plan.employees.flatMap((emp) => [
    prisma.coinTransaction.create({
      data: {
        userId: emp.userId,
        amount: coinsPerEmployee,
        type: 'CORPORATE_CREDIT',
        description: `Корпоративные монеты от ${plan.companyName}`,
        referenceId: planId,
      },
    }),
    prisma.user.update({
      where: { id: emp.userId },
      data: { coinBalance: { increment: coinsPerEmployee } },
    }),
  ])

  await prisma.$transaction(operations)

  logger.info('corporate.creditsDistributed', {
    planId,
    employees: plan.employees.length,
    coinsPerEmployee,
  })

  return plan.employees.length
}

export async function getCorporateDashboard(planId: string) {
  const plan = await prisma.corporatePlan.findUnique({
    where: { id: planId },
    include: {
      employees: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              coinBalance: true,
            },
          },
        },
      },
      _count: { select: { employees: { where: { isActive: true } } } },
    },
  })

  if (!plan) return null

  // Get total corporate credits distributed this month
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const employeeIds = plan.employees.map((e) => e.userId)

  const monthlySpend = await prisma.coinTransaction.aggregate({
    _sum: { amount: true },
    where: {
      userId: { in: employeeIds },
      type: 'CORPORATE_CREDIT',
      referenceId: planId,
      createdAt: { gte: monthStart },
    },
  })

  const totalRedemptions = await prisma.redemption.count({
    where: {
      userId: { in: employeeIds },
      createdAt: { gte: monthStart },
      status: 'SUCCESS',
    },
  })

  return {
    plan: {
      id: plan.id,
      companyName: plan.companyName,
      maxSeats: plan.maxSeats,
      monthlyBudget: plan.monthlyBudget,
      status: plan.status,
    },
    employees: plan.employees.map((e) => ({
      userId: e.user.id,
      name: [e.user.firstName, e.user.lastName].filter(Boolean).join(' '),
      email: e.user.email,
      coinBalance: e.user.coinBalance,
      addedAt: e.addedAt,
    })),
    stats: {
      activeSeats: plan._count.employees,
      monthlyCreditsDistributed: monthlySpend._sum.amount ?? 0,
      monthlyRedemptions: totalRedemptions,
    },
  }
}

/**
 * Cron: distribute monthly credits for all active corporate plans.
 * Called on the 1st of each month.
 */
export async function distributeAllCorporateCredits(): Promise<number> {
  const plans = await prisma.corporatePlan.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  })

  let total = 0
  for (const plan of plans) {
    try {
      const count = await distributeMonthlyCredits(plan.id)
      total += count
    } catch (err) {
      logger.error('corporate.distributeFailed', { planId: plan.id, error: String(err) })
    }
  }

  return total
}
