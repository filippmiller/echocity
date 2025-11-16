/**
 * State management for Yandex OAuth flow
 * Stores CSRF state tokens securely
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

const STATE_COOKIE_NAME = 'yandex_oauth_state'
const STATE_MAX_AGE = 60 * 10 // 10 minutes

/**
 * Generate and store OAuth state token
 */
export async function generateState(redirectTo?: string): Promise<string> {
  const state = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()

  const stateData = {
    token: state,
    redirectTo: redirectTo || null,
    timestamp: Date.now(),
  }

  cookieStore.set(STATE_COOKIE_NAME, JSON.stringify(stateData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_MAX_AGE,
    path: '/',
  })

  return state
}

/**
 * Verify and consume OAuth state token
 */
export async function verifyState(
  receivedState: string
): Promise<{ valid: boolean; redirectTo?: string }> {
  const cookieStore = await cookies()
  const stateCookie = cookieStore.get(STATE_COOKIE_NAME)

  if (!stateCookie?.value) {
    return { valid: false }
  }

  try {
    const stateData = JSON.parse(stateCookie.value) as {
      token: string
      redirectTo?: string
      timestamp: number
    }

    // Check if state matches
    if (stateData.token !== receivedState) {
      return { valid: false }
    }

    // Check if state is not too old (should be within max age)
    const age = Date.now() - stateData.timestamp
    if (age > STATE_MAX_AGE * 1000) {
      return { valid: false }
    }

    // Consume state (delete cookie)
    cookieStore.delete(STATE_COOKIE_NAME)

    return {
      valid: true,
      redirectTo: stateData.redirectTo || undefined,
    }
  } catch {
    return { valid: false }
  }
}

