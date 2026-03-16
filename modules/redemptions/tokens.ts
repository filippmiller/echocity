import crypto from 'crypto'

const HMAC_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-me'

export function generateSessionToken(): string {
  return crypto.randomUUID()
}

export function generateShortCode(): string {
  // 6 chars, no ambiguous: exclude 0,O,1,I,L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)]
  }
  return code
}

export function signToken(token: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(token).digest('hex')
}

export function verifyTokenSignature(token: string, signature: string): boolean {
  const expected = signToken(token)
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
