/**
 * Yandex Maps Places / Organization Search API integration
 * Searches for businesses in Yandex Maps directory
 */

export interface YandexPlaceFeature {
  id: string
  name: string
  address: string
  phones?: string[]
  coordinates: [number, number] // [longitude, latitude]
  raw: unknown // Original feature object from Yandex API
}

const YANDEX_PLACES_API_URL = 'https://search-maps.yandex.ru/v1/'

/**
 * Get Yandex Maps API key from environment
 */
function getYandexMapsApiKey(): string | null {
  return process.env.YANDEX_MAPS_API_KEY || null
}

/**
 * Check if Yandex Maps API is configured
 */
export function isYandexMapsConfigured(): boolean {
  return getYandexMapsApiKey() !== null
}

/**
 * Custom error for missing Yandex Maps configuration
 */
export class YandexMapsNotConfiguredError extends Error {
  constructor() {
    super('Yandex Maps API is not configured')
    this.name = 'YandexMapsNotConfiguredError'
  }
}

/**
 * Search for businesses in Yandex Maps
 */
export async function searchBusinesses(query: {
  text: string // phone, name+city, INN, etc.
  lang?: string // default 'ru_RU'
  limit?: number // default 10
}): Promise<YandexPlaceFeature[]> {
  const apiKey = getYandexMapsApiKey()
  if (!apiKey) {
    throw new YandexMapsNotConfiguredError()
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    text: query.text,
    type: 'biz', // Business/organization type
    lang: query.lang || 'ru_RU',
    results: String(query.limit || 10),
  })

  const url = `${YANDEX_PLACES_API_URL}?${params.toString()}`

  const response = await fetch(url)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Yandex Places API error: ${response.status} ${errorText}`
    )
  }

  const data = await response.json()

  // Parse Yandex Places API response
  const features = data?.features || []

  return features.map((feature: any) => {
    // Extract coordinates (Yandex uses [lon, lat] format)
    const coordinates: [number, number] = feature.geometry?.coordinates || [
      0, 0,
    ]

    // Extract name and address from properties
    const properties = feature.properties || {}
    const companyMetaData = properties.CompanyMetaData || {}
    const name = companyMetaData.name || properties.name || 'Без названия'
    const address =
      companyMetaData.address || properties.description || 'Адрес не указан'

    // Extract phones
    const phones: string[] = []
    if (companyMetaData.Phones) {
      for (const phoneObj of companyMetaData.Phones) {
        if (phoneObj.formatted) {
          phones.push(phoneObj.formatted)
        }
      }
    }

    // Use feature ID or generate from coordinates + name
    const id =
      feature.id ||
      feature.properties?.CompanyMetaData?.id ||
      `${coordinates[0]}_${coordinates[1]}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_')

    return {
      id: String(id),
      name,
      address,
      phones: phones.length > 0 ? phones : undefined,
      coordinates,
      raw: feature,
    } as YandexPlaceFeature
  })
}

