import { cookies } from 'next/headers'
import crypto from 'crypto'
import type { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const SESSION_COOKIE_NAME = 'cityecho_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE * 1000

export interface SessionData {
  userId: string
  email: string
  role: Role
}

interface SessionPayload extends SessionData {
  exp: number
  iat: number
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production')
    }
    return 'dev-session-secret-change-in-production'
  }

  return secret
}

/**
 * Create HMAC signature for session payload
 */
function sign(payload: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
}

/**
 * Verify HMAC signature and return parsed data
 */
function verifyAndParse(cookieValue: string): SessionPayload | null {
  const dotIndex = cookieValue.lastIndexOf('.')
  if (dotIndex === -1) return null

  const payload = cookieValue.slice(0, dotIndex)
  const signature = cookieValue.slice(dotIndex + 1)

  const expectedSignature = sign(payload)
  const sigBuf = Buffer.from(signature, 'hex')
  const expectedBuf = Buffer.from(expectedSignature, 'hex')
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null // tampered
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as SessionPayload
  } catch {
    return null
  }
}

/**
 * Create session cookie (HMAC-signed)
 */
export async function createSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies()

  const now = Date.now()
  const payloadData: SessionPayload = {
    ...data,
    iat: now,
    exp: now + SESSION_MAX_AGE_MS,
  }

  const payload = Buffer.from(JSON.stringify(payloadData)).toString('base64url')
  const signature = sign(payload)
  const sessionValue = `${payload}.${signature}`

  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Get current session (verified)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  const parsed = verifyAndParse(sessionCookie.value)
  if (!parsed) {
    return null
  }

  const now = Date.now()

  if (parsed.exp <= now) {
    await deleteSession()
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    await deleteSession()
    return null
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
}

/**
 * Delete session (logout)
 */
export async function deleteSession(userId?: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
