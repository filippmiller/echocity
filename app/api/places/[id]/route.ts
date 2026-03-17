import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params

  const place = await prisma.place.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      publicName: true,
      address: true,
      city: true,
      phone: true,
      placeType: true,
      openingHours: true,
      isActive: true,
    },
  })

  if (!place || !place.isActive) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
  }

  return NextResponse.json({ place })
}
