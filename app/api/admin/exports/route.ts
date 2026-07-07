import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { generateCsv } from '@/lib/csv'
import { createAuditEntry, AuditAction } from '@/lib/audit'

const EXPORT_TYPES = ['offers', 'redemptions', 'complaints', 'businesses'] as const

const exportQuerySchema = z.object({
  type: z.enum(EXPORT_TYPES, { message: 'Неизвестный тип экспорта' }),
  format: z.enum(['csv']).optional(),
  limit: z.coerce.number().int().min(1).max(10000).default(1000),
})

const FILENAMES: Record<(typeof EXPORT_TYPES)[number], string> = {
  offers: 'offers-export.csv',
  redemptions: 'redemptions-export.csv',
  complaints: 'complaints-export.csv',
  businesses: 'businesses-export.csv',
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const parseResult = exportQuerySchema.safeParse({
    type: searchParams.get('type'),
    format: searchParams.get('format') || 'csv',
    limit: searchParams.get('limit'),
  })

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parseResult.error.errors },
      { status: 400 }
    )
  }

  const { type, limit } = parseResult.data

  let csv = ''
  let recordCount = 0

  try {
    if (type === 'offers') {
      const offers = await prisma.offer.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { city: true } },
          merchant: { select: { name: true } },
        },
      })

      const headers = [
        'id',
        'title',
        'offerType',
        'visibility',
        'benefitType',
        'benefitValue',
        'lifecycleStatus',
        'approvalStatus',
        'startAt',
        'endAt',
        'branchCity',
        'merchantName',
      ]

      const rows = offers.map((offer) => ({
        id: offer.id,
        title: offer.title,
        offerType: offer.offerType,
        visibility: offer.visibility,
        benefitType: offer.benefitType,
        benefitValue: Number(offer.benefitValue),
        lifecycleStatus: offer.lifecycleStatus,
        approvalStatus: offer.approvalStatus,
        startAt: offer.startAt.toISOString(),
        endAt: offer.endAt?.toISOString() ?? '',
        branchCity: offer.branch.city,
        merchantName: offer.merchant.name,
      }))

      csv = generateCsv(headers, rows)
      recordCount = offers.length
    } else if (type === 'redemptions') {
      const redemptions = await prisma.redemption.findMany({
        take: limit,
        orderBy: { redeemedAt: 'desc' },
        include: {
          offer: { select: { title: true } },
          branch: { select: { city: true } },
          merchant: { select: { name: true } },
        },
      })

      const headers = ['id', 'redeemedAt', 'status', 'offerTitle', 'branchCity', 'merchantName']

      const rows = redemptions.map((redemption) => ({
        id: redemption.id,
        redeemedAt: redemption.redeemedAt.toISOString(),
        status: redemption.status,
        offerTitle: redemption.offer.title,
        branchCity: redemption.branch.city,
        merchantName: redemption.merchant.name,
      }))

      csv = generateCsv(headers, rows)
      recordCount = redemptions.length
    } else if (type === 'complaints') {
      const complaints = await prisma.complaint.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      })

      const headers = ['id', 'type', 'priority', 'status', 'createdAt']

      const rows = complaints.map((complaint) => ({
        id: complaint.id,
        type: complaint.type,
        priority: complaint.priority,
        status: complaint.status,
        createdAt: complaint.createdAt.toISOString(),
      }))

      csv = generateCsv(headers, rows)
      recordCount = complaints.length
    } else if (type === 'businesses') {
      const businesses = await prisma.business.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          createdAt: true,
          _count: { select: { places: true, offers: true } },
        },
      })

      const headers = ['id', 'name', 'type', 'status', 'createdAt', 'placeCount', 'offerCount']

      const rows = businesses.map((business) => ({
        id: business.id,
        name: business.name,
        type: business.type,
        status: business.status,
        createdAt: business.createdAt.toISOString(),
        placeCount: business._count.places,
        offerCount: business._count.offers,
      }))

      csv = generateCsv(headers, rows)
      recordCount = businesses.length
    }

    await createAuditEntry({
      actorId: session.userId,
      actorRole: session.role,
      action: AuditAction.EXPORT,
      entityType: `export:${type}`,
      entityId: 'batch',
      metadata: { recordCount, limit },
      req,
    })

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${FILENAMES[type]}"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при формировании экспорта' },
      { status: 500 }
    )
  }
}
