/**
 * Shared constants for E2E flow tests.
 * Matches seed data in production database.
 */

export const BASE_URL = process.env.BASE_URL || 'https://echocity.filippmiller.com'
export const PASSWORD = 'Test1234!'

export const CREDS = {
  admin: { email: 'admin@echocity.ru', password: PASSWORD },
  user: { email: 'user@echocity.ru', password: PASSWORD },
  subscriber: { email: 'maria@echocity.ru', password: PASSWORD },
  coffeeOwner: { email: 'coffee@echocity.ru', password: PASSWORD },
  beautyOwner: { email: 'beauty@echocity.ru', password: PASSWORD },
  restaurantOwner: { email: 'restaurant@echocity.ru', password: PASSWORD },
  staff: { email: 'cashier@echocity.ru', password: PASSWORD },
} as const

export const IDS = {
  coffeeBusinessId: 'biz-coffee-house',
  beautyBusinessId: 'biz-beauty-studio',
  restaurantBusinessId: 'biz-gastro-pub',
  coffeePlaceId: 'place-coffee-nevsky',
  beautyPlaceId: 'place-beauty-liteiny',
  restaurantPlaceId: 'place-gastro-rubinshteina',
  freeOfferId: 'offer-coffee-20',
  memberOfferId: 'offer-free-dessert',
} as const

export const TIMEOUTS = {
  navigation: 15000,
  api: 10000,
  animation: 2000,
  render: 3000,
} as const
