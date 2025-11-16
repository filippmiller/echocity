import { NextRequest, NextResponse } from 'next/server'
import { getYandexAuthUrl, isYandexOAuthConfigured } from '@/modules/yandex/oauth'
import { generateState } from '@/modules/yandex/state'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    if (!isYandexOAuthConfigured()) {
      return NextResponse.json(
        { error: 'Yandex OAuth is not configured' },
        { status: 503 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const redirectTo = body.redirectTo || '/dashboard'

    // Generate CSRF state token
    const state = await generateState(redirectTo)

    // Get Yandex authorization URL
    const authUrl = getYandexAuthUrl(state, redirectTo)

    logger.info('yandex.oauth.start', { redirectTo })

    return NextResponse.json({ url: authUrl })
  } catch (error) {
    logger.error('yandex.oauth.start.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Failed to start Yandex OAuth flow' },
      { status: 500 }
    )
  }
}

