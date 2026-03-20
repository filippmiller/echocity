import { prisma } from '@/lib/prisma'

const CASHBACK_PERCENT = 3 // 3% of discount value as EchoCoins

/**
 * Earn cashback on a successful redemption.
 * discountAmount is in rubles (e.g. 150 = 150₽). 3% → 4 coins.
 * Runs non-blocking — safe to call with .catch(() => {}).
 */
export async function earnCashback(
  userId: string,
  redemptionId: string,
  discountAmount: number,
): Promise<{ coins: number } | null> {
  if (discountAmount <= 0) return null

  const coins = Math.max(1, Math.round(discountAmount * CASHBACK_PERCENT / 100))

  await prisma.$transaction([
    prisma.coinTransaction.create({
      data: {
        userId,
        amount: coins,
        type: 'REDEMPTION_CASHBACK',
        description: `Кэшбэк за активацию скидки`,
        referenceId: redemptionId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { coinBalance: { increment: coins } },
    }),
  ])

  return { coins }
}

/**
 * Returns the current coin balance for a user.
 */
export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coinBalance: true },
  })
  return user?.coinBalance ?? 0
}

/**
 * Returns the most recent transactions for a user.
 */
export async function getHistory(userId: string, limit = 20) {
  return prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Spend coins (creates a negative transaction and decrements balance).
 * Returns false if the user has insufficient balance.
 */
export async function spendCoins(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coinBalance: true },
  })

  if (!user) return { success: false, error: 'USER_NOT_FOUND' }
  if (user.coinBalance < amount) return { success: false, error: 'INSUFFICIENT_BALANCE' }

  const [, updated] = await prisma.$transaction([
    prisma.coinTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'SUBSCRIPTION_PAYMENT',
        description,
        referenceId: referenceId ?? null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { coinBalance: { decrement: amount } },
      select: { coinBalance: true },
    }),
  ])

  return { success: true, newBalance: updated.coinBalance }
}
