# Session: Competitive Feature Blitz — Russian Market Differentiation
**Date**: 2026-03-22
**Agent**: Claude Opus 4.6 (1M context)
**Status**: Completed

## Context
User requested a deep competitive analysis of the Russian local deals market, followed by implementation of features that would differentiate EchoCity from all competitors (Afisha, KudaGo, 2GIS, Yandex, Biglion, Zoon, Flamp, Otzovik).

## Research Phase
Comprehensive research of 11 Russian platforms covering:
- Afisha.ru (events/tickets)
- KudaGo.com (city events)
- 2GIS (maps + directory)
- Yandex Maps ecosystem
- Otzovik/iRecommend (reviews)
- Biglion (deals)
- Zoon.ru (services)
- Flamp.ru (reviews)
- VK/Telegram (community)

Key finding: **No single Russian platform combines events + business discovery + deals + reviews + community + editorial content.** Every competitor is siloed.

## Work Performed

### Round 1: Core Competitive Differentiators (3 features)
1. **Verified Reviews** — Added `isVerifiedVisit: true` badge to all reviews (since ALL reviews require successful redemption). Green "Визит подтверждён" badge on each review + trust banner. Review count with verification icon on offer cards in feed.
2. **Trending Demands** — New `GET /api/demand/trending` endpoint. TrendingDemands component showing top 5 demands with one-tap "+1" support. Merchant response rate social proof.
3. **What's Hot Right Now** — New `GET /api/offers/hot` aggregation endpoint querying 4 urgency signals (flash, expiring, popular, almost gone). Horizontal carousel with color-coded labels.

### Round 2: Feed & Engagement Improvements (6 features)
4. **Smart Feed Sorting** — Engagement-weighted ranking replacing simple createdAt sort. Composite score: recency (30pts), redemptions (30pts), reviews (20pts), trending (15pts), flash (10pts).
5. **Expiry Countdown** — ExpiryCountdown component on offer detail page with urgency gradient.
6. **Social Proof Ticker** — RecentActivityTicker showing live redemption activity.
7. **Category Deal Counts** — Live counts on category filter pills via GET /api/offers/counts.
8. **Referral Attribution** — ShareButton with ref tracking, stored in localStorage for attribution.
9. **Personalized "For You"** — ForYouOffers section based on user's redemption history categories.

### Round 3: Discovery & Navigation (6 features)
10. **Demand Creation Page** — Full /demands page with create form.
11. **Stories Bar** — Instagram-style stories carousel on offers page.
12. **Featured Collections** — Curated deal collections component.
13. **Top Rated Offers** — Section showing highest-reviewed offers.
14. **Recently Viewed** — localStorage-based recent offers section.
15. **Nearby Offers with Geolocation** — NearbyOffers component with browser geolocation API.

### Round 4: Advanced Features (6 features)
16. **Deal Roulette** — /roulette page with CSS animated wheel, 1 free spin/day, 4h time limit on won deals.
17. **Streak 2.0** — Freeze tokens (1 per 7-day milestone), at-risk warnings, StreakWidget in offers header.
18. **Surprise Bags** — "🎁 Сюрприз" category filter showing flash deals as mystery bags.
19. **Neighborhood Leaderboard** — /leaderboard page with 3 tabs (savers, redeemers, reviewers), monthly reset.
20. **Demand Bidding** — GET /api/demand/[id]/bids, DemandBids component showing competing merchant offers.
21. **Savings Tracker** — GET /api/profile/savings with lifetime/monthly stats, CSS bar charts, share button.

### Round 5: Leftover Polish (3 features)
22. **Tourist Mode Enhancement** — Language hint, category pills, popular-with-tourists section, roulette link.
23. **Offer Comparison** — /compare page with CompareTable, useCompare hook, CompareBar.
24. **Push Notification Integration** — PushPermissionBanner added to consumer layout.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| No WebSockets for real-time | Used polling + smart aggregation instead — same perceived result, zero infra cost |
| localStorage for roulette/compare/recently-viewed | Client-side persistence avoids DB writes for lightweight features |
| Engagement score in API vs client | Server-side scoring ensures consistent ranking across all clients |
| Separate bids API instead of include in demand | Avoids N+1 and keeps demand listing fast |

## Commits (chronological)
- `0efec00` — feat: verified reviews, trending demands, what's hot feed
- `c3e1ad4` — feat: smart ranking, urgency, social proof, personalization
- `1b4f0a6` — feat: demand creation, stories, collections, top-rated, savings
- `769f32c` — feat: recently viewed, nearby offers, geolocation, demands nav
- `39f5b1b` — feat(roulette): daily mystery spin with animated wheel
- `dfcd689` — feat(streaks): streak 2.0 with freeze tokens and at-risk warnings
- `e940179` — feat(surprise): surprise bag category filter
- `13bdcb5` — feat(leaderboard): neighborhood leaderboard with monthly cycles
- `8b615b4` — feat(bidding): demand bidding — merchants compete for user requests
- `db44e6f` — feat(savings): savings tracker dashboard + fix TS errors
- `e60ba2b` — feat: tourist personalization, offer comparison, push notifications

## Testing
- [x] TypeScript: 0 errors (npx tsc --noEmit)
- [x] Next.js build: passes (npx next build)
- [ ] Visual verification: dev server not started (user declined preview_start)
- [ ] Integration tests: not run

## Issues Discovered
- UserSavings model uses `savedAt` not `createdAt` — caught and fixed during TS check
- Business model has no `logoUrl` field — removed from DemandBids
- User model `avatarUrl` is on UserProfile relation, not User directly — fixed in leaderboard API
