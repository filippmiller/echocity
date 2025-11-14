import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create cities
  const spb = await prisma.city.upsert({
    where: { slug: 'spb' },
    update: {},
    create: {
      name: 'Санкт-Петербург',
      slug: 'spb',
      countryCode: 'RU',
      timezone: 'Europe/Moscow',
      defaultLanguage: 'ru',
    },
  })

  console.log('✅ Created city: Санкт-Петербург (spb)')

  const moscow = await prisma.city.upsert({
    where: { slug: 'moscow' },
    update: {},
    create: {
      name: 'Москва',
      slug: 'moscow',
      countryCode: 'RU',
      timezone: 'Europe/Moscow',
      defaultLanguage: 'ru',
    },
  })

  console.log('✅ Created city: Москва (moscow)')

  // Create test franchise (optional - only if we have a user)
  // For now, cities are created without franchiseId (managed by central ADMIN)

  console.log('✅ Seed completed!')
  console.log(`   Cities created: ${spb.name}, ${moscow.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

