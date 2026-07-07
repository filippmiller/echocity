import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { OFFER_TEMPLATES, type BusinessType } from '@/lib/offer-templates'

// GET: return available templates, optionally filtered by niche
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const niche = searchParams.get('niche')?.toUpperCase() as BusinessType | undefined

  const available = niche
    ? OFFER_TEMPLATES.filter((t) => t.niche === 'ALL' || t.niche === niche)
    : OFFER_TEMPLATES

  return NextResponse.json({ templates: available })
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

  const template = OFFER_TEMPLATES.find((t) => t.id === body.templateId)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

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
  endAt.setDate(endAt.getDate() + 30)

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
      approvalStatus: 'DRAFT',
      lifecycleStatus: 'INACTIVE',
      startAt: now,
      endAt,
      termsText: body.termsText ?? template.defaults.termsText ?? null,
      createdByUserId: session.userId,
    },
    include: {
      branch: { select: { id: true, title: true, address: true } },
      merchant: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ offer }, { status: 201 })
}
