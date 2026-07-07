# AI Crawler Protection Audit - echocity - 2026-04-30

## Project

- Project name: echocity
- Domain: https://REPLACE_WITH_DOMAIN
- Framework: Next.js
- Project type: mixed public + private platform
- Risk score before: MEDIUM
- Risk score after: LOW

## Public Routes

- /
- /auth/error
- /auth/login
- /auth/register
- /bundles
- /bundles/*
- /business/analytics
- /business/bundles
- /business/dashboard
- /business/demand
- /business/offers
- /business/offers/*
- /business/offers/create
- /business/offers/flash
- /business/offers/mystery-bag
- /business/places
- /business/places/*/services
- /business/redemptions
- /business/register
- /business/reservations-manage
- /business/scanner
- /business/staff
- /business/stories
- /business/stories/create
- /business/tables
- /collections/*
- /compare
- /corporate
- /demands
- /demands/*
- /dev/reviews-test/*
- /family
- /favorites
- /for-businesses
- /for-users
- /groups
- /guarantee
- /history
- /leaderboard
- /map
- /miniapp
- /miniapp/map
- /miniapp/offers/*
- /miniapp/offers/*/redeem
- /missions
- /mystery-bags
- /offers
- /offers/*
- /offers/*/redeem
- /places/*
- /places/*/reserve
- /privacy
- /profile
- /reservations
- /roulette
- /search
- /subscription
- /terms
- /tourist
- /wallet

## Protected Routes

- /admin
- /admin/analytics
- /admin/api-control
- /admin/bundles
- /admin/businesses
- /admin/cities
- /admin/complaints
- /admin/franchises
- /admin/fraud
- /admin/offers
- /admin/users
- /api/admin/analytics
- /api/admin/bundles
- /api/admin/bundles/*
- /api/admin/businesses
- /api/admin/businesses/*
- /api/admin/cities
- /api/admin/complaints
- /api/admin/complaints/*
- /api/admin/franchises
- /api/admin/franchises/list
- /api/admin/fraud
- /api/admin/offers
- /api/admin/offers/*/approve
- /api/admin/offers/*/reject
- /api/admin/places/search
- /api/admin/users
- /api/admin/users/*
- /api/auth/login
- /api/auth/logout
- /api/auth/me
- /api/auth/miniapp/verify
- /api/auth/phone/send-otp
- /api/auth/phone/verify
- /api/auth/register
- /api/auth/yandex/callback
- /api/auth/yandex/start
- /api/bundles
- /api/bundles/*
- /api/bundles/*/redeem
- /api/business/analytics
- /api/business/analytics/competition
- /api/business/analytics/heatmap
- /api/business/bundles
- /api/business/bundles/*/accept
- /api/business/demand
- /api/business/demand/respond
- /api/business/demand/suggestions
- /api/business/offers
- /api/business/offers/*
- /api/business/offers/*/pause
- /api/business/offers/*/resume
- /api/business/offers/*/submit
- /api/business/offers/flash
- /api/business/offers/mystery-bag
- /api/business/offers/templates
- /api/business/places/*/services
- /api/business/redemptions
- /api/business/register
- /api/business/reservations
- /api/business/reservations/*
- /api/business/staff
- /api/business/staff/*
- /api/business/stories
- /api/business/tables
- /api/business/tables/*
- /api/businesses/*/link-yandex
- /api/categories
- /api/coins
- /api/coins/history
- /api/collections
- /api/collections/*
- /api/collections/seasonal
- /api/complaints
- /api/corporate
- /api/corporate/*
- /api/corporate/*/employees
- /api/demand/*/bids
- /api/demand/*/place
- /api/demand/create

Baseline protected prefixes for any deployed service: /api/, /admin/, /dashboard/, /app/, /account/, /settings/, /internal/, /private/, /export/, /reports/, /analytics/, /uploads/, /console/, /paper/, /research/, /strategies/, /markets/, /reversal/

