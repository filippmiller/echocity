/**
 * Legal / operator identity configuration.
 *
 * Reads operator identity from environment variables and falls back to safe
 * defaults so pages render even when env vars are missing. Secrets are never
 * exported from this module.
 */

const LEGAL_ENV_KEYS = [
  'LEGAL_NAME',
  'LEGAL_INN',
  'LEGAL_OGRN',
  'LEGAL_ADDRESS',
  'SUPPORT_EMAIL',
  'SUPPORT_PHONE',
] as const

export interface LegalConfig {
  legalName: string
  inn: string
  ogrn: string
  address: string
  supportEmail: string
  supportPhone: string
}

const DEFAULT_LEGAL_NAME = 'ООО «ГдеСейчас»'
const DEFAULT_INN = ''
const DEFAULT_OGRN = ''
const DEFAULT_ADDRESS = 'г. Санкт-Петербург'
const DEFAULT_SUPPORT_EMAIL = 'info@gdesejchas.ru'
const DEFAULT_SUPPORT_PHONE = ''

export function getLegalConfig(): LegalConfig {
  return {
    legalName: process.env.LEGAL_NAME || DEFAULT_LEGAL_NAME,
    inn: process.env.LEGAL_INN || DEFAULT_INN,
    ogrn: process.env.LEGAL_OGRN || DEFAULT_OGRN,
    address: process.env.LEGAL_ADDRESS || DEFAULT_ADDRESS,
    supportEmail: process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL,
    supportPhone: process.env.SUPPORT_PHONE || DEFAULT_SUPPORT_PHONE,
  }
}

export function getLegalReadiness(): { key: string; present: boolean }[] {
  return LEGAL_ENV_KEYS.map((key) => ({
    key,
    present: Boolean(process.env[key]),
  }))
}
