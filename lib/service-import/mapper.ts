import type { RawServiceCategory, RawServiceType } from './types'
import type { ServicePricingUnit } from '@prisma/client'

/**
 * Generate slug from name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Generate code for category (slug with prefix)
 */
export function mapCategoryCode(name: string, externalId?: string): string {
  if (externalId) {
    return `ext-${slugify(externalId)}`
  }
  return slugify(name)
}

/**
 * Generate code for service type (slug with prefix)
 */
export function mapServiceTypeCode(name: string, externalId?: string): string {
  if (externalId) {
    return `ext-${slugify(externalId)}`
  }
  return slugify(name)
}

/**
 * Map raw category to Prisma data
 */
export function mapCategory(
  raw: RawServiceCategory
): {
  name: string
  slug: string
  description?: string
  icon?: string
  isActive: boolean
  sortOrder: number
} {
  return {
    name: raw.name,
    slug: mapCategoryCode(raw.name, raw.externalId),
    description: raw.description,
    icon: raw.icon,
    isActive: true,
    sortOrder: 0,
  }
}

/**
 * Map raw service type to Prisma data
 * Requires categoryId to be resolved separately
 */
export function mapServiceType(
  raw: RawServiceType,
  categoryId: string
): {
  categoryId: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  sortOrder: number
} {
  return {
    categoryId,
    name: raw.name,
    slug: mapServiceTypeCode(raw.name, raw.externalId),
    description: raw.description,
    isActive: true,
    sortOrder: 0,
  }
}

/**
 * Infer pricing unit from category name (simple heuristic)
 */
export function inferPricingUnit(categoryName: string): ServicePricingUnit {
  const lower = categoryName.toLowerCase()
  
  if (lower.includes('химчистка') || lower.includes('прачечная')) {
    return 'PER_ITEM'
  }
  if (lower.includes('красота') || lower.includes('маникюр') || lower.includes('педикюр')) {
    return 'FIXED'
  }
  if (lower.includes('парикмахер') || lower.includes('стрижка')) {
    return 'FIXED'
  }
  if (lower.includes('кафе') || lower.includes('ресторан') || lower.includes('кофе')) {
    return 'FIXED'
  }
  
  return 'FIXED' // default
}


