import { PrismaClient } from '@prisma/client'
import type { RawServiceCategory, RawServiceType } from './types'
import { mapCategory, mapServiceType } from './mapper'

const prisma = new PrismaClient()

export interface ImportResult {
  categoriesCreated: number
  categoriesUpdated: number
  servicesCreated: number
  servicesUpdated: number
  errors: string[]
}

/**
 * Import service catalog from raw data
 */
export async function importServiceCatalog(
  rawCategories: RawServiceCategory[],
  rawServices: RawServiceType[]
): Promise<ImportResult> {
  const result: ImportResult = {
    categoriesCreated: 0,
    categoriesUpdated: 0,
    servicesCreated: 0,
    servicesUpdated: 0,
    errors: [],
  }

  // Step 1: Import categories
  const categoryMap = new Map<string, string>() // categoryName -> categoryId

  for (const rawCategory of rawCategories) {
    try {
      const mapped = mapCategory(rawCategory)

      // Try to find existing category by slug or name
      const existing = await prisma.serviceCategory.findFirst({
        where: {
          OR: [{ slug: mapped.slug }, { name: rawCategory.name }],
        },
      })

      if (existing) {
        // Update existing
        await prisma.serviceCategory.update({
          where: { id: existing.id },
          data: {
            name: mapped.name,
            description: mapped.description,
            icon: mapped.icon,
            // Keep existing slug if it exists
          },
        })
        categoryMap.set(rawCategory.name, existing.id)
        result.categoriesUpdated++
      } else {
        // Create new
        const created = await prisma.serviceCategory.create({
          data: mapped,
        })
        categoryMap.set(rawCategory.name, created.id)
        result.categoriesCreated++
      }
    } catch (error) {
      result.errors.push(
        `Ошибка при импорте категории "${rawCategory.name}": ${String(error)}`
      )
    }
  }

  // Step 2: Import service types
  for (const rawService of rawServices) {
    try {
      const categoryId = categoryMap.get(rawService.categoryName)

      if (!categoryId) {
        result.errors.push(
          `Категория "${rawService.categoryName}" не найдена для услуги "${rawService.name}"`
        )
        continue
      }

      const mapped = mapServiceType(rawService, categoryId)

      // Try to find existing service type by slug or name within category
      const existing = await prisma.serviceType.findFirst({
        where: {
          categoryId,
          OR: [{ slug: mapped.slug }, { name: rawService.name }],
        },
      })

      if (existing) {
        // Update existing
        await prisma.serviceType.update({
          where: { id: existing.id },
          data: {
            name: mapped.name,
            description: mapped.description,
            // Keep existing slug if it exists
          },
        })
        result.servicesUpdated++
      } else {
        // Create new
        await prisma.serviceType.create({
          data: mapped,
        })
        result.servicesCreated++
      }
    } catch (error) {
      result.errors.push(
        `Ошибка при импорте услуги "${rawService.name}": ${String(error)}`
      )
    }
  }

  return result
}


