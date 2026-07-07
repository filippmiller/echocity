/**
 * District / neighborhood data and helpers.
 */

import { prisma } from '@/lib/prisma'

export interface DistrictSeed {
  slug: string
  name: string
  lat?: number
  lng?: number
}

export const DEFAULT_DISTRICTS: Record<string, DistrictSeed[]> = {
  spb: [
    { slug: 'nevsky', name: 'Невский проспект', lat: 59.9343, lng: 30.3351 },
    { slug: 'petrogradsky', name: 'Петроградская сторона', lat: 59.9654, lng: 30.3112 },
    { slug: 'vasileostrovsky', name: 'Василеостровский район', lat: 59.942, lng: 30.255 },
    { slug: 'centralny', name: 'Центральный район', lat: 59.939, lng: 30.315 },
    { slug: 'admiralteysky', name: 'Адмиралтейский район', lat: 59.93, lng: 30.3 },
  ],
  moscow: [
    { slug: 'tverskoy', name: 'Тверской район', lat: 55.765, lng: 37.605 },
    { slug: 'presnensky', name: 'Пресненский район', lat: 55.75, lng: 37.55 },
    { slug: 'hamovniki', name: 'Хамовники', lat: 55.735, lng: 37.575 },
    { slug: 'basmaniy', name: 'Басманный район', lat: 55.765, lng: 37.65 },
    { slug: 'arbat', name: 'Арбат', lat: 55.75, lng: 37.59 },
  ],
}

export async function seedDistricts(): Promise<void> {
  for (const [citySlug, districts] of Object.entries(DEFAULT_DISTRICTS)) {
    const city = await prisma.city.findUnique({ where: { slug: citySlug } })
    if (!city) continue

    for (const district of districts) {
      await prisma.district.upsert({
        where: { cityId_slug: { cityId: city.id, slug: district.slug } },
        update: { name: district.name, lat: district.lat ?? null, lng: district.lng ?? null },
        create: {
          cityId: city.id,
          slug: district.slug,
          name: district.name,
          lat: district.lat ?? null,
          lng: district.lng ?? null,
        },
      })
    }
  }
}

export async function getDistrictsByCitySlug(citySlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!city) return []
  return prisma.district.findMany({
    where: { cityId: city.id },
    orderBy: { name: 'asc' },
  })
}
