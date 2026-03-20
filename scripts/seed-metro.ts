/**
 * seed-metro.ts
 * Utility script: maps St. Petersburg metro stations to coordinates,
 * then for each Place with lat/lng computes the nearest metro station
 * within 1.5km and sets nearestMetro.
 *
 * Run with: npx tsx scripts/seed-metro.ts
 */

import { prisma } from '../lib/prisma'

const SPB_METRO_STATIONS: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Невский проспект',         lat: 59.9350, lng: 30.3271 },
  { name: 'Гостиный двор',            lat: 59.9334, lng: 30.3329 },
  { name: 'Адмиралтейская',           lat: 59.9355, lng: 30.3155 },
  { name: 'Сенная площадь',           lat: 59.9268, lng: 30.3199 },
  { name: 'Василеостровская',         lat: 59.9435, lng: 30.2727 },
  { name: 'Петроградская',            lat: 59.9668, lng: 30.3116 },
  { name: 'Чернышевская',             lat: 59.9449, lng: 30.3602 },
  { name: 'Площадь Восстания',        lat: 59.9313, lng: 30.3607 },
  { name: 'Маяковская',               lat: 59.9296, lng: 30.3546 },
  { name: 'Технологический институт', lat: 59.9161, lng: 30.3204 },
  { name: 'Звёздная',                 lat: 59.8331, lng: 30.3490 },
  { name: 'Московская',               lat: 59.8487, lng: 30.3208 },
  { name: 'Пионерская',               lat: 60.0029, lng: 30.2965 },
  { name: 'Чёрная речка',             lat: 59.9869, lng: 30.2967 },
  { name: 'Озерки',                   lat: 60.0422, lng: 30.3232 },
  { name: 'Площадь Ленина',           lat: 59.9558, lng: 30.3561 },
  { name: 'Горьковская',              lat: 59.9536, lng: 30.3176 },
  { name: 'Спортивная',               lat: 59.9520, lng: 30.2896 },
  { name: 'Приморская',               lat: 59.9499, lng: 30.2420 },
  { name: 'Садовая',                  lat: 59.9258, lng: 30.3185 },
  { name: 'Балтийская',               lat: 59.9072, lng: 30.2989 },
  { name: 'Нарвская',                 lat: 59.8999, lng: 30.2738 },
  { name: 'Купчино',                  lat: 59.8299, lng: 30.3790 },
  { name: 'Проспект Ветеранов',        lat: 59.8425, lng: 30.2508 },
  { name: 'Ленинский проспект',       lat: 59.8485, lng: 30.2632 },
  { name: 'Автово',                   lat: 59.8671, lng: 30.2512 },
]

/** Haversine distance in km */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function findNearestMetro(lat: number, lng: number): string | null {
  let nearest: string | null = null
  let minDist = Infinity

  for (const station of SPB_METRO_STATIONS) {
    const dist = haversine(lat, lng, station.lat, station.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = station.name
    }
  }

  // Only assign if within 1.5km
  return minDist <= 1.5 ? nearest : null
}

async function main() {
  console.log('Fetching places with coordinates...')

  const places = await prisma.place.findMany({
    where: {
      OR: [
        { lat: { not: null }, lng: { not: null } },
        { latitude: { not: null }, longitude: { not: null } },
      ],
    },
    select: { id: true, lat: true, lng: true, latitude: true, longitude: true, city: true },
  })

  console.log(`Found ${places.length} places with coordinates`)

  let updated = 0
  let skipped = 0

  for (const place of places) {
    const lat = place.lat ?? place.latitude
    const lng = place.lng ?? place.longitude

    if (lat == null || lng == null) {
      skipped++
      continue
    }

    const metro = findNearestMetro(lat, lng)

    if (metro) {
      await prisma.place.update({
        where: { id: place.id },
        data: { nearestMetro: metro },
      })
      updated++
      console.log(`  ✓ ${place.id} (${place.city}) → м. ${metro}`)
    } else {
      skipped++
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (no metro within 1.5km or missing coords)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
