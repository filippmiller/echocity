import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const updateServiceSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  priceUnit: z.enum(['FIXED', 'PER_HOUR', 'PER_ITEM', 'PER_KG', 'PER_SQ_M']).optional(),
  durationMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  // Specials fields
  isSpecial: z.boolean().optional(),
  specialPrice: z.number().optional(),
  specialTitle: z.string().optional(),
  specialDescription: z.string().optional(),
  specialValidUntil: z.string().datetime().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string; serviceId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'BUSINESS_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { placeId, serviceId } = await params

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
    const validated = updateServiceSchema.parse(body)

    const updateData: any = {}
    
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.price !== undefined) updateData.price = validated.price ? validated.price.toString() : null
    if (validated.priceUnit !== undefined) updateData.priceUnit = validated.priceUnit
    if (validated.durationMinutes !== undefined) updateData.durationMinutes = validated.durationMinutes
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive
    // Specials
    if (validated.isSpecial !== undefined) updateData.isSpecial = validated.isSpecial
    if (validated.specialPrice !== undefined) updateData.specialPrice = validated.specialPrice ? validated.specialPrice.toString() : null
    if (validated.specialTitle !== undefined) updateData.specialTitle = validated.specialTitle
    if (validated.specialDescription !== undefined) updateData.specialDescription = validated.specialDescription
    if (validated.specialValidUntil !== undefined) updateData.specialValidUntil = validated.specialValidUntil ? new Date(validated.specialValidUntil) : null

    const service = await prisma.placeService.update({
      where: {
        id: serviceId,
        placeId, // Ensure service belongs to this place
      },
      data: updateData,
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

    logger.info('business.place.service.updated', {
      placeId,
      serviceId,
    })

    return NextResponse.json({ service })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('business.place.service.update.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при обновлении услуги' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string; serviceId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'BUSINESS_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { placeId, serviceId } = await params

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

    await prisma.placeService.delete({
      where: {
        id: serviceId,
        placeId, // Ensure service belongs to this place
      },
    })

    logger.info('business.place.service.deleted', {
      placeId,
      serviceId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('business.place.service.delete.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при удалении услуги' },
      { status: 500 }
    )
  }
}


