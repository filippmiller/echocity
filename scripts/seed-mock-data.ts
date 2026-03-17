import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🎭 Seeding comprehensive mock data...')

  const passwordHash = await bcrypt.hash('Test1234!', 10)

  // === USERS ===
  const admin = await prisma.user.upsert({
    where: { email: 'admin@echocity.ru' },
    update: {},
    create: {
      email: 'admin@echocity.ru',
      passwordHash,
      role: 'ADMIN',
      firstName: 'Админ',
      lastName: 'Системный',
      city: 'Санкт-Петербург',
      language: 'ru',
      isActive: true,
      profile: { create: { fullName: 'Админ Системный', homeCity: 'Санкт-Петербург', preferredLanguage: 'ru' } },
    },
  })
  console.log('✅ Admin user: admin@echocity.ru / Test1234!')

  const citizen = await prisma.user.upsert({
    where: { email: 'user@echocity.ru' },
    update: {},
    create: {
      email: 'user@echocity.ru',
      passwordHash,
      role: 'CITIZEN',
      firstName: 'Алексей',
      lastName: 'Петров',
      phone: '+79001234567',
      city: 'Санкт-Петербург',
      language: 'ru',
      isActive: true,
      profile: { create: { fullName: 'Алексей Петров', homeCity: 'Санкт-Петербург', preferredLanguage: 'ru', phone: '+79001234567' } },
    },
  })
  console.log('✅ Citizen user: user@echocity.ru / Test1234!')

  const citizen2 = await prisma.user.upsert({
    where: { email: 'maria@echocity.ru' },
    update: {},
    create: {
      email: 'maria@echocity.ru',
      passwordHash,
      role: 'CITIZEN',
      firstName: 'Мария',
      lastName: 'Иванова',
      phone: '+79002345678',
      city: 'Санкт-Петербург',
      language: 'ru',
      isActive: true,
      profile: { create: { fullName: 'Мария Иванова', homeCity: 'Санкт-Петербург', preferredLanguage: 'ru', phone: '+79002345678' } },
    },
  })
  console.log('✅ Citizen user: maria@echocity.ru / Test1234!')

  // Get SPB city
  const spb = await prisma.city.findFirst({ where: { slug: 'spb' } })
  if (!spb) throw new Error('Run prisma/seed.ts first — SPB city not found')

  // === BUSINESS OWNERS + PLACES ===
  const bizOwner1 = await prisma.user.upsert({
    where: { email: 'coffee@echocity.ru' },
    update: {},
    create: {
      email: 'coffee@echocity.ru',
      passwordHash,
      role: 'BUSINESS_OWNER',
      firstName: 'Дмитрий',
      lastName: 'Кофейников',
      phone: '+79003456789',
      city: 'Санкт-Петербург',
      language: 'ru',
      isActive: true,
      profile: { create: { fullName: 'Дмитрий Кофейников', preferredLanguage: 'ru', phone: '+79003456789' } },
    },
  })

  const biz1 = await prisma.business.upsert({
    where: { id: 'biz-coffee-house' },
    update: {},
    create: {
      id: 'biz-coffee-house',
      ownerId: bizOwner1.id,
      name: 'Coffee House SPB',
      type: 'CAFE',
      description: 'Уютная кофейня в центре Санкт-Петербурга с авторскими напитками и десертами',
      status: 'APPROVED',
      supportEmail: 'coffee@echocity.ru',
      supportPhone: '+79003456789',
    },
  })

  const place1 = await prisma.place.upsert({
    where: { id: 'place-coffee-nevsky' },
    update: {},
    create: {
      id: 'place-coffee-nevsky',
      businessId: biz1.id,
      title: 'Coffee House — Невский',
      city: 'Санкт-Петербург',
      address: 'Невский проспект, 28',
      lat: 59.9343,
      lng: 30.3351,
      phone: '+79003456789',
      placeType: 'CAFE',
      hasWifi: true,
      hasSockets: true,
      isSpecialtyCoffee: true,
      isActive: true,
      isPublished: true,
      isApproved: true,
      averageCheck: 350,
    },
  })

  const place1b = await prisma.place.upsert({
    where: { id: 'place-coffee-petrogradka' },
    update: {},
    create: {
      id: 'place-coffee-petrogradka',
      businessId: biz1.id,
      title: 'Coffee House — Петроградская',
      city: 'Санкт-Петербург',
      address: 'Большой проспект П.С., 65',
      lat: 59.9632,
      lng: 30.3049,
      phone: '+79003456790',
      placeType: 'CAFE',
      hasWifi: true,
      isActive: true,
      isPublished: true,
      isApproved: true,
      averageCheck: 400,
    },
  })
  console.log('✅ Business: Coffee House SPB (coffee@echocity.ru / Test1234!) — 2 locations')

  const bizOwner2 = await prisma.user.upsert({
    where: { email: 'beauty@echocity.ru' },
    update: {},
    create: {
      email: 'beauty@echocity.ru',
      passwordHash,
      role: 'BUSINESS_OWNER',
      firstName: 'Елена',
      lastName: 'Красотова',
      phone: '+79004567890',
      city: 'Санкт-Петербург',
      language: 'ru',
      isActive: true,
      profile: { create: { fullName: 'Елена Красотова', preferredLanguage: 'ru', phone: '+79004567890' } },
    },
  })

  const biz2 = await prisma.business.upsert({
    where: { id: 'biz-beauty-studio' },
    update: {},
    create: {
      id: 'biz-beauty-studio',
      ownerId: bizOwner2.id,
      name: 'Beauty Studio Елена',
      type: 'BEAUTY',
      description: 'Салон красоты премиум-класса — маникюр, педикюр, уходы за лицом',
      status: 'APPROVED',
      supportEmail: 'beauty@echocity.ru',
    },
  })

  const place2 = await prisma.place.upsert({
    where: { id: 'place-beauty-liteiny' },
    update: {},
    create: {
      id: 'place-beauty-liteiny',
      businessId: biz2.id,
      title: 'Beauty Studio — Литейный',
      city: 'Санкт-Петербург',
      address: 'Литейный проспект, 44',
      lat: 59.9401,
      lng: 30.3490,
      phone: '+79004567890',
      placeType: 'BEAUTY',
      isActive: true,
      isPublished: true,
      isApproved: true,
      averageCheck: 2500,
    },
  })
  console.log('✅ Business: Beauty Studio (beauty@echocity.ru / Test1234!)')

  const bizOwner3 = await prisma.user.upsert({
    where: { email: 'restaurant@echocity.ru' },
    update: {},
    create: {
      email: 'restaurant@echocity.ru',
      passwordHash,
      role: 'BUSINESS_OWNER',
      firstName: 'Игорь',
      lastName: 'Ресторатор',
      phone: '+79005678901',
      city: 'Санкт-Петербург',
      language: 'ru',
      isActive: true,
      profile: { create: { fullName: 'Игорь Ресторатор', preferredLanguage: 'ru', phone: '+79005678901' } },
    },
  })

  const biz3 = await prisma.business.upsert({
    where: { id: 'biz-gastro-pub' },
    update: {},
    create: {
      id: 'biz-gastro-pub',
      ownerId: bizOwner3.id,
      name: 'Гастро-паб «Петербург»',
      type: 'RESTAURANT',
      description: 'Современная русская кухня в гастро-формате с крафтовым пивом',
      status: 'APPROVED',
    },
  })

  const place3 = await prisma.place.upsert({
    where: { id: 'place-gastro-rubinshteina' },
    update: {},
    create: {
      id: 'place-gastro-rubinshteina',
      businessId: biz3.id,
      title: 'Гастро-паб «Петербург» — Рубинштейна',
      city: 'Санкт-Петербург',
      address: 'ул. Рубинштейна, 15',
      lat: 59.9297,
      lng: 30.3452,
      phone: '+79005678901',
      placeType: 'RESTAURANT',
      hasWifi: true,
      isActive: true,
      isPublished: true,
      isApproved: true,
      averageCheck: 1200,
    },
  })
  console.log('✅ Business: Гастро-паб (restaurant@echocity.ru / Test1234!)')

  // === OFFERS ===
  const now = new Date()
  const futureEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days

  // Offer 1: Coffee 20% — free for all
  const offer1 = await prisma.offer.upsert({
    where: { id: 'offer-coffee-20' },
    update: {},
    create: {
      id: 'offer-coffee-20',
      merchantId: biz1.id,
      branchId: place1.id,
      title: '-20% на весь кофе',
      subtitle: 'Любой кофейный напиток со скидкой',
      description: 'Скидка 20% на все кофейные напитки. Действует ежедневно с 8:00 до 12:00.',
      offerType: 'PERCENT_DISCOUNT',
      visibility: 'FREE_FOR_ALL',
      benefitType: 'PERCENT',
      benefitValue: 20,
      currency: 'RUB',
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt: futureEnd,
      termsText: 'Не суммируется с другими акциями. Одно использование в день.',
      createdByUserId: bizOwner1.id,
    },
  })
  await prisma.offerSchedule.deleteMany({ where: { offerId: offer1.id } })
  for (let day = 0; day <= 6; day++) {
    await prisma.offerSchedule.create({
      data: { offerId: offer1.id, weekday: day, startTime: '08:00', endTime: '12:00', timezone: 'Europe/Moscow' },
    })
  }
  await prisma.offerLimit.upsert({
    where: { offerId: offer1.id },
    update: {},
    create: { offerId: offer1.id, dailyLimit: 50, perUserDailyLimit: 1 },
  })

  // Offer 2: Business lunch fixed price — public
  const offer2 = await prisma.offer.upsert({
    where: { id: 'offer-lunch-399' },
    update: {},
    create: {
      id: 'offer-lunch-399',
      merchantId: biz3.id,
      branchId: place3.id,
      title: 'Бизнес-ланч 399₽',
      subtitle: 'Суп + горячее + напиток',
      description: 'Полноценный бизнес-ланч: суп дня, горячее на выбор (3 варианта) и напиток.',
      offerType: 'FIXED_PRICE',
      visibility: 'PUBLIC',
      benefitType: 'FIXED_PRICE',
      benefitValue: 399,
      currency: 'RUB',
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt: futureEnd,
      termsText: 'Пн-Пт, 12:00-16:00. Меню меняется ежедневно.',
      createdByUserId: bizOwner3.id,
    },
  })
  await prisma.offerSchedule.deleteMany({ where: { offerId: offer2.id } })
  for (let day = 0; day <= 4; day++) { // Mon-Fri
    await prisma.offerSchedule.create({
      data: { offerId: offer2.id, weekday: day, startTime: '12:00', endTime: '16:00', timezone: 'Europe/Moscow' },
    })
  }

  // Offer 3: Free dessert — members only
  const offer3 = await prisma.offer.upsert({
    where: { id: 'offer-free-dessert' },
    update: {},
    create: {
      id: 'offer-free-dessert',
      merchantId: biz1.id,
      branchId: place1.id,
      title: 'Бесплатный десерт',
      subtitle: 'К любому напитку от 300₽',
      description: 'Получите десерт дня бесплатно при заказе любого напитка от 300₽. Только для подписчиков Plus и Premium.',
      offerType: 'FREE_ITEM',
      visibility: 'MEMBERS_ONLY',
      benefitType: 'FREE_ITEM',
      benefitValue: 1,
      currency: 'RUB',
      minOrderAmount: 300,
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt: futureEnd,
      termsText: 'Десерт дня на выбор бариста. Одно использование в неделю.',
      createdByUserId: bizOwner1.id,
    },
  })
  await prisma.offerLimit.upsert({
    where: { offerId: offer3.id },
    update: {},
    create: { offerId: offer3.id, perUserWeeklyLimit: 1, totalLimit: 200 },
  })

  // Offer 4: First visit discount — free for all
  const offer4 = await prisma.offer.upsert({
    where: { id: 'offer-beauty-first' },
    update: {},
    create: {
      id: 'offer-beauty-first',
      merchantId: biz2.id,
      branchId: place2.id,
      title: '-25% на первый визит',
      subtitle: 'Маникюр, педикюр или уход за лицом',
      description: 'Скидка 25% на любую услугу для новых клиентов Beauty Studio.',
      offerType: 'FIRST_VISIT',
      visibility: 'FREE_FOR_ALL',
      benefitType: 'PERCENT',
      benefitValue: 25,
      currency: 'RUB',
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt: futureEnd,
      termsText: 'Только для первого визита. Предъявите QR-код администратору.',
      createdByUserId: bizOwner2.id,
    },
  })
  await prisma.offerRule.deleteMany({ where: { offerId: offer4.id } })
  await prisma.offerRule.create({
    data: { offerId: offer4.id, ruleType: 'FIRST_TIME_ONLY', value: true },
  })

  // Offer 5: Off-peak discount — members only
  const offer5 = await prisma.offer.upsert({
    where: { id: 'offer-offpeak-gastro' },
    update: {},
    create: {
      id: 'offer-offpeak-gastro',
      merchantId: biz3.id,
      branchId: place3.id,
      title: '-20% в непиковые часы',
      subtitle: 'Скидка на всё меню Пн-Чт 14:00-17:00',
      description: 'Наслаждайтесь полным меню со скидкой 20% в будние дни в непиковые часы.',
      offerType: 'OFF_PEAK',
      visibility: 'MEMBERS_ONLY',
      benefitType: 'PERCENT',
      benefitValue: 20,
      currency: 'RUB',
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt: futureEnd,
      createdByUserId: bizOwner3.id,
    },
  })
  await prisma.offerSchedule.deleteMany({ where: { offerId: offer5.id } })
  for (let day = 0; day <= 3; day++) { // Mon-Thu
    await prisma.offerSchedule.create({
      data: { offerId: offer5.id, weekday: day, startTime: '14:00', endTime: '17:00', timezone: 'Europe/Moscow' },
    })
  }

  // Offer 6: Flash deal — free for all
  const offer6 = await prisma.offer.upsert({
    where: { id: 'offer-flash-coffee' },
    update: {},
    create: {
      id: 'offer-flash-coffee',
      merchantId: biz1.id,
      branchId: place1b.id,
      title: '-30% на 90 минут!',
      subtitle: 'Flash-скидка на Петроградской',
      description: 'Молниеносная скидка 30% на все напитки! Действует только 90 минут.',
      offerType: 'FLASH',
      visibility: 'FREE_FOR_ALL',
      benefitType: 'PERCENT',
      benefitValue: 30,
      currency: 'RUB',
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt: new Date(now.getTime() + 90 * 60 * 1000), // 90 min
      termsText: 'Одно использование на человека.',
      createdByUserId: bizOwner1.id,
    },
  })
  await prisma.offerLimit.upsert({
    where: { offerId: offer6.id },
    update: {},
    create: { offerId: offer6.id, totalLimit: 20, perUserLifetimeLimit: 1 },
  })

  // Offer 7: Bundle — members only
  const offer7 = await prisma.offer.upsert({
    where: { id: 'offer-bundle-coffee' },
    update: {},
    create: {
      id: 'offer-bundle-coffee',
      merchantId: biz1.id,
      branchId: place1.id,
      title: '2 кофе по цене 1',
      subtitle: 'Приходите с другом',
      description: 'Закажите два любых кофейных напитка — второй бесплатно. Только для подписчиков.',
      offerType: 'BUNDLE',
      visibility: 'MEMBERS_ONLY',
      benefitType: 'BUNDLE',
      benefitValue: 2,
      currency: 'RUB',
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt: futureEnd,
      createdByUserId: bizOwner1.id,
    },
  })

  // Offer 8: Draft (for testing merchant flow)
  const offer8 = await prisma.offer.upsert({
    where: { id: 'offer-draft-beauty' },
    update: {},
    create: {
      id: 'offer-draft-beauty',
      merchantId: biz2.id,
      branchId: place2.id,
      title: '-15% на окрашивание',
      subtitle: 'Новая акция (черновик)',
      description: 'Скидка на окрашивание волос — готовится к публикации.',
      offerType: 'PERCENT_DISCOUNT',
      visibility: 'PUBLIC',
      benefitType: 'PERCENT',
      benefitValue: 15,
      currency: 'RUB',
      approvalStatus: 'DRAFT',
      lifecycleStatus: 'INACTIVE',
      startAt: now,
      endAt: futureEnd,
      createdByUserId: bizOwner2.id,
    },
  })

  // Offer 9: Pending moderation
  const offer9 = await prisma.offer.upsert({
    where: { id: 'offer-pending-gastro' },
    update: {},
    create: {
      id: 'offer-pending-gastro',
      merchantId: biz3.id,
      branchId: place3.id,
      title: 'Счастливый час: -40% на крафт',
      subtitle: 'На модерации',
      description: 'Скидка 40% на все крафтовое пиво с 17:00 до 19:00.',
      offerType: 'OFF_PEAK',
      visibility: 'PUBLIC',
      benefitType: 'PERCENT',
      benefitValue: 40,
      currency: 'RUB',
      approvalStatus: 'PENDING',
      lifecycleStatus: 'INACTIVE',
      startAt: now,
      endAt: futureEnd,
      createdByUserId: bizOwner3.id,
    },
  })

  console.log('✅ Created 9 offers (6 active, 1 draft, 1 pending, 1 flash)')

  // === MERCHANT STAFF ===
  const staffUser = await prisma.user.upsert({
    where: { email: 'cashier@echocity.ru' },
    update: {},
    create: {
      email: 'cashier@echocity.ru',
      passwordHash,
      role: 'MERCHANT_STAFF',
      firstName: 'Анна',
      lastName: 'Кассирова',
      phone: '+79006789012',
      city: 'Санкт-Петербург',
      language: 'ru',
      isActive: true,
      profile: { create: { fullName: 'Анна Кассирова', preferredLanguage: 'ru' } },
    },
  })

  await prisma.merchantStaff.upsert({
    where: { merchantId_userId: { merchantId: biz1.id, userId: staffUser.id } },
    update: {},
    create: {
      merchantId: biz1.id,
      branchId: place1.id,
      userId: staffUser.id,
      staffRole: 'CASHIER',
      isActive: true,
    },
  })
  console.log('✅ Staff: cashier@echocity.ru / Test1234! (Cashier at Coffee House)')

  // === DEMAND REQUESTS ===
  // Place without offers — for "Хочу скидку" testing
  const placeNoOffers = await prisma.place.upsert({
    where: { id: 'place-no-offers-bar' },
    update: {},
    create: {
      id: 'place-no-offers-bar',
      businessId: biz3.id,
      title: 'Бар «Ночной город»',
      city: 'Санкт-Петербург',
      address: 'ул. Жуковского, 10',
      lat: 59.9370,
      lng: 30.3555,
      placeType: 'BAR',
      isActive: true,
      isPublished: true,
      isApproved: true,
    },
  })

  await prisma.demandRequest.upsert({
    where: { id: 'demand-bar-discount' },
    update: {},
    create: {
      id: 'demand-bar-discount',
      userId: citizen.id,
      placeId: placeNoOffers.id,
      cityId: spb.id,
      lat: 59.9370,
      lng: 30.3555,
      status: 'OPEN',
      supportCount: 3,
    },
  })
  console.log('✅ Demand request for «Ночной город» (3 supporters)')

  // === SUBSCRIPTIONS — give citizen2 a Plus subscription ===
  const plusPlan = await prisma.subscriptionPlan.findUnique({ where: { code: 'plus' } })
  if (plusPlan) {
    await prisma.userSubscription.upsert({
      where: { id: 'sub-maria-plus' },
      update: {},
      create: {
        id: 'sub-maria-plus',
        userId: citizen2.id,
        planId: plusPlan.id,
        status: 'ACTIVE',
        startAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endAt: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
    })
    console.log('✅ Maria has active Plus subscription')
  }

  console.log('\n🎉 Mock data seeding complete!')
  console.log('\n📋 Test Accounts:')
  console.log('  Admin:    admin@echocity.ru / Test1234!')
  console.log('  Citizen:  user@echocity.ru / Test1234! (no subscription)')
  console.log('  Citizen2: maria@echocity.ru / Test1234! (Plus subscriber)')
  console.log('  Business: coffee@echocity.ru / Test1234! (Coffee House)')
  console.log('  Business: beauty@echocity.ru / Test1234! (Beauty Studio)')
  console.log('  Business: restaurant@echocity.ru / Test1234! (Гастро-паб)')
  console.log('  Cashier:  cashier@echocity.ru / Test1234! (Staff)')
}

main()
  .catch((e) => {
    console.error('❌ Mock data seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
