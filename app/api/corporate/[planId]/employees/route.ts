import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { addEmployee } from '@/modules/corporate/service'

const addSchema = z.object({
  email: z.string().email(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }

  const { planId } = await params

  const employees = await prisma.corporateEmployee.findMany({
    where: { corporatePlanId: planId, isActive: true },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, coinBalance: true } },
    },
    orderBy: { addedAt: 'desc' },
  })

  return NextResponse.json({
    employees: employees.map((e) => ({
      userId: e.userId,
      name: [e.user.firstName, e.user.lastName].filter(Boolean).join(' '),
      email: e.user.email,
      coinBalance: e.user.coinBalance,
      addedAt: e.addedAt,
    })),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }

  const { planId } = await params

  let body: z.infer<typeof addSchema>
  try {
    body = addSchema.parse(await request.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ошибка валидации', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = await addEmployee(planId, body.email)

  if ('error' in result) {
    const messages: Record<string, string> = {
      USER_NOT_FOUND: 'Пользователь с таким email не найден',
      PLAN_NOT_FOUND: 'Корпоративный план не найден',
      SEATS_FULL: 'Все места заняты',
    }
    return NextResponse.json(
      { error: messages[result.error] || result.error },
      { status: 400 }
    )
  }

  return NextResponse.json({ employee: result.employee }, { status: 201 })
}
