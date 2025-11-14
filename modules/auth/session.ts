import { cookies } from 'next/headers'
import type { Role } from '@prisma/client'

const SESSION_COOKIE_NAME = 'cityecho_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionData {
  userId: string
  email: string
  role: Role
}

/**
 * Create session cookie
 */
export async function createSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies()
  
  // In production, use JWT or encrypted session token
  // For now, simple JSON encoding (not secure for production!)
  const sessionValue = JSON.stringify(data)
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Get current session
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  
  if (!sessionCookie?.value) {
    return null
  }
  
  try {
    return JSON.parse(sessionCookie.value) as SessionData
  } catch {
    return null
  }
}

/**
 * Delete session (logout)
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

