import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'

// Helper endpoint to get franchises list for dropdowns
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const franchises = await prisma.franchise.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
      },
      where: {
        status: {
          in: ['ACTIVE', 'DRAFT'],
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ franchises })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении списка франшиз' },
      { status: 500 }
    )
  }
}