## Existing Controls

- robots.txt: present
- sitemap.xml or sitemap route: missing/not detected
- llms.txt: present
- middleware/auth/rate-limit files detected: 61


## Sensitive Data Surfaces

### API endpoints and route handlers

- .claude/worktrees/charming-antonelli/app/api/geocode/route.ts
- .claude/worktrees/charming-antonelli/app/api/places/route.ts
- .claude/worktrees/charming-antonelli/app/api/profile/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/bundles/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/categories/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/coins/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/collections/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/complaints/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/family/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/favorites/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/geocode/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/group-deals/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/health/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/offers/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/places/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/profile/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/referrals/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/reservations/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/savings/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/search/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/stories/route.ts
- .claude/worktrees/dreamy-goldberg/app/api/streak/route.ts
- .claude/worktrees/flamboyant-jang/app/api/bundles/route.ts
- .claude/worktrees/flamboyant-jang/app/api/categories/route.ts
- .claude/worktrees/flamboyant-jang/app/api/coins/route.ts
- .claude/worktrees/flamboyant-jang/app/api/collections/route.ts
- .claude/worktrees/flamboyant-jang/app/api/complaints/route.ts
- .claude/worktrees/flamboyant-jang/app/api/family/route.ts
- .claude/worktrees/flamboyant-jang/app/api/favorites/route.ts
- .claude/worktrees/flamboyant-jang/app/api/geocode/route.ts
- .claude/worktrees/flamboyant-jang/app/api/group-deals/route.ts
- .claude/worktrees/flamboyant-jang/app/api/health/route.ts
- .claude/worktrees/flamboyant-jang/app/api/leaderboard/route.ts
- .claude/worktrees/flamboyant-jang/app/api/offers/route.ts
- .claude/worktrees/flamboyant-jang/app/api/places/route.ts
- .claude/worktrees/flamboyant-jang/app/api/profile/route.ts
- .claude/worktrees/flamboyant-jang/app/api/referrals/route.ts
- .claude/worktrees/flamboyant-jang/app/api/reservations/route.ts
- .claude/worktrees/flamboyant-jang/app/api/savings/route.ts
- .claude/worktrees/flamboyant-jang/app/api/search/route.ts
- .claude/worktrees/flamboyant-jang/app/api/stories/route.ts
- .claude/worktrees/flamboyant-jang/app/api/streak/route.ts
- .claude/worktrees/flamboyant-jang/app/api/streaks/route.ts
- app/api/admin/analytics/route.ts
- app/api/admin/bundles/route.ts
- app/api/admin/bundles/[id]/route.ts
- app/api/admin/businesses/route.ts
- app/api/admin/businesses/[id]/route.ts
- app/api/admin/cities/route.ts
- app/api/admin/complaints/route.ts
- app/api/admin/complaints/[id]/route.ts
- app/api/admin/franchises/list/route.ts
- app/api/admin/franchises/route.ts
- app/api/admin/fraud/route.ts
- app/api/admin/offers/route.ts
- app/api/admin/offers/[id]/approve/route.ts
- app/api/admin/offers/[id]/reject/route.ts
- app/api/admin/places/search/route.ts
- app/api/admin/users/route.ts
- app/api/admin/users/[id]/route.ts
- app/api/auth/login/route.ts
- app/api/auth/logout/route.ts
- app/api/auth/me/route.ts
- app/api/auth/miniapp/verify/route.ts
- app/api/auth/phone/send-otp/route.ts
- app/api/auth/phone/verify/route.ts
- app/api/auth/register/route.ts
- app/api/auth/yandex/callback/route.ts
- app/api/auth/yandex/start/route.ts
- app/api/bundles/route.ts
- app/api/bundles/[id]/redeem/route.ts
- app/api/bundles/[id]/route.ts
- app/api/business/analytics/competition/route.ts
- app/api/business/analytics/heatmap/route.ts
- app/api/business/analytics/route.ts
- app/api/business/bundles/route.ts
- app/api/business/bundles/[id]/accept/route.ts
- app/api/business/demand/respond/route.ts
- app/api/business/demand/route.ts
- app/api/business/demand/suggestions/route.ts

