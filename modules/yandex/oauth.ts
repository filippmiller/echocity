/**
 * Yandex OAuth 2.0 integration
 * Handles authorization code flow for Yandex ID
 */

export interface YandexTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

export interface YandexProfile {
  id: string
  login: string
  default_email?: string
  emails?: string[]
  real_name?: string
  first_name?: string
  last_name?: string
  display_name?: string
  default_avatar_id?: string
  is_avatar_empty?: boolean
}

const YANDEX_OAUTH_AUTHORIZE_URL = 'https://oauth.yandex.com/authorize'
const YANDEX_OAUTH_TOKEN_URL = 'https://oauth.yandex.com/token'
const YANDEX_USER_INFO_URL = 'https://login.yandex.ru/info?format=json'

/**
 * Get Yandex OAuth configuration from environment
 */
function getYandexConfig() {
  const clientId = process.env.YANDEX_CLIENT_ID
  const clientSecret = process.env.YANDEX_CLIENT_SECRET
  const redirectUri = process.env.YANDEX_OAUTH_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return null
  }

  return { clientId, clientSecret, redirectUri }
}

/**
 * Check if Yandex OAuth is configured
 */
export function isYandexOAuthConfigured(): boolean {
  return getYandexConfig() !== null
}

/**
 * Generate Yandex OAuth authorization URL
 */
export function getYandexAuthUrl(state: string, redirectTo?: string): string {
  const config = getYandexConfig()
  if (!config) {
    throw new Error('Yandex OAuth is not configured')
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'login:info login:email', // Minimal scope for user profile
    state: state,
  })

  if (redirectTo) {
    params.append('redirect_to', redirectTo)
  }

  return `${YANDEX_OAUTH_AUTHORIZE_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<YandexTokenResponse> {
  const config = getYandexConfig()
  if (!config) {
    throw new Error('Yandex OAuth is not configured')
  }

  const response = await fetch(YANDEX_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to exchange code for token: ${response.status} ${errorText}`
    )
  }

  return (await response.json()) as YandexTokenResponse
}

/**
 * Fetch user profile from Yandex using access token
 */
export async function fetchYandexUserProfile(
  accessToken: string
): Promise<YandexProfile> {
  const response = await fetch(YANDEX_USER_INFO_URL, {
    headers: {
      Authorization: `OAuth ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to fetch Yandex profile: ${response.status} ${errorText}`
    )
  }

  return (await response.json()) as YandexProfile
}

