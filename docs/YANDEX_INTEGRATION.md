# Yandex Integration Guide

This document describes how to set up Yandex OAuth and Yandex Maps API integration for EchoCity.

## Overview

EchoCity supports two Yandex integrations:

1. **Yandex ID OAuth** - Allows users to sign in with their Yandex account
2. **Yandex Maps Places API** - Allows business owners to verify and link their business listings from Yandex Maps

## 1. Yandex OAuth Setup (Yandex ID Sign-In)

### Step 1: Create Yandex OAuth Application

1. Go to [Yandex OAuth Applications](https://oauth.yandex.com/)
2. Click "Register new application" or "Создать новое приложение"
3. Fill in the application details:
   - **Application name**: EchoCity (or your app name)
   - **Platform**: Web services
   - **Redirect URI**: 
     - Development: `http://localhost:3010/api/auth/yandex/callback`
     - Production: `https://yourdomain.com/api/auth/yandex/callback`
4. Click "Create" / "Создать"
5. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
YANDEX_CLIENT_ID="your-client-id-here"
YANDEX_CLIENT_SECRET="your-client-secret-here"
YANDEX_OAUTH_REDIRECT_URI="http://localhost:3010/api/auth/yandex/callback"
```

For production, update `YANDEX_OAUTH_REDIRECT_URI` to your production domain.

### Step 3: OAuth Scopes

The integration requests the following scopes:
- `login:info` - Basic user information (ID, login, name)
- `login:email` - User email address

These are minimal scopes required for user authentication.

### Step 4: Test Yandex Sign-In

1. Start your development server: `npm run dev`
2. Navigate to `/auth/login` or `/auth/register`
3. Click "Войти через Яндекс" button
4. Complete Yandex OAuth flow
5. You should be redirected back and logged in

## 2. Yandex Maps Places API Setup (Business Verification)

### Step 1: Get Yandex Maps API Key

1. Go to [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Create a new cloud or select existing one
3. Navigate to "API Keys" / "Ключи API"
4. Click "Create API Key" / "Создать API ключ"
5. Select "Maps API" service
6. Copy the API key

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
YANDEX_MAPS_API_KEY="your-maps-api-key-here"
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="your-maps-api-key-here"
```

**Note:** Both variables are needed:
- `YANDEX_MAPS_API_KEY` - Used server-side for Places API search
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` - Used client-side for map display (if you use Yandex Maps on frontend)

### Step 3: Enable Places API

1. In Yandex Cloud Console, go to "Services" / "Сервисы"
2. Enable "Maps API" if not already enabled
3. Make sure "Places API" / "API Поиска по организациям" is enabled

### Step 4: Test Business Verification

1. Log in as a business owner
2. Navigate to `/business/places`
3. Find your business card
4. Click "Найти в Яндексе" in the "Подтверждение через Яндекс.Карты" section
5. Search for your business by name, phone, or INN
6. Select the correct business from results
7. Your business data (address, coordinates, phone) will be synced from Yandex

## API Endpoints

### OAuth Flow

- `POST /api/auth/yandex/start` - Initiate OAuth flow
  - Body: `{ redirectTo?: string }`
  - Returns: `{ url: string }` - Yandex authorization URL

- `GET /api/auth/yandex/callback` - OAuth callback handler
  - Query params: `code`, `state`, `error`
  - Redirects to dashboard or error page

### Places API

- `GET /api/integrations/yandex/places/search` - Search businesses
  - Query params: `text` (required), `limit` (optional, default 10)
  - Returns: `{ results: Array<{ id, name, address, phones, coordinates }> }`
  - Requires authentication

- `POST /api/businesses/[id]/link-yandex` - Link business with Yandex listing
  - Body: `{ yandexOrgId: string, yandexData?: object }`
  - Returns: `{ success: boolean, business: {...} }`
  - Requires business ownership or admin role

## Database Schema

### OAuthAccount Model

Stores linked OAuth accounts:

```prisma
model OAuthAccount {
  id              String
  userId          String
  provider        String  // 'yandex'
  providerUserId  String  // Yandex user ID
  providerLogin   String?
  email           String?
  accessToken     String? // Truncated for security
  refreshToken    String?
  expiresAt       DateTime?
  createdAt       DateTime
  updatedAt       DateTime
}
```

### Business Model (Yandex fields)

```prisma
model Business {
  // ... other fields
  yandexOrgId        String?
  yandexOrgName      String?
  yandexOrgRaw       Json?
  yandexVerifiedAt   DateTime?
  yandexVerificationMethod String?
}
```

## Security Considerations

1. **OAuth State Parameter**: CSRF protection via state token stored in secure cookie
2. **Access Tokens**: Stored truncated (first 100 chars) for logging/debugging only
3. **API Keys**: Never expose in client-side code (except `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` which is safe for Maps display)
4. **Error Handling**: OAuth errors redirect to `/auth/error` with user-friendly messages

## Troubleshooting

### Yandex OAuth Issues

- **"Yandex OAuth is not configured"**: Check that all three env variables are set
- **"Invalid redirect URI"**: Ensure redirect URI in Yandex console matches exactly (including protocol and port)
- **"Invalid state"**: Usually means CSRF token expired or was tampered with

### Yandex Maps API Issues

- **"YANDEX_MAPS_NOT_CONFIGURED"**: Check that `YANDEX_MAPS_API_KEY` is set
- **"Failed to search businesses"**: Verify API key is valid and Places API is enabled
- **No results found**: Try different search terms (phone number, business name, INN)

## Feature Flags

Both integrations gracefully degrade if not configured:
- Yandex sign-in button is hidden if OAuth is not configured
- Business verification section is hidden if Maps API is not configured
- Error messages guide users to manual input

## Production Checklist

- [ ] Create Yandex OAuth app with production redirect URI
- [ ] Set production environment variables
- [ ] Enable Places API in Yandex Cloud
- [ ] Test OAuth flow end-to-end
- [ ] Test business verification flow
- [ ] Monitor API usage and quotas
- [ ] Set up error logging for OAuth/Maps API failures

