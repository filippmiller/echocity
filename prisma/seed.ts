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

  // Seed subscription plans
  const plans = [
    {
      code: 'free',
      name: 'Бесплатный',
      monthlyPrice: 0,
      currency: 'RUB',
      features: { maxOffers: 5, visibility: ['FREE_FOR_ALL'] },
      trialDays: 0,
      sortOrder: 0,
    },
    {
      code: 'plus',
      name: 'Plus',
      monthlyPrice: 19900,
      currency: 'RUB',
      features: { maxOffers: -1, visibility: ['FREE_FOR_ALL', 'MEMBERS_ONLY', 'PUBLIC'] },
      trialDays: 7,
      sortOrder: 1,
    },
    {
      code: 'premium',
      name: 'Premium',
      monthlyPrice: 49900,
      currency: 'RUB',
      features: { maxOffers: -1, visibility: ['FREE_FOR_ALL', 'MEMBERS_ONLY', 'PUBLIC'], flash: true, priorityDemand: true },
      trialDays: 7,
      sortOrder: 2,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    })
  }
  console.log('✅ Seeded subscription plans')

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


