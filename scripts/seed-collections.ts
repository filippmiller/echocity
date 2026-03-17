/**
 * Seed script for initial collections.
 * Run: npx tsx scripts/seed-collections.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Collection 1: Best coffee shops
  const coffeePlaces = await prisma.place.findMany({
    where: { placeType: 'CAFE', isActive: true },
    take: 3,
    orderBy: { createdAt: 'asc' },
  })

  const coffeeCollection = await prisma.collection.upsert({
    where: { slug: 'luchshie-kofejni' },
    update: {},
    create: {
      title: 'Лучшие кофейни',
      slug: 'luchshie-kofejni',
      description: 'Топовые кофейни города со скидками',
      type: 'EDITORIAL',
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
    },
  })

  for (let i = 0; i < coffeePlaces.length; i++) {
    await prisma.collectionItem.upsert({
      where: {
        collectionId_entityType_entityId: {
          collectionId: coffeeCollection.id,
          entityType: 'place',
          entityId: coffeePlaces[i].id,
        },
      },
      update: {},
      create: {
        collectionId: coffeeCollection.id,
        entityType: 'place',
        entityId: coffeePlaces[i].id,
        sortOrder: i,
      },
    })
  }

  console.log(`Coffee collection: ${coffeePlaces.length} places`)

  // Collection 2: Flash deals today
  const flashOffers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      offerType: 'FLASH',
      endAt: { gt: new Date() },
    },
    take: 3,
    orderBy: { endAt: 'asc' },
  })

  const flashCollection = await prisma.collection.upsert({
    where: { slug: 'flash-skidki-segodnya' },
    update: {},
    create: {
      title: 'Flash-скидки сегодня',
      slug: 'flash-skidki-segodnya',
      description: 'Горящие предложения — не упустите',
      type: 'ALGORITHMIC',
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
    },
  })

  for (let i = 0; i < flashOffers.length; i++) {
    await prisma.collectionItem.upsert({
      where: {
        collectionId_entityType_entityId: {
          collectionId: flashCollection.id,
          entityType: 'offer',
          entityId: flashOffers[i].id,
        },
      },
      update: {},
      create: {
        collectionId: flashCollection.id,
        entityType: 'offer',
        entityId: flashOffers[i].id,
        sortOrder: i,
      },
    })
  }

  console.log(`Flash collection: ${flashOffers.length} offers`)

  // Collection 3: New on platform
  const newOffers = await prisma.offer.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
  })

  const newCollection = await prisma.collection.upsert({
    where: { slug: 'novye-na-platforme' },
    update: {},
    create: {
      title: 'Новые на платформе',
      slug: 'novye-na-platforme',
      description: 'Свежие предложения, только что появились',
      type: 'ALGORITHMIC',
      isFeatured: true,
      isActive: true,
      sortOrder: 3,
    },
  })

  for (let i = 0; i < newOffers.length; i++) {
    await prisma.collectionItem.upsert({
      where: {
        collectionId_entityType_entityId: {
          collectionId: newCollection.id,
          entityType: 'offer',
          entityId: newOffers[i].id,
        },
      },
      update: {},
      create: {
        collectionId: newCollection.id,
        entityType: 'offer',
        entityId: newOffers[i].id,
        sortOrder: i,
      },
    })
  }

  console.log(`New collection: ${newOffers.length} offers`)
  console.log('Done seeding collections.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
