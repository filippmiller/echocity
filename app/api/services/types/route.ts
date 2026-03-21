import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')

    const where: { isActive: boolean; categoryId?: string } = {
      isActive: true,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const types = await prisma.serviceType.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
      take: 500,
    })

    return NextResponse.json({ types })
  } catch (error) {
    logger.error('services.types.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении типов услуг' },
      { status: 500 }
    )
  }
}


