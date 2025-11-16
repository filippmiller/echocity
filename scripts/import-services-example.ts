import { PrismaClient } from '@prisma/client'
import { importServiceCatalog } from '../lib/service-import/upsert'
import type { RawServiceCategory, RawServiceType } from '../lib/service-import/types'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting service catalog import...\n')

  // Load example data
  const dataPath = path.join(process.cwd(), 'data', 'example-services.json')
  
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ File not found: ${dataPath}`)
    process.exit(1)
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as {
    categories: RawServiceCategory[]
    services: RawServiceType[]
  }

  console.log(`📦 Loaded data:`)
  console.log(`   Categories: ${rawData.categories.length}`)
  console.log(`   Services: ${rawData.services.length}\n`)

  // Import
  const result = await importServiceCatalog(
    rawData.categories,
    rawData.services
  )

  // Print results
  console.log('✅ Import completed!\n')
  console.log('📊 Results:')
  console.log(`   Categories created: ${result.categoriesCreated}`)
  console.log(`   Categories updated: ${result.categoriesUpdated}`)
  console.log(`   Services created: ${result.servicesCreated}`)
  console.log(`   Services updated: ${result.servicesUpdated}`)

  if (result.errors.length > 0) {
    console.log(`\n⚠️  Errors (${result.errors.length}):`)
    result.errors.forEach((error) => {
      console.log(`   - ${error}`)
    })
  }

  console.log('\n✨ Done!')
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


