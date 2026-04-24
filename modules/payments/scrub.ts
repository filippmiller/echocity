/**
 * Sprint B.4 — PII scrubber for `Payment.rawPayload`.
 *
 * YooKassa webhooks may include a `payment_method` object with card fragments
 * (`last4`, `card_number`, `expiry_*`) and occasionally `cvc` fragments in
 * older API versions. Persisting these raw is a PCI-scope mistake even when
 * they're partial: the "last4 + expiry + cardholder name" triple is enough
 * for PAN enumeration attacks against loyalty systems.
 *
 * Scrub rules (applied recursively on any nested object / array):
 *   - Any key matching /^card(_|\.)?number$|^pan$|^primary_account_number$/i     → REDACTED
 *   - Any key matching /^cvc|^cvv|^security_code|^csc$/i                         → REDACTED
 *   - Any key matching /^expir(y|es)_|^expiration_/i                             → REDACTED
 *   - Any key matching /^card_?holder_?name$/i                                   → REDACTED
 *   - Any key matching /^last4$|^last_4_digits$|^bin$|^issuer_id_number$/i       → MASKED (keeps type)
 *   - Any key matching /^authorization|^auth(entication)?_code$/i                → REDACTED
 *
 * Masking preserves the key and the type so downstream code can still
 * introspect shape (e.g. "was there a last4?") without seeing the value.
 */

const REDACT = '[REDACTED]'
const MASK = '[MASKED]'

const REDACT_KEYS = [
  /^card(_|\.)?number$/i,
  /^pan$/i,
  /^primary_account_number$/i,
  /^cvc$/i,
  /^cvv$/i,
  /^security_code$/i,
  /^csc$/i,
  /^expir(y|es|ation)_.*$/i,
  /^expiry$/i,
  /^card_?holder_?name$/i,
  /^authorization$/i,
  /^auth(entication)?_code$/i,
]

const MASK_KEYS = [
  /^last4$/i,
  /^last_4_digits$/i,
  /^bin$/i,
  /^issuer_id_number$/i,
]

function keyMatches(key: string, patterns: RegExp[]): boolean {
  for (const p of patterns) if (p.test(key)) return true
  return false
}

/**
 * Return a new object with PII-sensitive fields redacted or masked.
 * Never mutates the input. Safe to pass any JSON-serialisable value.
 */
export function scrubRawPayload(input: unknown): unknown {
  return scrub(input, 0)
}

function scrub(v: unknown, depth: number): unknown {
  if (depth > 32) return '[TRUNCATED: max-depth]' // defense against cyclic references
  if (v === null || v === undefined) return v
  if (Array.isArray(v)) return v.map((x) => scrub(x, depth + 1))
  if (typeof v !== 'object') return v

  const src = v as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(src)) {
    if (keyMatches(k, REDACT_KEYS)) {
      out[k] = REDACT
      continue
    }
    if (keyMatches(k, MASK_KEYS)) {
      out[k] = MASK
      continue
    }
    out[k] = scrub(src[k], depth + 1)
  }
  return out
}