### Middleware/auth/rate-limit indicators

- .claude/reviews/HANDOFF-SESSION-A-CONTINUE-REVIEW.md
- .claude/reviews/HANDOFF-SESSION-B-SHIP-P0-P1.md
- .claude/reviews/HANDOFF-SESSION-C-OWNER-DECISIONS.md
- .claude/sessions/2026-03-17-full-session.md
- .claude/worktrees/charming-antonelli/lib/admin-guard.ts
- .claude/worktrees/charming-antonelli/lib/auth-client.ts
- .claude/worktrees/charming-antonelli/modules/auth/session.ts
- .claude/worktrees/charming-antonelli/modules/yandex/oauth.ts
- .claude/worktrees/charming-antonelli/SESSION_SUMMARY.md
- .claude/worktrees/dreamy-goldberg/.claude/sessions/2026-03-17-full-session.md
- .claude/worktrees/dreamy-goldberg/components/AuthPrompt.tsx
- .claude/worktrees/dreamy-goldberg/lib/admin-guard.ts
- .claude/worktrees/dreamy-goldberg/lib/auth-client.ts
- .claude/worktrees/dreamy-goldberg/lib/rate-limit.ts
- .claude/worktrees/dreamy-goldberg/lib/useAuthPrompt.ts
- .claude/worktrees/dreamy-goldberg/middleware.ts
- .claude/worktrees/dreamy-goldberg/modules/auth/session.ts
- .claude/worktrees/dreamy-goldberg/modules/yandex/oauth.ts
- .claude/worktrees/dreamy-goldberg/test-screenshots/auth-login-filled.png
- .claude/worktrees/dreamy-goldberg/test-screenshots/auth-login-page.png
- .claude/worktrees/dreamy-goldberg/test-screenshots/auth-login-result.png
- .claude/worktrees/dreamy-goldberg/tests/e2e/auth.spec.ts
- .claude/worktrees/dreamy-goldberg/tests/e2e/flows/01-registration-auth.spec.ts
- .claude/worktrees/dreamy-goldberg/tests/helpers/auth-helpers.ts
- .claude/worktrees/dreamy-goldberg/tests/unit/auth-session.test.ts
- .claude/worktrees/dreamy-goldberg/tests/unit/rate-limit.test.ts
- .claude/worktrees/flamboyant-jang/.claude/sessions/2026-03-17-full-session.md
- .claude/worktrees/flamboyant-jang/components/AuthPrompt.tsx
- .claude/worktrees/flamboyant-jang/lib/admin-guard.ts
- .claude/worktrees/flamboyant-jang/lib/auth-client.ts
- .claude/worktrees/flamboyant-jang/lib/rate-limit.ts
- .claude/worktrees/flamboyant-jang/lib/useAuthPrompt.ts
- .claude/worktrees/flamboyant-jang/middleware.ts
- .claude/worktrees/flamboyant-jang/modules/auth/session.ts
- .claude/worktrees/flamboyant-jang/modules/yandex/oauth.ts
- .claude/worktrees/flamboyant-jang/test-screenshots/auth-login-filled.png
- .claude/worktrees/flamboyant-jang/test-screenshots/auth-login-page.png
- .claude/worktrees/flamboyant-jang/test-screenshots/auth-login-result.png
- .claude/worktrees/flamboyant-jang/tests/e2e/auth.spec.ts
- .claude/worktrees/flamboyant-jang/tests/e2e/flows/01-registration-auth.spec.ts
- .claude/worktrees/flamboyant-jang/tests/helpers/auth-helpers.ts
- .claude/worktrees/flamboyant-jang/tests/unit/auth-session.test.ts
- .claude/worktrees/flamboyant-jang/tests/unit/rate-limit.test.ts
- components/AuthPrompt.tsx
- docs/audit/2026-04-08-session-handoff.md
- lib/admin-guard.ts
- lib/auth-client.ts
- lib/rate-limit.ts
- lib/useAuthPrompt.ts
- middleware.ts
- modules/auth/session.ts
- modules/miniapp/auth.ts
- modules/yandex/oauth.ts
- test-screenshots/auth-login-filled.png
- test-screenshots/auth-login-page.png
- test-screenshots/auth-login-result.png
- tests/e2e/auth.spec.ts
- tests/e2e/flows/01-registration-auth.spec.ts
- tests/helpers/auth-helpers.ts
- tests/unit/auth-session.test.ts
- tests/unit/rate-limit.test.ts

