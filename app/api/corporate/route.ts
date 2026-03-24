import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createCorporatePlan } from '@/modules/corporate/service'

const createSchema = z.object({
  companyName: z.string().min(2).max(200),
  legalName: z.string().max(200).optional(),
  inn: z.string().max(20).optional(),
  billingEmail: z.string().email(),
  billingPhone: z.string().max(30).optional(),
  contactName: z.string().min(2).max(100),
  maxSeats: z.number().int().min(1).max(1000),
  monthlyBudget: z.number().int().positive(), // kopecks
})

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }

  // Only admin can create corporate plans for now
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Только для администраторов' }, { status: 403 })
  }

  let body: z.infer<typeof createSchema>
  try {
    body = createSchema.parse(await request.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ошибка валидации', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const plan = await createCorporatePlan(body)
  return NextResponse.json({ plan }, { status: 201 })
}
