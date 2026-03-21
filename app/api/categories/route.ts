import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      serviceTypes: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
    take: 200,
  })

  return NextResponse.json({ categories })
}
