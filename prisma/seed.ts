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

  // Create service categories and types
  const beautyCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'beauty' },
    update: {},
    create: {
      name: 'Красота',
      slug: 'beauty',
      description: 'Услуги красоты и ухода',
      icon: '💅',
      sortOrder: 1,
    },
  })

  const hairCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'hair' },
    update: {},
    create: {
      name: 'Парикмахерские услуги',
      slug: 'hair',
      description: 'Стрижки, укладки, окрашивание',
      icon: '✂️',
      sortOrder: 2,
    },
  })

  const cleaningCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'cleaning' },
    update: {},
    create: {
      name: 'Химчистка и прачечная',
      slug: 'cleaning',
      description: 'Химчистка, стирка, чистка',
      icon: '🧺',
      sortOrder: 3,
    },
  })

  const cafeCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'food-drinks' },
    update: {},
    create: {
      name: 'Еда и напитки',
      slug: 'food-drinks',
      description: 'Кафе, рестораны, бары',
      icon: '☕',
      sortOrder: 4,
    },
  })

  console.log('✅ Created service categories')

  // Create service types
  const nailService = await prisma.serviceType.upsert({
    where: { slug: 'nail-manicure' },
    update: {},
    create: {
      categoryId: beautyCategory.id,
      name: 'Маникюр',
      slug: 'nail-manicure',
      description: 'Классический и аппаратный маникюр',
      sortOrder: 1,
    },
  })

  const pedicureService = await prisma.serviceType.upsert({
    where: { slug: 'nail-pedicure' },
    update: {},
    create: {
      categoryId: beautyCategory.id,
      name: 'Педикюр',
      slug: 'nail-pedicure',
      description: 'Классический и аппаратный педикюр',
      sortOrder: 2,
    },
  })

  const hairCutService = await prisma.serviceType.upsert({
    where: { slug: 'haircut' },
    update: {},
    create: {
      categoryId: hairCategory.id,
      name: 'Стрижка',
      slug: 'haircut',
      description: 'Мужская и женская стрижка',
      sortOrder: 1,
    },
  })

  const hairColorService = await prisma.serviceType.upsert({
    where: { slug: 'hair-coloring' },
    update: {},
    create: {
      categoryId: hairCategory.id,
      name: 'Окрашивание',
      slug: 'hair-coloring',
      description: 'Окрашивание волос',
      sortOrder: 2,
    },
  })

  const dryCleaningService = await prisma.serviceType.upsert({
    where: { slug: 'dry-cleaning' },
    update: {},
    create: {
      categoryId: cleaningCategory.id,
      name: 'Химчистка',
      slug: 'dry-cleaning',
      description: 'Химчистка одежды и текстиля',
      sortOrder: 1,
    },
  })

  const coffeeService = await prisma.serviceType.upsert({
    where: { slug: 'coffee' },
    update: {},
    create: {
      categoryId: cafeCategory.id,
      name: 'Кофе',
      slug: 'coffee',
      description: 'Эспрессо, капучино, фильтр-кофе',
      sortOrder: 1,
    },
  })

  console.log('✅ Created service types')

  console.log('✅ Seed completed!')
  console.log(`   Cities: ${spb.name}, ${moscow.name}`)
  console.log(`   Categories: ${beautyCategory.name}, ${hairCategory.name}, ${cleaningCategory.name}, ${cafeCategory.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


