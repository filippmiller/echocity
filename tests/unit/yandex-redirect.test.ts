import { describe, expect, it } from 'vitest'
import { sanitizeYandexRedirect } from '@/modules/yandex/redirect'

describe('sanitizeYandexRedirect', () => {
  it('allows in-app relative paths', () => {
    expect(sanitizeYandexRedirect('/subscription')).toBe('/subscription')
  })

  it('falls back to dashboard for missing redirects', () => {
    expect(sanitizeYandexRedirect()).toBe('/dashboard')
  })

  it('blocks absolute redirects', () => {
    expect(sanitizeYandexRedirect('https://evil.example/phish')).toBe('/dashboard')
  })

  it('blocks protocol-relative redirects', () => {
    expect(sanitizeYandexRedirect('//evil.example/phish')).toBe('/dashboard')
  })
})