### Export/download/upload/report indicators

- .claude/worktrees/charming-antonelli/AUDIT_REPORT.md
- .claude/worktrees/charming-antonelli/AUDIT_REPORT_LATEST.md
- .claude/worktrees/charming-antonelli/scripts/upload-avatar-test.ts
- .claude/worktrees/charming-antonelli/TESTING_REPORT.md
- .claude/worktrees/dreamy-goldberg/playwright-report/data/08180b83ccbe93127953e91178264cfdebae2b5e.md
- .claude/worktrees/dreamy-goldberg/playwright-report/data/2a78189acc18c710c2b440e37ea3997119f306b2.md
- .claude/worktrees/dreamy-goldberg/playwright-report/data/5f19c4cae4f6c572458b4f56c68550e96fe6f6d7.md
- .claude/worktrees/dreamy-goldberg/playwright-report/data/8a7749086983031078c5d329ec4a94091aa57da6.png
- .claude/worktrees/dreamy-goldberg/playwright-report/data/976ef91d03055678f35ea2bb626e1f20e0ec8eae.md
- .claude/worktrees/dreamy-goldberg/playwright-report/data/9a650b45e10a439715a840ae4f73a90a9addcbcf.png
- .claude/worktrees/dreamy-goldberg/playwright-report/data/9ed462bb47b0c609147de6911149f5c83c35ef53.png
- .claude/worktrees/dreamy-goldberg/playwright-report/data/ada18c104df40fb8a4b5d88e74940e595e2f3c7c.png
- .claude/worktrees/dreamy-goldberg/playwright-report/data/bc66c95f19dd7980a0554d078b966546fd741f8f.png
- .claude/worktrees/dreamy-goldberg/playwright-report/data/c015baaa617fd676061cdfcc551ad2103626771d.md
- .claude/worktrees/dreamy-goldberg/playwright-report/data/daa5f263747d7edd58dc3f091aabd45918e53179.png
- .claude/worktrees/dreamy-goldberg/playwright-report/data/dbc1fa139a5e5d37a1a1254f46a7fc9bc6497e39.md
- .claude/worktrees/dreamy-goldberg/playwright-report/data/f2973fe00fece6b9011273e7cfb8506cf4d5fe03.png
- .claude/worktrees/dreamy-goldberg/playwright-report/data/fbfbee33010ad1e5c60d8a3e1c428de619fb5742.md
- .claude/worktrees/dreamy-goldberg/playwright-report/data/fdc5f18948a96ab635b3129cba398b59f742ff2e.png
- .claude/worktrees/dreamy-goldberg/playwright-report/index.html
- .claude/worktrees/dreamy-goldberg/scripts/upload-avatar-test.ts
- .claude/worktrees/dreamy-goldberg/security-scan-report.md
- .claude/worktrees/flamboyant-jang/playwright-report/data/08180b83ccbe93127953e91178264cfdebae2b5e.md
- .claude/worktrees/flamboyant-jang/playwright-report/data/2a78189acc18c710c2b440e37ea3997119f306b2.md
- .claude/worktrees/flamboyant-jang/playwright-report/data/5f19c4cae4f6c572458b4f56c68550e96fe6f6d7.md
- .claude/worktrees/flamboyant-jang/playwright-report/data/8a7749086983031078c5d329ec4a94091aa57da6.png
- .claude/worktrees/flamboyant-jang/playwright-report/data/976ef91d03055678f35ea2bb626e1f20e0ec8eae.md
- .claude/worktrees/flamboyant-jang/playwright-report/data/9a650b45e10a439715a840ae4f73a90a9addcbcf.png
- .claude/worktrees/flamboyant-jang/playwright-report/data/9ed462bb47b0c609147de6911149f5c83c35ef53.png
- .claude/worktrees/flamboyant-jang/playwright-report/data/ada18c104df40fb8a4b5d88e74940e595e2f3c7c.png
- .claude/worktrees/flamboyant-jang/playwright-report/data/bc66c95f19dd7980a0554d078b966546fd741f8f.png
- .claude/worktrees/flamboyant-jang/playwright-report/data/c015baaa617fd676061cdfcc551ad2103626771d.md
- .claude/worktrees/flamboyant-jang/playwright-report/data/daa5f263747d7edd58dc3f091aabd45918e53179.png
- .claude/worktrees/flamboyant-jang/playwright-report/data/dbc1fa139a5e5d37a1a1254f46a7fc9bc6497e39.md
- .claude/worktrees/flamboyant-jang/playwright-report/data/f2973fe00fece6b9011273e7cfb8506cf4d5fe03.png
- .claude/worktrees/flamboyant-jang/playwright-report/data/fbfbee33010ad1e5c60d8a3e1c428de619fb5742.md
- .claude/worktrees/flamboyant-jang/playwright-report/data/fdc5f18948a96ab635b3129cba398b59f742ff2e.png
- .claude/worktrees/flamboyant-jang/playwright-report/index.html
- .claude/worktrees/flamboyant-jang/scripts/upload-avatar-test.ts
- .claude/worktrees/flamboyant-jang/security-scan-report.md
- app/api/reviews/upload/route.ts
- docs/audit/2026-04-08-retest/regression_report.md
- playwright-report/data/08180b83ccbe93127953e91178264cfdebae2b5e.md
- playwright-report/data/2a78189acc18c710c2b440e37ea3997119f306b2.md
- playwright-report/data/5f19c4cae4f6c572458b4f56c68550e96fe6f6d7.md
- playwright-report/data/8a7749086983031078c5d329ec4a94091aa57da6.png
- playwright-report/data/976ef91d03055678f35ea2bb626e1f20e0ec8eae.md
- playwright-report/data/9a650b45e10a439715a840ae4f73a90a9addcbcf.png
- playwright-report/data/9ed462bb47b0c609147de6911149f5c83c35ef53.png
- playwright-report/data/ada18c104df40fb8a4b5d88e74940e595e2f3c7c.png
- playwright-report/data/bc66c95f19dd7980a0554d078b966546fd741f8f.png
- playwright-report/data/c015baaa617fd676061cdfcc551ad2103626771d.md
- playwright-report/data/daa5f263747d7edd58dc3f091aabd45918e53179.png
- playwright-report/data/dbc1fa139a5e5d37a1a1254f46a7fc9bc6497e39.md
- playwright-report/data/f2973fe00fece6b9011273e7cfb8506cf4d5fe03.png
- playwright-report/data/fbfbee33010ad1e5c60d8a3e1c428de619fb5742.md
- playwright-report/data/fdc5f18948a96ab635b3129cba398b59f742ff2e.png
- playwright-report/index.html
- scripts/upload-avatar-test.ts
- security-scan-report.md

