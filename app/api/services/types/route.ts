import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')

    const where: any = {
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
    })

    return NextResponse.json({ types })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении типов услуг' },
      { status: 500 }
    )
  }
}

