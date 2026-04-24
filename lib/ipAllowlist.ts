/**
 * IPv4 / IPv6 CIDR allowlist matcher.
 *
 * Sprint B.2 — guards `/api/payments/yokassa/webhook` against spoofed
 * calls. YooKassa publishes a fixed set of egress CIDRs:
 * https://yookassa.ru/developers/using-api/webhooks#ip
 *
 * Any change to YOOKASSA_WEBHOOK_ALLOWLIST must be mirrored in the
 * unit-test fingerprint so CI diffs are loud.
 *
 * No external dependency — `cidr-matcher` / `ipaddr.js` would work,
 * but a 60-line pure-TS implementation keeps the supply-chain surface
 * tighter for a security-critical path.
 */

export const YOOKASSA_WEBHOOK_ALLOWLIST: readonly string[] = Object.freeze([
  // IPv4 — published by YooKassa as of 2025-Q1
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.154.128/25',
  '77.75.156.11/32',
  '77.75.156.35/32',
  '2a02:5180:0:1509::/64',
  '2a02:5180:0:2655::/64',
  '2a02:5180:0:1533::/64',
  '2a02:5180:0:2669::/64',
])

/** Convert an IPv4 dotted string to a 32-bit unsigned integer. */
function v4toInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let out = 0
  for (const p of parts) {
    const n = Number(p)
    if (!Number.isInteger(n) || n < 0 || n > 255) return null
    out = (out * 256 + n) >>> 0
  }
  return out >>> 0
}

/** Convert an IPv6 canonical string to an array of 8 × 16-bit unsigned ints. */
function v6toWords(ip: string): number[] | null {
  // Normalize :: expansion
  const doubleColon = ip.split('::')
  if (doubleColon.length > 2) return null
  let head: string[] = []
  let tail: string[] = []
  if (doubleColon.length === 2) {
    head = doubleColon[0] ? doubleColon[0].split(':') : []
    tail = doubleColon[1] ? doubleColon[1].split(':') : []
    const missing = 8 - head.length - tail.length
    if (missing < 0) return null
    for (let i = 0; i < missing; i++) head.push('0')
  } else {
    head = ip.split(':')
    if (head.length !== 8) return null
  }
  const words: number[] = []
  for (const part of [...head, ...tail]) {
    if (part.length === 0 || part.length > 4) return null
    const n = parseInt(part, 16)
    if (!Number.isFinite(n) || n < 0 || n > 0xffff) return null
    words.push(n)
  }
  return words.length === 8 ? words : null
}

function matchV4(ipInt: number, cidr: string): boolean {
  const [base, bitsRaw] = cidr.split('/')
  const bits = Number(bitsRaw)
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false
  const baseInt = v4toInt(base)
  if (baseInt === null) return false
  if (bits === 0) return true
  const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0
  return (ipInt & mask) === (baseInt & mask)
}

function matchV6(ipWords: number[], cidr: string): boolean {
  const [base, bitsRaw] = cidr.split('/')
  const bits = Number(bitsRaw)
  if (!Number.isInteger(bits) || bits < 0 || bits > 128) return false
  const baseWords = v6toWords(base)
  if (baseWords === null) return false
  let remaining = bits
  for (let i = 0; i < 8; i++) {
    if (remaining >= 16) {
      if (ipWords[i] !== baseWords[i]) return false
      remaining -= 16
    } else if (remaining > 0) {
      const mask = (0xffff << (16 - remaining)) & 0xffff
      if ((ipWords[i] & mask) !== (baseWords[i] & mask)) return false
      remaining = 0
    } else {
      break
    }
  }
  return true
}

/**
 * Return true iff `ip` falls within any CIDR in `allowlist`.
 * Silently returns false on any parse failure — we prefer to reject
 * malformed input rather than leak through a permissive default.
 */
export function ipInAllowlist(ip: string, allowlist: readonly string[] = YOOKASSA_WEBHOOK_ALLOWLIST): boolean {
  if (!ip) return false
  // Strip IPv4-mapped-IPv6 prefix (::ffff:a.b.c.d) down to v4.
  const stripped = ip.replace(/^::ffff:/i, '')
  const isV6 = stripped.includes(':')

  if (!isV6) {
    const ipInt = v4toInt(stripped)
    if (ipInt === null) return false
    for (const cidr of allowlist) {
      if (cidr.includes(':')) continue
      if (matchV4(ipInt, cidr)) return true
    }
    return false
  }

  const words = v6toWords(stripped)
  if (!words) return false
  for (const cidr of allowlist) {
    if (!cidr.includes(':')) continue
    if (matchV6(words, cidr)) return true
  }
  return false
}

/**
 * Extract the client IP from Next.js request headers.
 * Priority: CF-Connecting-IP (Cloudflare) → X-Real-IP → first of X-Forwarded-For → fallback.
 * Behind Timeweb's load balancer X-Real-IP is the authoritative source.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const xri = headers.get('x-real-ip')
  if (xri) return xri.trim()
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return ''
}
