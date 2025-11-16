import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    })

    const formatted = serviceTypes.map((st) => ({
      id: st.id,
      name: st.name,
      categoryName: st.category.name,
    }))

    return NextResponse.json({ serviceTypes: formatted })
  } catch (error) {
    console.error('Service types error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка услуг' },
      { status: 500 }
    )
  }
}


