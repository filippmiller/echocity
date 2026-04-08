/**
 * Mini app authentication.
 * Verifies launch parameters from VK and Max platforms.
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

interface MiniAppAuthResult {
  success: boolean
  userId?: string
  error?: string
}

/**
 * Verify VK Mini App launch parameters and create/find user.
 */
export async function verifyVKLaunchParams(
  launchParams: string,
  appSecret: string,
): Promise<MiniAppAuthResult> {
  try {
    const params = new URLSearchParams(launchParams)
    const vkUserId = params.get('vk_user_id')

    if (!vkUserId) return { success: false, error: 'MISSING_VK_USER_ID' }

    // Verify signature
    const signParams = [...params.entries()]
      .filter(([key]) => key.startsWith('vk_'))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    const expectedSign = crypto
      .createHmac('sha256', appSecret)
      .update(signParams)
      .digest('base64url')

    const actualSign = params.get('sign')
    if (actualSign !== expectedSign) {
      return { success: false, error: 'INVALID_SIGNATURE' }
    }

    // Find or create user via OAuthAccount
    let account = await prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider: 'vk', providerUserId: String(vkUserId) } },
      select: { userId: true },
    })

    if (!account) {
      // Create new user for VK mini app
      const user = await prisma.user.create({
        data: {
          email: `vk${vkUserId}@echocity.local`,
          passwordHash: '',
          firstName: params.get('vk_first_name') || 'Пользователь',
          lastName: params.get('vk_last_name') || undefined,
          role: 'CITIZEN',
          profile: { create: {} },
          oauthAccounts: {
            create: {
              provider: 'vk',
              providerUserId: String(vkUserId),
              providerLogin: vkUserId,
            },
          },
        },
      })
      account = { userId: user.id }
    }

    return { success: true, userId: account.userId }
  } catch (err) {
    logger.error('miniapp.verifyVK.error', { error: String(err) })
    return { success: false, error: 'VERIFICATION_FAILED' }
  }
}

/**
 * Verify Max messenger launch parameters and create/find user.
 */
export async function verifyMaxLaunchParams(
  token: string,
  maxAppSecret: string,
): Promise<MiniAppAuthResult> {
  try {
    // Max uses JWT tokens signed with HMAC-SHA256 using the app secret
    const parts = token.split('.')
    if (parts.length !== 3) return { success: false, error: 'INVALID_TOKEN' }

    // Verify signature — CRITICAL: prevents forged tokens
    const [header, payloadB64, signature] = parts
    const expectedSig = crypto
      .createHmac('sha256', maxAppSecret)
      .update(`${header}.${payloadB64}`)
      .digest('base64url')

    if (signature !== expectedSig) {
      logger.warn('miniapp.verifyMax.invalidSignature', { token: token.substring(0, 20) + '...' })
      return { success: false, error: 'INVALID_SIGNATURE' }
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    const maxUserId = payload.sub || payload.user_id

    if (!maxUserId) return { success: false, error: 'MISSING_USER_ID' }

    // Find or create user
    let account = await prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider: 'max', providerUserId: String(maxUserId) } },
      select: { userId: true },
    })

    if (!account) {
      const user = await prisma.user.create({
        data: {
          email: `max${maxUserId}@echocity.local`,
          passwordHash: '',
          firstName: payload.first_name || 'Пользователь',
          lastName: payload.last_name || undefined,
          role: 'CITIZEN',
          profile: { create: {} },
          oauthAccounts: {
            create: {
              provider: 'max',
              providerUserId: String(maxUserId),
              providerLogin: String(maxUserId),
            },
          },
        },
      })
      account = { userId: user.id }
    }

    return { success: true, userId: account.userId }
  } catch (err) {
    logger.error('miniapp.verifyMax.error', { error: String(err) })
    return { success: false, error: 'VERIFICATION_FAILED' }
  }
}