### Large data/blob indicators

- .claude/worktrees/charming-antonelli/app/business/register/page.tsx
- .claude/worktrees/charming-antonelli/app/settings/page.tsx
- .claude/worktrees/dreamy-goldberg/app/(consumer)/settings/page.tsx
- .claude/worktrees/dreamy-goldberg/app/admin/bundles/page.tsx
- .claude/worktrees/dreamy-goldberg/app/admin/businesses/page.tsx
- .claude/worktrees/dreamy-goldberg/app/admin/users/page.tsx
- .claude/worktrees/dreamy-goldberg/app/auth/register/page.tsx
- .claude/worktrees/dreamy-goldberg/app/business/register/page.tsx
- .claude/worktrees/dreamy-goldberg/components/OfferDetailClient.tsx
- .claude/worktrees/dreamy-goldberg/components/OfferWizard.tsx
- .claude/worktrees/dreamy-goldberg/scripts/run-scenario-matrix.ts
- .claude/worktrees/flamboyant-jang/app/(consumer)/settings/page.tsx
- .claude/worktrees/flamboyant-jang/app/admin/bundles/page.tsx
- .claude/worktrees/flamboyant-jang/app/admin/businesses/page.tsx
- .claude/worktrees/flamboyant-jang/app/admin/users/page.tsx
- .claude/worktrees/flamboyant-jang/app/auth/register/page.tsx
- .claude/worktrees/flamboyant-jang/app/business/register/page.tsx
- .claude/worktrees/flamboyant-jang/components/OfferDetailClient.tsx
- .claude/worktrees/flamboyant-jang/components/OfferWizard.tsx
- .claude/worktrees/flamboyant-jang/scripts/run-scenario-matrix.ts
- app/(consumer)/settings/page.tsx
- app/admin/bundles/page.tsx
- app/admin/businesses/page.tsx
- app/admin/users/page.tsx
- app/auth/register/page.tsx
- app/business/register/page.tsx
- components/OfferDetailClient.tsx
- components/OfferWizard.tsx
- scripts/run-scenario-matrix.ts

