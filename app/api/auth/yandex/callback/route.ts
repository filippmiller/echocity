import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCodeForToken,
  fetchYandexUserProfile,
  isYandexOAuthConfigured,
} from '@/modules/yandex/oauth'
import { verifyState } from '@/modules/yandex/state'
import { createSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    if (!isYandexOAuthConfigured()) {
      return NextResponse.redirect(
        new URL('/auth/error?provider=yandex&reason=not_configured', request.url)
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth error from Yandex
    if (error) {
      logger.warn('yandex.oauth.callback.error', { error })
      return NextResponse.redirect(
        new URL(
          `/auth/error?provider=yandex&reason=${encodeURIComponent(error)}`,
          request.url
        )
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/auth/error?provider=yandex&reason=missing_params', request.url)
      )
    }

    // Verify CSRF state
    const stateVerification = await verifyState(state)
    if (!stateVerification.valid) {
      logger.warn('yandex.oauth.callback.invalid_state')
      return NextResponse.redirect(
        new URL('/auth/error?provider=yandex&reason=invalid_state', request.url)
      )
    }

    // Exchange code for token
    let tokenResponse
    try {
      tokenResponse = await exchangeCodeForToken(code)
    } catch (error) {
      logger.error('yandex.oauth.callback.token_error', {
        error: String(error),
      })
      return NextResponse.redirect(
        new URL(
          '/auth/error?provider=yandex&reason=token_exchange_failed',
          request.url
        )
      )
    }

    // Fetch user profile from Yandex
    let profile
    try {
      profile = await fetchYandexUserProfile(tokenResponse.access_token)
    } catch (error) {
      logger.error('yandex.oauth.callback.profile_error', {
        error: String(error),
      })
      return NextResponse.redirect(
        new URL(
          '/auth/error?provider=yandex&reason=profile_fetch_failed',
          request.url
        )
      )
    }

    // Find or create user
    let user

    // First, check if OAuth account already exists
    const existingOAuthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'yandex',
          providerUserId: profile.id,
        },
      },
      include: {
        user: true,
      },
    })

    if (existingOAuthAccount) {
      // User already linked - use existing user
      user = existingOAuthAccount.user

      // Update OAuth account tokens
      await prisma.oAuthAccount.update({
        where: { id: existingOAuthAccount.id },
        data: {
          accessToken: tokenResponse.access_token.substring(0, 100), // Store truncated token
          refreshToken: tokenResponse.refresh_token?.substring(0, 100) || null,
          expiresAt: tokenResponse.expires_in
            ? new Date(Date.now() + tokenResponse.expires_in * 1000)
            : null,
          updatedAt: new Date(),
        },
      })
    } else {
      // New OAuth account - find or create user
      const email = profile.default_email || profile.emails?.[0]

      // Try to find existing user by email
      let existingUser = null
      if (email) {
        existingUser = await prisma.user.findUnique({
          where: { email },
        })
      }

      if (existingUser) {
        // Link OAuth account to existing user
        user = existingUser
        await prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            provider: 'yandex',
            providerUserId: profile.id,
            providerLogin: profile.login,
            email: email || null,
            accessToken: tokenResponse.access_token.substring(0, 100),
            refreshToken: tokenResponse.refresh_token?.substring(0, 100) || null,
            expiresAt: tokenResponse.expires_in
              ? new Date(Date.now() + tokenResponse.expires_in * 1000)
              : null,
          },
        })
      } else {
        // Create new user
        const firstName =
          profile.first_name || profile.real_name?.split(' ')[0] || profile.login
        const lastName = profile.last_name || profile.real_name?.split(' ').slice(1).join(' ') || null

        user = await prisma.user.create({
          data: {
            email: email || `${profile.login}@yandex.local`, // Fallback email
            passwordHash: '', // OAuth users don't have password
            role: 'CITIZEN',
            firstName,
            lastName,
            language: 'ru',
            profile: {
              create: {
                fullName: profile.real_name || profile.display_name || profile.login,
                preferredLanguage: 'ru',
              },
            },
            oauthAccounts: {
              create: {
                provider: 'yandex',
                providerUserId: profile.id,
                providerLogin: profile.login,
                email: email || null,
                accessToken: tokenResponse.access_token.substring(0, 100),
                refreshToken: tokenResponse.refresh_token?.substring(0, 100) || null,
                expiresAt: tokenResponse.expires_in
                  ? new Date(Date.now() + tokenResponse.expires_in * 1000)
                  : null,
              },
            },
          },
          select: {
            id: true,
            email: true,
            role: true,
          },
        })

        logger.info('yandex.oauth.callback.user_created', {
          userId: user.id,
          yandexId: profile.id,
        })
      }
    }

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    logger.info('yandex.oauth.callback.success', {
      userId: user.id,
      yandexId: profile.id,
    })

    // Redirect to intended destination or dashboard
    const redirectTo = stateVerification.redirectTo || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (error) {
    logger.error('yandex.oauth.callback.error', { error: String(error) })
    return NextResponse.redirect(
      new URL('/auth/error?provider=yandex&reason=internal_error', request.url)
    )
  }
}

