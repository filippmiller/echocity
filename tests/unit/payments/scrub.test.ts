/**
 * Sprint B.4 — rawPayload PII scrub tests.
 */

import { describe, it, expect } from 'vitest'
import { scrubRawPayload } from '@/modules/payments/scrub'

describe('scrubRawPayload', () => {
  it('redacts card_number / pan / cvc / cvv', () => {
    const input = {
      payment_method: {
        card: {
          card_number: '4111 1111 1111 1111',
          cvc: '123',
          cvv: '456',
        },
        pan: '5555444433332222',
      },
    }
    const out = scrubRawPayload(input) as Record<string, unknown>
    const pm = out.payment_method as Record<string, unknown>
    const card = pm.card as Record<string, unknown>
    expect(card.card_number).toBe('[REDACTED]')
    expect(card.cvc).toBe('[REDACTED]')
    expect(card.cvv).toBe('[REDACTED]')
    expect(pm.pan).toBe('[REDACTED]')
  })

  it('masks last4 / bin (kept-but-unreadable)', () => {
    const input = { card: { last4: '4242', bin: '424242', issuer_id_number: '424242' } }
    const out = scrubRawPayload(input) as Record<string, unknown>
    const card = out.card as Record<string, unknown>
    expect(card.last4).toBe('[MASKED]')
    expect(card.bin).toBe('[MASKED]')
    expect(card.issuer_id_number).toBe('[MASKED]')
  })

  it('redacts expiry fields', () => {
    const input = { expiry_month: '12', expiry_year: '2028', expiration_date: '12/28' }
    const out = scrubRawPayload(input) as Record<string, unknown>
    expect(out.expiry_month).toBe('[REDACTED]')
    expect(out.expiry_year).toBe('[REDACTED]')
    expect(out.expiration_date).toBe('[REDACTED]')
  })

  it('redacts cardholder_name', () => {
    expect(
      ((scrubRawPayload({ cardholder_name: 'FILIPP M' }) as Record<string, unknown>).cardholder_name),
    ).toBe('[REDACTED]')
    expect(
      ((scrubRawPayload({ card_holder_name: 'FILIPP M' }) as Record<string, unknown>).card_holder_name),
    ).toBe('[REDACTED]')
  })

  it('preserves safe top-level YooKassa fields', () => {
    const input = {
      id: 'pay_abc123',
      status: 'succeeded',
      amount: { value: '299.00', currency: 'RUB' },
      metadata: { userId: 'u-1', planCode: 'plus' },
      created_at: '2026-04-24T10:00:00Z',
    }
    const out = scrubRawPayload(input) as Record<string, unknown>
    expect(out.id).toBe('pay_abc123')
    expect(out.status).toBe('succeeded')
    expect(out.amount).toEqual({ value: '299.00', currency: 'RUB' })
    expect(out.metadata).toEqual({ userId: 'u-1', planCode: 'plus' })
  })

  it('recurses into arrays', () => {
    const input = {
      payments: [
        { last4: '4242', card_number: '4111111111111111' },
        { last4: '5555', card_number: '5555555555555555' },
      ],
    }
    const out = scrubRawPayload(input) as { payments: Array<Record<string, unknown>> }
    expect(out.payments[0].last4).toBe('[MASKED]')
    expect(out.payments[0].card_number).toBe('[REDACTED]')
    expect(out.payments[1].last4).toBe('[MASKED]')
    expect(out.payments[1].card_number).toBe('[REDACTED]')
  })

  it('handles null / undefined / primitives', () => {
    expect(scrubRawPayload(null)).toBe(null)
    expect(scrubRawPayload(undefined)).toBe(undefined)
    expect(scrubRawPayload(42)).toBe(42)
    expect(scrubRawPayload('hello')).toBe('hello')
    expect(scrubRawPayload(true)).toBe(true)
  })

  it('does not mutate the input', () => {
    const input = { card: { cvc: '123' } }
    const copy = JSON.parse(JSON.stringify(input))
    scrubRawPayload(input)
    expect(input).toEqual(copy)
  })

  it('is not fooled by casing variants', () => {
    expect(((scrubRawPayload({ CVC: '123' }) as Record<string, unknown>).CVC)).toBe('[REDACTED]')
    expect(((scrubRawPayload({ Card_Number: '1234' }) as Record<string, unknown>).Card_Number)).toBe(
      '[REDACTED]',
    )
    expect(((scrubRawPayload({ LAST4: '4242' }) as Record<string, unknown>).LAST4)).toBe('[MASKED]')
  })
})
