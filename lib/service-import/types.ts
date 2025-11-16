/**
 * Types for raw service data from external sources
 */

export type RawServiceCategory = {
  externalId?: string
  name: string
  description?: string
  icon?: string
}

export type RawServiceType = {
  externalId?: string
  categoryName: string // or categoryExternalId
  name: string
  description?: string
}

export type RawServiceCatalog = {
  categories: RawServiceCategory[]
  services: RawServiceType[]
}


