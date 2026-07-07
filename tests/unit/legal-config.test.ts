import { beforeEach, describe, expect, it } from 'vitest'
import { getLegalConfig } from '@/lib/legal'

describe('lib/legal', () => {
  beforeEach(() => {
    delete process.env.LEGAL_NAME
    delete process.env.LEGAL_INN
    delete process.env.LEGAL_OGRN
    delete process.env.LEGAL_ADDRESS
    delete process.env.SUPPORT_EMAIL
    delete process.env.SUPPORT_PHONE
  })

  it('returns safe defaults when no env vars are set', () => {
    const config = getLegalConfig()

    expect(config.legalName).toBe('ООО «ГдеСейчас»')
    expect(config.inn).toBe('')
    expect(config.ogrn).toBe('')
    expect(config.address).toBe('г. Санкт-Петербург')
    expect(config.supportEmail).toBe('info@gdesejchas.ru')
    expect(config.supportPhone).toBe('')
  })

  it('reads operator identity from environment variables', () => {
    process.env.LEGAL_NAME = 'ООО «Тест»'
    process.env.LEGAL_INN = '1234567890'
    process.env.LEGAL_OGRN = '0987654321098'
    process.env.LEGAL_ADDRESS = 'г. Москва'
    process.env.SUPPORT_EMAIL = 'help@example.test'
    process.env.SUPPORT_PHONE = '+7 999 000-00-00'

    expect(getLegalConfig()).toEqual({
      legalName: 'ООО «Тест»',
      inn: '1234567890',
      ogrn: '0987654321098',
      address: 'г. Москва',
      supportEmail: 'help@example.test',
      supportPhone: '+7 999 000-00-00',
    })
  })

  it('does not expose secrets in the returned config', () => {
    const config = getLegalConfig()
    const keys = Object.keys(config) as (keyof typeof config)[]
    for (const key of keys) {
      expect(typeof config[key]).toBe('string')
    }
  })
})
