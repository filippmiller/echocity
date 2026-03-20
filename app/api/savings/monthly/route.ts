import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

const MONTH_NAMES_RU = [
  'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
  'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
]

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [monthlySavings, allTimeSavings] = await Promise.all([
    prisma.userSavings.aggregate({
      where: {
        userId: session.userId,
        savedAt: { gte: startOfMonth },
      },
      _sum: { savedAmount: true },
    }),
    prisma.userSavings.aggregate({
      where: { userId: session.userId },
      _sum: { savedAmount: true },
    }),
  ])

  const monthlySaved = Math.round((monthlySavings._sum.savedAmount ?? 0) / 100)
  const totalSaved = Math.round((allTimeSavings._sum.savedAmount ?? 0) / 100)
  const monthName = MONTH_NAMES_RU[now.getMonth()]

  return NextResponse.json({ monthlySaved, totalSaved, monthName })
}
