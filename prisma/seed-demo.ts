import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo data...')

  // Run base seed first (cities, categories, plans)
  const spb = await prisma.city.upsert({
    where: { slug: 'spb' },
    update: {},
    create: { name: 'Санкт-Петербург', slug: 'spb', countryCode: 'RU', timezone: 'Europe/Moscow', defaultLanguage: 'ru' },
  })

  await prisma.city.upsert({
    where: { slug: 'moscow' },
    update: {},
    create: { name: 'Москва', slug: 'moscow', countryCode: 'RU', timezone: 'Europe/Moscow', defaultLanguage: 'ru' },
  })

  // Subscription plans
  for (const plan of [
    { code: 'free', name: 'Бесплатный', monthlyPrice: 0, currency: 'RUB', features: { maxOffers: 5 }, trialDays: 0, sortOrder: 0 },
    { code: 'plus', name: 'Plus', monthlyPrice: 19900, currency: 'RUB', features: { maxOffers: -1 }, trialDays: 7, sortOrder: 1 },
    { code: 'premium', name: 'Premium', monthlyPrice: 49900, currency: 'RUB', features: { maxOffers: -1, flash: true }, trialDays: 7, sortOrder: 2 },
  ]) {
    await prisma.subscriptionPlan.upsert({ where: { code: plan.code }, update: plan, create: plan })
  }

  const hash = await bcrypt.hash('password123', 10)

  // === USERS ===
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gdesejchas.ru' },
    update: {},
    create: { email: 'admin@gdesejchas.ru', passwordHash: hash, role: 'ADMIN', firstName: 'Админ', lastName: 'Тестов', city: 'Санкт-Петербург' },
  })

  const citizen = await prisma.user.upsert({
    where: { email: 'user@test.ru' },
    update: {},
    create: { email: 'user@test.ru', passwordHash: hash, role: 'CITIZEN', firstName: 'Иван', lastName: 'Петров', city: 'Санкт-Петербург' },
  })

  const owner = await prisma.user.upsert({
    where: { email: 'owner@test.ru' },
    update: {},
    create: { email: 'owner@test.ru', passwordHash: hash, role: 'BUSINESS_OWNER', firstName: 'Мария', lastName: 'Владимирова', city: 'Санкт-Петербург' },
  })

  console.log('Created users: admin, citizen, business owner')

  // === BUSINESSES ===
  const cafe = await prisma.business.upsert({
    where: { id: 'biz-cafe-demo' },
    update: {},
    create: {
      id: 'biz-cafe-demo',
      ownerId: owner.id,
      name: 'Кофейня "Облако"',
      type: 'CAFE',
      description: 'Уютная кофейня с авторскими десертами и specialty кофе',
      status: 'APPROVED',
      supportEmail: 'info@oblako-coffee.ru',
    },
  })

  const salon = await prisma.business.upsert({
    where: { id: 'biz-salon-demo' },
    update: {},
    create: {
      id: 'biz-salon-demo',
      ownerId: owner.id,
      name: 'Салон красоты "Прима"',
      type: 'BEAUTY',
      description: 'Полный спектр услуг красоты: маникюр, педикюр, стрижки, окрашивание',
      status: 'APPROVED',
      supportEmail: 'info@prima-beauty.ru',
    },
  })

  const restaurant = await prisma.business.upsert({
    where: { id: 'biz-resto-demo' },
    update: {},
    create: {
      id: 'biz-resto-demo',
      ownerId: owner.id,
      name: 'Ресторан "Дом"',
      type: 'RESTAURANT',
      description: 'Авторская кухня с сезонным меню из локальных продуктов',
      status: 'APPROVED',
      supportEmail: 'info@dom-restaurant.ru',
    },
  })

  console.log('Created businesses: cafe, salon, restaurant')

  // === PLACES (branches) ===
  const cafeBranch = await prisma.place.upsert({
    where: { id: 'place-cafe-nevsky' },
    update: {},
    create: {
      id: 'place-cafe-nevsky',
      businessId: cafe.id,
      title: 'Кофейня Облако — Невский',
      city: 'Санкт-Петербург',
      address: 'Невский пр., 42',
      lat: 59.9343,
      lng: 30.3351,
      placeType: 'CAFE',
      hasWifi: true,
      hasSockets: true,
      isSpecialtyCoffee: true,
      averageCheck: 450,
      isActive: true,
    },
  })

  const cafeBranch2 = await prisma.place.upsert({
    where: { id: 'place-cafe-petro' },
    update: {},
    create: {
      id: 'place-cafe-petro',
      businessId: cafe.id,
      title: 'Кофейня Облако — Петроградская',
      city: 'Санкт-Петербург',
      address: 'Большой пр. П.С., 18',
      lat: 59.9654,
      lng: 30.3112,
      placeType: 'CAFE',
      hasWifi: true,
      averageCheck: 400,
      isActive: true,
    },
  })

  const salonBranch = await prisma.place.upsert({
    where: { id: 'place-salon-liteiny' },
    update: {},
    create: {
      id: 'place-salon-liteiny',
      businessId: salon.id,
      title: 'Салон Прима — Литейный',
      city: 'Санкт-Петербург',
      address: 'Литейный пр., 20',
      lat: 59.9409,
      lng: 30.3490,
      placeType: 'BEAUTY',
      averageCheck: 2500,
      isActive: true,
    },
  })

  const restoBranch = await prisma.place.upsert({
    where: { id: 'place-resto-rubinshteina' },
    update: {},
    create: {
      id: 'place-resto-rubinshteina',
      businessId: restaurant.id,
      title: 'Ресторан Дом — Рубинштейна',
      city: 'Санкт-Петербург',
      address: 'ул. Рубинштейна, 13',
      lat: 59.9303,
      lng: 30.3446,
      placeType: 'RESTAURANT',
      averageCheck: 1800,
      isActive: true,
    },
  })

  console.log('Created places (branches): 4 locations')

  // === OFFERS ===
  const now = new Date()
  const in7days = new Date(now.getTime() + 7 * 24 * 3600000)
  const in2hours = new Date(now.getTime() + 2 * 3600000)
  const in30days = new Date(now.getTime() + 30 * 24 * 3600000)

  const offersData = [
    {
      id: 'offer-1',
      merchantId: cafe.id,
      branchId: cafeBranch.id,
      title: 'Кофе + десерт за 299₽',
      subtitle: 'Любой кофе и авторский десерт',
      offerType: 'FIXED_PRICE' as const,
      visibility: 'FREE_FOR_ALL' as const,
      benefitType: 'FIXED_PRICE' as const,
      benefitValue: 299,
      approvalStatus: 'APPROVED' as const,
      lifecycleStatus: 'ACTIVE' as const,
      startAt: now,
      endAt: in30days,
    },
    {
      id: 'offer-2',
      merchantId: cafe.id,
      branchId: cafeBranch2.id,
      title: '-30% на второй капучино',
      subtitle: 'Specialty кофе каждый день',
      offerType: 'PERCENT_DISCOUNT' as const,
      visibility: 'FREE_FOR_ALL' as const,
      benefitType: 'PERCENT' as const,
      benefitValue: 30,
      approvalStatus: 'APPROVED' as const,
      lifecycleStatus: 'ACTIVE' as const,
      startAt: now,
      endAt: in30days,
    },
    {
      id: 'offer-3',
      merchantId: salon.id,
      branchId: salonBranch.id,
      title: 'Маникюр + покрытие за 1200₽',
      subtitle: 'Гель-лак в подарок к маникюру',
      offerType: 'FIXED_PRICE' as const,
      visibility: 'MEMBERS_ONLY' as const,
      benefitType: 'FIXED_PRICE' as const,
      benefitValue: 1200,
      approvalStatus: 'APPROVED' as const,
      lifecycleStatus: 'ACTIVE' as const,
      startAt: now,
      endAt: in30days,
    },
    {
      id: 'offer-4',
      merchantId: salon.id,
      branchId: salonBranch.id,
      title: '-40% на первую стрижку',
      subtitle: 'Для новых клиентов салона',
      offerType: 'FIRST_VISIT' as const,
      visibility: 'FREE_FOR_ALL' as const,
      benefitType: 'PERCENT' as const,
      benefitValue: 40,
      approvalStatus: 'APPROVED' as const,
      lifecycleStatus: 'ACTIVE' as const,
      startAt: now,
      endAt: in30days,
    },
    {
      id: 'offer-5',
      merchantId: restaurant.id,
      branchId: restoBranch.id,
      title: 'Бизнес-ланч за 490₽',
      subtitle: 'Суп + горячее + напиток',
      offerType: 'FIXED_PRICE' as const,
      visibility: 'FREE_FOR_ALL' as const,
      benefitType: 'FIXED_PRICE' as const,
      benefitValue: 490,
      approvalStatus: 'APPROVED' as const,
      lifecycleStatus: 'ACTIVE' as const,
      startAt: now,
      endAt: in30days,
    },
    {
      id: 'offer-6',
      merchantId: restaurant.id,
      branchId: restoBranch.id,
      title: 'Flash: -50% на вино',
      subtitle: 'Только 2 часа — все вино за полцены',
      offerType: 'FLASH' as const,
      visibility: 'FREE_FOR_ALL' as const,
      benefitType: 'PERCENT' as const,
      benefitValue: 50,
      approvalStatus: 'APPROVED' as const,
      lifecycleStatus: 'ACTIVE' as const,
      startAt: now,
      endAt: in2hours,
    },
    {
      id: 'offer-7',
      merchantId: cafe.id,
      branchId: cafeBranch.id,
      title: 'Бесплатный круассан',
      subtitle: 'К заказу от 500₽ — свежий круассан в подарок',
      offerType: 'FREE_ITEM' as const,
      visibility: 'MEMBERS_ONLY' as const,
      benefitType: 'FREE_ITEM' as const,
      benefitValue: 0,
      approvalStatus: 'APPROVED' as const,
      lifecycleStatus: 'ACTIVE' as const,
      startAt: now,
      endAt: in7days,
    },
    {
      id: 'offer-8',
      merchantId: salon.id,
      branchId: salonBranch.id,
      title: '-20% на педикюр',
      subtitle: 'Классический и аппаратный',
      offerType: 'PERCENT_DISCOUNT' as const,
      visibility: 'FREE_FOR_ALL' as const,
      benefitType: 'PERCENT' as const,
      benefitValue: 20,
      approvalStatus: 'PENDING' as const,
      lifecycleStatus: 'ACTIVE' as const,
      startAt: now,
      endAt: in30days,
    },
  ]

  for (const offer of offersData) {
    const { merchantId, branchId, ...rest } = offer
    await prisma.offer.upsert({
      where: { id: offer.id },
      update: rest,
      create: {
        ...rest,
        merchant: { connect: { id: merchantId } },
        branch: { connect: { id: branchId } },
        createdBy: { connect: { id: owner.id } },
      },
    })
  }

  console.log(`Created ${offersData.length} offers (6 approved, 1 pending moderation, 1 flash)`)

  // === REVIEWS ===
  await prisma.review.upsert({
    where: { id: 'review-1' },
    update: {},
    create: {
      id: 'review-1',
      placeId: cafeBranch.id,
      userId: citizen.id,
      rating: 5,
      body: 'Лучший кофе на Невском! Десерты тоже шикарные.',
    },
  })

  await prisma.review.upsert({
    where: { id: 'review-2' },
    update: {},
    create: {
      id: 'review-2',
      placeId: salonBranch.id,
      userId: citizen.id,
      rating: 4,
      body: 'Хороший маникюр, приятная атмосфера. Немного ждала, но результат отличный.',
    },
  })

  console.log('Created reviews')

  console.log('\n=== Demo data seeded! ===')
  console.log('Login credentials (password: password123):')
  console.log('  Admin:    admin@gdesejchas.ru')
  console.log('  Citizen:  user@test.ru')
  console.log('  Business: owner@test.ru')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
