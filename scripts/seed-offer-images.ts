/**
 * Assigns curated Unsplash images to offers based on merchant type / offer category.
 * Also cleans up QA test offers from the scenario matrix.
 *
 * Usage:
 *   REMOTE_DATABASE_URL=postgresql://... npx tsx scripts/seed-offer-images.ts
 *   # Or for local DB:
 *   npx tsx scripts/seed-offer-images.ts
 */

import { PrismaClient } from '@prisma/client'

const remoteUrl = process.env.REMOTE_DATABASE_URL
const prisma = new PrismaClient({
  datasourceUrl: remoteUrl
    ? `${remoteUrl}${remoteUrl.includes('?') ? '&' : '?'}connect_timeout=30&pool_timeout=30`
    : undefined,
})

// Curated Unsplash images — high quality, commercial-safe, categorized
// Format: https://images.unsplash.com/photo-{ID}?w=800&h=500&fit=crop&q=80
const IMAGES = {
  coffee: [
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=500&fit=crop&q=80', // latte art
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=500&fit=crop&q=80', // coffee cup
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=500&fit=crop&q=80', // café interior
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=500&fit=crop&q=80', // espresso
    'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&h=500&fit=crop&q=80', // coffee beans
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop&q=80', // restaurant interior
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop&q=80', // fine dining plate
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=500&fit=crop&q=80', // restaurant table
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop&q=80', // food plate
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop&q=80', // restaurant ambiance
  ],
  bar: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=500&fit=crop&q=80', // bar interior
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=500&fit=crop&q=80', // cocktail
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&h=500&fit=crop&q=80', // bar counter
  ],
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=500&fit=crop&q=80', // salon interior
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=500&fit=crop&q=80', // manicure
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=500&fit=crop&q=80', // beauty treatment
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=500&fit=crop&q=80', // spa
  ],
  generic: [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop&q=80', // shopping bag
    'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=500&fit=crop&q=80', // discount tag
    'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&h=500&fit=crop&q=80', // sale sign
  ],
}

// Map merchant/place types to image categories
function getImageCategory(offer: any): keyof typeof IMAGES {
  const merchantName = (offer.merchant?.name || '').toLowerCase()
  const branchTitle = (offer.branch?.title || '').toLowerCase()
  const placeType = (offer.branch?.placeType || '').toLowerCase()

  if (placeType === 'cafe' || merchantName.includes('coffee') || merchantName.includes('кофе') || branchTitle.includes('coffee')) return 'coffee'
  if (placeType === 'restaurant' || merchantName.includes('ресторан') || merchantName.includes('гастро') || merchantName.includes('паб')) return 'restaurant'
  if (placeType === 'bar' || merchantName.includes('бар')) return 'bar'
  if (placeType === 'beauty' || placeType === 'nails' || placeType === 'hair' || merchantName.includes('beauty') || merchantName.includes('красот')) return 'beauty'
  return 'generic'
}

async function main() {
  console.log('Connecting to database...')

  // Step 1: Clean up QA test offers
  const qaOffers = await prisma.offer.findMany({
    where: {
      OR: [
        { title: { contains: 'QA Offer' } },
        { description: { contains: 'Scenario matrix' } },
        { description: { contains: 'scenario runner' } },
      ],
    },
    select: { id: true, title: true },
  })

  if (qaOffers.length > 0) {
    console.log(`Found ${qaOffers.length} QA test offers to archive...`)

    // Archive instead of delete — set lifecycle to ARCHIVED
    const archiveResult = await prisma.offer.updateMany({
      where: {
        id: { in: qaOffers.map((o) => o.id) },
      },
      data: {
        lifecycleStatus: 'ARCHIVED',
      },
    })
    console.log(`Archived ${archiveResult.count} QA offers`)
  } else {
    console.log('No QA test offers found')
  }

  // Step 2: Assign images to all offers without images
  const offersWithoutImages = await prisma.offer.findMany({
    where: {
      imageUrl: null,
      lifecycleStatus: { not: 'ARCHIVED' },
    },
    include: {
      branch: { select: { title: true, placeType: true } },
      merchant: { select: { name: true } },
    },
  })

  console.log(`Found ${offersWithoutImages.length} offers without images`)

  let updated = 0
  for (const offer of offersWithoutImages) {
    const category = getImageCategory(offer)
    const images = IMAGES[category]
    // Use a deterministic index based on offer ID to avoid all getting the same image
    const hash = offer.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const imageUrl = images[hash % images.length]

    await prisma.offer.update({
      where: { id: offer.id },
      data: { imageUrl },
    })
    updated++
    console.log(`  [${category}] ${offer.title} → ${imageUrl.split('?')[0].split('/').pop()}`)
  }

  console.log(`\nDone! Updated ${updated} offers with images, archived ${qaOffers.length} QA offers`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Error:', e)
  prisma.$disconnect()
  process.exit(1)
})
