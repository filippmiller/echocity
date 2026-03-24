import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createMysteryBag } from '@/modules/mystery-bags/service'

const mysteryBagSchema = z.object({
  branchId: z.string(),
  title: z.string().min(3).max(200),
  salePrice: z.number().positive(),
  originalValue: z.number().positive(),
  contentsHint: z.string().min(3).max(500),
  pickupWindowStart: z.string().regex(/^\d{2}:\d{2}$/),
  pickupWindowEnd: z.string().regex(/^\d{2}:\d{2}$/),
  quantity: z.number().int().min(1).max(50),
})

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, businesses: { select: { id: true } } },
  })

  if (!user || user.role !== 'BUSINESS_OWNER' || user.businesses.length === 0) {
    return NextResponse.json({ error: 'Только для бизнес-аккаунтов' }, { status: 403 })
  }

  let body: z.infer<typeof mysteryBagSchema>
  try {
    body = mysteryBagSchema.parse(await request.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ошибка валидации', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify branch belongs to merchant
  const branch = await prisma.place.findUnique({
    where: { id: body.branchId },
    select: { businessId: true },
  })

  if (!branch || !user.businesses.some((b) => b.id === branch.businessId)) {
    return NextResponse.json({ error: 'Филиал не принадлежит вашему бизнесу' }, { status: 403 })
  }

  const offer = await createMysteryBag(session.userId, {
    ...body,
    merchantId: branch.businessId!,
  })

  return NextResponse.json({ offer: { id: offer.id, title: offer.title } }, { status: 201 })
}
