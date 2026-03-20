import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Resolve all businesses owned by this user
  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  if (merchantIds.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  // Resolve all active places belonging to these businesses
  const places = await prisma.place.findMany({
    where: { businessId: { in: merchantIds }, isActive: true },
    select: { id: true, title: true },
  })
  const placeIds = places.map((p) => p.id)
  const placeMap = new Map(places.map((p) => [p.id, p.title]))

  if (placeIds.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  // Fetch open/collecting demands for merchant's places
  const demands = await prisma.demandRequest.findMany({
    where: {
      placeId: { in: placeIds },
      status: { in: ['OPEN', 'COLLECTING'] },
    },
    select: {
      id: true,
      placeId: true,
      supportCount: true,
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { supportCount: 'desc' },
    take: 200,
  })

  // Aggregate demands by (placeId, categoryId) — sum supportCount and count demand entries
  interface AggKey {
    placeId: string
    categoryId: string
    categoryName: string
    placeName: string
    demandCount: number
    supportCount: number
  }

  const aggMap = new Map<string, AggKey>()

  for (const demand of demands) {
    if (!demand.placeId || !demand.category) continue
    const key = `${demand.placeId}::${demand.category.id}`
    const existing = aggMap.get(key)
    if (existing) {
      existing.demandCount++
      existing.supportCount += demand.supportCount
    } else {
      aggMap.set(key, {
        placeId: demand.placeId,
        categoryId: demand.category.id,
        categoryName: demand.category.name,
        placeName: placeMap.get(demand.placeId) ?? 'Заведение',
        demandCount: 1,
        supportCount: demand.supportCount,
      })
    }
  }

  // Sort by supportCount desc, take top 3
  const sorted = Array.from(aggMap.values()).sort((a, b) => b.supportCount - a.supportCount)
  const top3 = sorted.slice(0, 3)

  const suggestions = top3.map((agg) => ({
    categoryName: agg.categoryName,
    demandCount: agg.demandCount,
    supportCount: agg.supportCount,
    placeName: agg.placeName,
    placeId: agg.placeId,
    message: `${agg.demandCount} ${pluralPeople(agg.demandCount)} хотят скидку на ${agg.categoryName.toLowerCase()} в ${agg.placeName}`,
  }))

  return NextResponse.json({ suggestions })
}

function pluralPeople(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'человек'
  if (mod10 === 1) return 'человек'
  if (mod10 >= 2 && mod10 <= 4) return 'человека'
  return 'человек'
}
