import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          category: {
            sortOrder: 'asc',
          },
        },
        {
          sortOrder: 'asc',
        },
      ],
      take: 500,
    })

    const formatted = serviceTypes.map((st) => ({
      id: st.id,
      name: st.name,
      categoryName: st.category.name,
    }))

    return NextResponse.json({ serviceTypes: formatted })
  } catch (error) {
    logger.error('public.service-types.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении списка услуг' },
      { status: 500 }
    )
  }
}