### Production source-map indicators

- No production source-map enablement detected.

## Files Changed

- public/robots.txt
- public/llms.txt
- docs/ai-crawler-protection-2026-04-30.md

## Cloudflare Settings Needed

- Put the domain behind the Cloudflare orange-cloud proxy.
- Enable WAF and Bot protection/Bot Management where available.
- Enable AI Crawl Control and review the Crawlers, Metrics, and Robots.txt tabs.
- Allow verified Googlebot, Bingbot, YandexBot, and OAI-SearchBot on public SEO pages.
- Block GPTBot, ClaudeBot, CCBot, Bytespider, Meta-ExternalAgent, PerplexityBot, Amazonbot, Applebot-Extended, and Google-Extended.
- Enable AI Labyrinth for suspicious crawler behavior and robots.txt violators where appropriate.
- Add WAF custom rules:
  - Managed Challenge or block requests to protected route prefixes when unauthenticated.
  - Rate-limit /search, /api/search, /export, /download, and detail/listing endpoints.
  - Challenge unknown high-rate bots, sequential ID enumeration, and headless browser fingerprints.
- Monitor IP, user-agent, ASN, country, path, rate, status, auth state, referrer, public/private route class, and bot-like behavior.

Suggested WAF expression templates:

```text
# Block AI training / bulk crawlers globally.
(lower(http.user_agent) contains "gptbot" or lower(http.user_agent) contains "claudebot" or lower(http.user_agent) contains "claude-user" or lower(http.user_agent) contains "google-extended" or lower(http.user_agent) contains "applebot-extended" or lower(http.user_agent) contains "ccbot" or lower(http.user_agent) contains "bytespider" or lower(http.user_agent) contains "meta-externalagent" or lower(http.user_agent) contains "perplexitybot" or lower(http.user_agent) contains "amazonbot")

# Challenge unauthenticated access to protected routes.
((http.request.uri.path wildcard "/api/*" or http.request.uri.path wildcard "/admin/*" or http.request.uri.path wildcard "/dashboard/*" or http.request.uri.path wildcard "/app/*" or http.request.uri.path wildcard "/account/*" or http.request.uri.path wildcard "/settings/*" or http.request.uri.path wildcard "/internal/*" or http.request.uri.path wildcard "/private/*" or http.request.uri.path wildcard "/export/*" or http.request.uri.path wildcard "/reports/*" or http.request.uri.path wildcard "/analytics/*") and not http.cookie contains "REPLACE_WITH_SESSION_COOKIE=")

# Do not challenge known discovery crawlers on public pages.
(cf.client.bot and (lower(http.user_agent) contains "googlebot" or lower(http.user_agent) contains "bingbot" or lower(http.user_agent) contains "yandex" or lower(http.user_agent) contains "oai-searchbot") and not (http.request.uri.path wildcard "/api/*" or http.request.uri.path wildcard "/admin/*" or http.request.uri.path wildcard "/dashboard/*" or http.request.uri.path wildcard "/app/*" or http.request.uri.path wildcard "/account/*" or http.request.uri.path wildcard "/settings/*" or http.request.uri.path wildcard "/internal/*" or http.request.uri.path wildcard "/private/*" or http.request.uri.path wildcard "/export/*" or http.request.uri.path wildcard "/reports/*" or http.request.uri.path wildcard "/analytics/*"))
```


