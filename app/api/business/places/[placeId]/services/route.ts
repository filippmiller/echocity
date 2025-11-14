import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const createServiceSchema = z.object({
  serviceTypeId: z.string().min(1, 'Тип услуги обязателен'),
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  priceUnit: z.enum(['FIXED', 'PER_HOUR', 'PER_ITEM', 'PER_KG', 'PER_SQ_M']).optional(),
  durationMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const placeId = params.placeId

    // Check if user owns this place
    const place = await prisma.place.findFirst({
      where: {
        id: placeId,
        OR: [
          { business: { ownerId: session.userId } },
          { businessAccount: { ownerUserId: session.userId } },
        ],
      },
    })

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    const services = await prisma.placeService.findMany({
      where: {
        placeId,
      },
      include: {
        serviceType: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ services })
  } catch (error) {
    logger.error('business.place.services.list.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении услуг' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'BUSINESS_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const placeId = params.placeId

    // Check if user owns this place
    const place = await prisma.place.findFirst({
      where: {
        id: placeId,
        OR: [
          { business: { ownerId: session.userId } },
          { businessAccount: { ownerUserId: session.userId } },
        ],
      },
    })

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createServiceSchema.parse(body)

    // Check if service already exists
    const existing = await prisma.placeService.findUnique({
      where: {
        placeId_serviceTypeId: {
          placeId,
          serviceTypeId: validated.serviceTypeId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Эта услуга уже добавлена' },
        { status: 409 }
      )
    }

    const service = await prisma.placeService.create({
      data: {
        placeId,
        serviceTypeId: validated.serviceTypeId,
        name: validated.name,
        description: validated.description,
        price: validated.price ? validated.price.toString() : null,
        priceUnit: validated.priceUnit || 'FIXED',
        durationMinutes: validated.durationMinutes,
        isActive: validated.isActive ?? true,
      },
      include: {
        serviceType: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    logger.info('business.place.service.created', {
      placeId,
      serviceId: service.id,
      serviceTypeId: validated.serviceTypeId,
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('business.place.service.create.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при создании услуги' },
      { status: 500 }
    )
  }
}

