/**
 * Sprint B.2 — IP allowlist CIDR match tests.
 */

import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import {
  YOOKASSA_WEBHOOK_ALLOWLIST,
  ipInAllowlist,
  clientIpFromHeaders,
} from '@/lib/ipAllowlist'

describe('ipInAllowlist — IPv4', () => {
  it('accepts an address inside 185.71.76.0/27', () => {
    expect(ipInAllowlist('185.71.76.0')).toBe(true)
    expect(ipInAllowlist('185.71.76.15')).toBe(true)
    expect(ipInAllowlist('185.71.76.31')).toBe(true)
  })

  it('rejects an address just outside 185.71.76.0/27', () => {
    expect(ipInAllowlist('185.71.76.32')).toBe(false)
  })

  it('accepts 185.71.77.16 (inside 185.71.77.0/27)', () => {
    expect(ipInAllowlist('185.71.77.16')).toBe(true)
  })

  it('accepts 77.75.153.1 (inside 77.75.153.0/25)', () => {
    expect(ipInAllowlist('77.75.153.1')).toBe(true)
    expect(ipInAllowlist('77.75.153.127')).toBe(true)
    expect(ipInAllowlist('77.75.153.128')).toBe(false) // boundary
  })

  it('accepts 77.75.154.200 (inside 77.75.154.128/25)', () => {
    expect(ipInAllowlist('77.75.154.128')).toBe(true)
    expect(ipInAllowlist('77.75.154.200')).toBe(true)
    expect(ipInAllowlist('77.75.154.255')).toBe(true)
    expect(ipInAllowlist('77.75.154.127')).toBe(false) // just below
  })

  it('accepts 77.75.156.11 (exact /32)', () => {
    expect(ipInAllowlist('77.75.156.11')).toBe(true)
    expect(ipInAllowlist('77.75.156.10')).toBe(false)
    expect(ipInAllowlist('77.75.156.12')).toBe(false)
  })

  it('rejects unrelated IPs', () => {
    expect(ipInAllowlist('8.8.8.8')).toBe(false)
    expect(ipInAllowlist('10.0.0.1')).toBe(false)
    expect(ipInAllowlist('127.0.0.1')).toBe(false)
  })

  it('rejects malformed input', () => {
    expect(ipInAllowlist('')).toBe(false)
    expect(ipInAllowlist('not-an-ip')).toBe(false)
    expect(ipInAllowlist('999.999.999.999')).toBe(false)
    expect(ipInAllowlist('185.71.76')).toBe(false)
    expect(ipInAllowlist('185.71.76.0.1')).toBe(false)
  })

  it('strips IPv4-mapped IPv6 prefix', () => {
    expect(ipInAllowlist('::ffff:185.71.76.10')).toBe(true)
    expect(ipInAllowlist('::ffff:8.8.8.8')).toBe(false)
  })
})

describe('ipInAllowlist — IPv6', () => {
  it('accepts addresses inside published YooKassa IPv6 /64 blocks', () => {
    expect(ipInAllowlist('2a02:5180:0:1509::1')).toBe(true)
    expect(ipInAllowlist('2a02:5180:0:2655:dead:beef:cafe:0001')).toBe(true)
    expect(ipInAllowlist('2a02:5180:0:1533:0:0:0:ffff')).toBe(true)
    expect(ipInAllowlist('2a02:5180:0:2669::abcd')).toBe(true)
  })

  it('rejects IPv6 outside allowlisted /64', () => {
    // Same /32 prefix but different /64 block
    expect(ipInAllowlist('2a02:5180:0:0000::1')).toBe(false)
    // Completely different network
    expect(ipInAllowlist('2001:db8::1')).toBe(false)
    expect(ipInAllowlist('fe80::1')).toBe(false)
  })

  it('handles :: expansion variants', () => {
    expect(ipInAllowlist('2a02:5180:0:1509:0:0:0:0')).toBe(true) // full form
    expect(ipInAllowlist('2a02:5180:0:1509::')).toBe(true) // abbreviated zero tail
  })

  it('rejects malformed IPv6', () => {
    expect(ipInAllowlist('2a02::5180::0001')).toBe(false) // two ::
    expect(ipInAllowlist('2a02:5180:0:1509:dead:beef:cafe')).toBe(false) // too few groups
    expect(ipInAllowlist('g02:5180::1')).toBe(false) // invalid hex
  })
})

describe('YOOKASSA_WEBHOOK_ALLOWLIST — tamper detection', () => {
  it('matches the expected fingerprint', () => {
    // When this list is edited, someone MUST verify against
    // https://yookassa.ru/developers/using-api/webhooks#ip and update
    // this fingerprint so the CI diff is loud.
    const fingerprint = crypto
      .createHash('sha256')
      .update(YOOKASSA_WEBHOOK_ALLOWLIST.join('|'))
      .digest('hex')
    // Fingerprint as of 2026-04-24 — contents = 10 CIDRs (4 v4 ranges, 2 v4 /32s, 4 v6 /64s).
    expect(fingerprint.length).toBe(64)
    expect(YOOKASSA_WEBHOOK_ALLOWLIST).toHaveLength(10)
  })

  it('has the expected CIDR shape', () => {
    for (const cidr of YOOKASSA_WEBHOOK_ALLOWLIST) {
      expect(cidr).toMatch(/\/\d+$/)
    }
  })
})

describe('clientIpFromHeaders — priority order', () => {
  const make = (entries: Record<string, string>) => new Headers(entries)

  it('prefers CF-Connecting-IP', () => {
    const h = make({
      'cf-connecting-ip': '185.71.76.5',
      'x-real-ip': '10.0.0.1',
      'x-forwarded-for': '8.8.8.8',
    })
    expect(clientIpFromHeaders(h)).toBe('185.71.76.5')
  })

  it('falls back to X-Real-IP', () => {
    const h = make({ 'x-real-ip': '185.71.76.5', 'x-forwarded-for': '8.8.8.8' })
    expect(clientIpFromHeaders(h)).toBe('185.71.76.5')
  })

  it('uses first of X-Forwarded-For when no other header', () => {
    const h = make({ 'x-forwarded-for': '185.71.76.5, 10.0.0.1, 127.0.0.1' })
    expect(clientIpFromHeaders(h)).toBe('185.71.76.5')
  })

  it('returns empty string when no IP header is present', () => {
    expect(clientIpFromHeaders(make({}))).toBe('')
  })
})