## Route-Level Protection Requirements

- /admin/* must require admin authentication.
- /dashboard/*, /app/*, /account/*, /settings/*, /reports/*, and /analytics/* must require authenticated users.
- /api/private/*, /api/admin/*, /api/export/*, and write APIs must require server-side auth.
- Listing/search APIs must enforce max limits, bounded pagination, and rate limits.
- Export/download endpoints must require auth, rate limits, audit logging, and business justification.
- Do not expose private database-shaped JSON, internal route maps, pricing engines, or full datasets in frontend HTML.
- Disable production browser source maps unless explicitly needed and access-controlled.

## Terms Clause To Add Or Verify

Automated scraping, crawling, extraction, reverse engineering, dataset creation, AI training, replication of UI flows, replication of business logic, and cloning of this platform are prohibited without prior written permission.

Search engine indexing of public marketing pages is permitted. Access to private, authenticated, API, dashboard, admin, export, and analytics areas by automated systems is prohibited.

## Verification Results

- Static scan completed locally on 2026-04-30.
- robots.txt: created if missing, or existing framework/static implementation left in place for manual review
- sitemap.xml: not detected; add/generate once canonical production domain is confirmed
- llms.txt: created if missing
- Live curl verification: not run for this repo unless a production domain was known and network target was safe to probe.


Suggested live checks:

```bash
curl -I https://REPLACE_WITH_DOMAIN/robots.txt
curl -I https://REPLACE_WITH_DOMAIN/sitemap.xml
curl -I https://REPLACE_WITH_DOMAIN/llms.txt
curl -A "OAI-SearchBot" https://REPLACE_WITH_DOMAIN/
curl -A "GPTBot" https://REPLACE_WITH_DOMAIN/
curl -A "ClaudeBot" https://REPLACE_WITH_DOMAIN/
curl -A "Googlebot" https://REPLACE_WITH_DOMAIN/
curl -A "BadBot" https://REPLACE_WITH_DOMAIN/api/private
```

## Remaining TODOs

- Replace REPLACE_WITH_DOMAIN / REPLACE_WITH_CONTACT_EMAIL placeholders where present.
- Confirm the production domain and sitemap generation for any repo marked missing sitemap.
- Manually review API handlers listed above for auth, pagination bounds, and rate limits.
- Configure Cloudflare enforcement; robots.txt and llms.txt are policy signals, not security controls.
- Add crawler/security monitoring dashboards and alerts for high 404s, ID enumeration, rapid pagination, repeated exports, unauthenticated API probing, and UA rotation.
