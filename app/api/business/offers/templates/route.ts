import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

// Pre-built offer templates that merchants can one-click create
const TEMPLATES = [
  {
    id: 'percent-discount',
    name: '%-скидка на всё',
    icon: '🏷',
    defaults: {
      title: '-{value}% на всё меню',
      offerType: 'PERCENT_DISCOUNT',
      benefitType: 'PERCENT',
      benefitValue: 20,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
    },
  },
  {
    id: 'business-lunch',
    name: 'Бизнес-ланч',
    icon: '🍽',
    defaults: {
      title: 'Бизнес-ланч за {value}₽',
      offerType: 'FIXED_PRICE',
      benefitType: 'FIXED_PRICE',
      benefitValue: 399,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
    },
  },
  {
    id: 'first-visit',
    name: 'Первый визит',
    icon: '👋',
    defaults: {
      title: '-{value}% на первый визит',
      offerType: 'FIRST_VISIT',
      benefitType: 'PERCENT',
      benefitValue: 25,
      visibility: 'FREE_FOR_ALL',
      redemptionChannel: 'IN_STORE',
    },
  },
  {
    id: 'happy-hours',
    name: 'Счастливые часы',
    icon: '⏰',
    defaults: {
      title: '-{value}% в непиковые часы',
      offerType: 'OFF_PEAK',
      benefitType: 'PERCENT',
      benefitValue: 30,
      visibility: 'MEMBERS_ONLY',
      redemptionChannel: 'IN_STORE',
    },
  },
  {
    id: 'two-for-one',
    name: '2 по цене 1',
    icon: '🎁',
    defaults: {
      title: '2 по цене 1',
      offerType: 'BUNDLE',
      benefitType: 'BUNDLE',
      benefitValue: 50,
      visibility: 'MEMBERS_ONLY',
      redemptionChannel: 'IN_STORE',
    },
  },
]

// GET: return available templates
export async function GET() {
  return NextResponse.json({ templates: TEMPLATES })
}

// POST: create an offer from a template
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.templateId || !body?.branchId) {
    return NextResponse.json({ error: 'templateId and branchId are required' }, { status: 400 })
  }

  const template = TEMPLATES.find((t) => t.id === body.templateId)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Verify the branch belongs to the merchant
  const branch = await prisma.place.findUnique({
    where: { id: body.branchId },
    include: { business: true },
  })

  if (!branch?.business || branch.business.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Branch not owned by you' }, { status: 403 })
  }

  const value = body.benefitValue ?? template.defaults.benefitValue
  const title = (body.title ?? template.defaults.title).replace('{value}', String(value))

  const now = new Date()
  const endAt = new Date(now)
  endAt.setDate(endAt.getDate() + 30) // Default 30-day offer

  const offer = await prisma.offer.create({
    data: {
      merchantId: branch.business.id,
      branchId: body.branchId,
      title,
      subtitle: body.subtitle ?? null,
      description: body.description ?? null,
      offerType: template.defaults.offerType as any,
      benefitType: template.defaults.benefitType as any,
      benefitValue: value,
      visibility: (body.visibility ?? template.defaults.visibility) as any,
      redemptionChannel: (template.defaults.redemptionChannel ?? 'IN_STORE') as any,
      currency: 'RUB',
      approvalStatus: 'PENDING',
      lifecycleStatus: 'INACTIVE',
      startAt: now,
      endAt,
      createdByUserId: session.userId,
    },
    include: {
      branch: { select: { id: true, title: true, address: true } },
      merchant: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ offer }, { status: 201 })
}
