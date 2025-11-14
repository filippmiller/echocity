import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: {
        isActive: true,
      },
      include: {
        serviceTypes: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении категорий услуг' },
      { status: 500 }
    )
  }
}

