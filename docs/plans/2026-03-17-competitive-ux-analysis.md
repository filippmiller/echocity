# Competitive UI/UX Analysis: Global Deals Platforms
**Date:** 2026-03-17
**Author:** Claude + Filip Miller
**Purpose:** Extract the best mobile UX patterns from top global deals platforms to inform EchoCity's design

---

## Context: What EchoCity Is Building

EchoCity is a city-first deals platform targeting St. Petersburg (initially) with:
- QR-based offer redemption (60s session, 6-char shortcode fallback)
- 3-tier subscription model (Free / Plus 199₽ / Premium 499₽)
- 8 offer types including Flash deals with countdowns
- Demand engine ("Хочу скидку")
- Bottom tab navigation: Главная | Карта | Поиск | Избранное | Профиль
- Yandex Maps integration

This analysis extracts the best patterns from each competitor to apply directly.

---

## 1. Groupon — The Reference Architecture

**Market:** Global (US, UK, EU, etc.)
**Model:** Flash/limited deals, pay upfront, redeem with voucher code
**Platform maturity:** 15+ years, deeply studied

### Navigation Structure

- **5-tab bottom nav (mobile):** Browse, Nearby, Search, Saved, Account
- Home screen is aggressively personalized — "For You" feed dominates
- City/location selector is sticky in the header, always visible
- Category pills (horizontal scroll) sit immediately below the search bar
- "Nearby" tab launches directly into map mode

### Deal Card Design

Groupon's deal card design system is the most documented in the industry. Key principles:

- **Atomic design approach** — separate card variants per vertical (Local, Goods, Getaways, Travel, Things To Do)
- **Anti-banner-blindness rules:** Cards are not uniform — they vary in height, image prominence, and badge placement based on deal type
- **Visual hierarchy on each card:**
  1. Full-bleed image (top 60% of card)
  2. Merchant name (small, muted)
  3. Deal title (bold, 2 lines max)
  4. Price block: original price struck through in gray + deal price in green/teal + % badge (top-right corner, pill shape, high contrast)
  5. Ratings row (star + count)
  6. Distance badge (bottom-left overlay on image)
  7. "Sold X" social proof (bottom of card)
- **Badge types:** "NEW", "POPULAR", "ALMOST GONE", countdown timer for flash deals
- Badge placement: top-right corner of the image, overlaid
- **Color system:**
  - Primary: Deep green `#1B8448` for prices and CTAs
  - Strike-through: `#9E9E9E` gray
  - Discount badge: Electric green `#53A318` or urgent red `#E22B2B` for flash
  - Background: White cards on light gray `#F5F5F5` feed
  - Typography: Bold sans-serif (SF Pro / Roboto), deal title ~16px bold, price ~22px bold

### Conversion Optimizations

- **"Buy Again" surface** — after a redemption, the exact deal reappears prominently on home screen
- **Personalized ranking** — browsing history, location history, and past purchases all feed the home feed order
- Cards in grid (2-column) for Goods, full-width list for Local/Getaways
- **Distance is always shown** on local deal cards — never hidden
- **Urgency patterns:** "X left", "Ends in Xh", countdown badge
- Swipe-to-save (heart) on cards — no tap required to favorite

### Onboarding Flow

1. Location permission — asked immediately, framed as "Find deals near you" with map illustration
2. Category preferences (5 of 20 selectable) — "Tell us what you love"
3. Email/password or social login (Apple, Google)
4. Deal feed appears immediately — no paywall on first session
5. Push notifications permission asked after first deal view (not during onboarding)

### Redemption UX

- User sees a **"View voucher"** button (not "Activate") — low friction
- Voucher screen: large alphanumeric code (8-12 chars), print button, barcode below
- No QR auto-expire — code is static (this is a known weakness vs EchoCity's live QR)
- "Mark as used" button for user to self-report (low security)
- Redemption confirmation: just a checkmark screen, no merchant confirmation

### Weaknesses (EchoCity should avoid)

- Static voucher codes are trivially shareable and non-secure
- No geofencing at redemption — anyone can "use" a deal remotely
- Subscription product (Groupon Select) was discontinued — single-tier model only now
- Personalization is good but the feed can feel cluttered with too many ad-adjacent placements
- Map experience is secondary, not first-class

### Key Takeaway for EchoCity

The atomic deal card system — with per-type variants, anti-banner-blindness variation, and the strict visual hierarchy of image → title → price block → social proof — is the gold standard. The "almost gone" urgency pattern combined with real sold counts is highly effective for conversion.

---

## 2. Yelp — Discovery-First, Deals Second

**Market:** US-dominant, some UK/CA
**Model:** Free discovery with Yelp Deals as an add-on (not core)
**Lesson:** How to do discovery + map excellently, deals as a conversion layer

### Navigation Structure

- **5-tab bottom nav:** Home, Search, Write Review, Notifications, Me
- Search is center-tab and primary action — search is the core loop
- Home feed is editorial + personalized: "Open Now Near You", "New on Yelp", curated collections
- **No dedicated Deals tab** — deals surface inside business pages and search results

### Deal Card Design

- Deals on Yelp appear as a **badge** on the business card within search results, not as standalone deal cards
- Business card structure:
  1. Square/rectangular image (left-aligned thumbnail or full-width hero)
  2. Business name (bold)
  3. Star rating + review count (yellow stars)
  4. Category tags (muted gray pills)
  5. Distance + neighborhood
  6. Price range ($ symbols)
  7. Open/Closed badge (green/red pill)
  8. Deal indicator: "Yelp Deal available — save up to 30%" in a teal/turquoise banner below
- **Color system:**
  - Primary brand: Red `#D32323`
  - Stars: `#F5A623` amber
  - Deal indicator: Teal `#009996`
  - Open badge: Green, Closed: Red
  - Background: White on white, very clean
  - Typography: System fonts, clean hierarchies

### Map UX (Yelp does this very well)

- Map is accessible from search results via a "Map" toggle at the top of the list
- Map pins: custom red circular pins with business photo thumbnail inside — immediately differentiates from Google Maps
- Tapping a pin surfaces a bottom card (not a new screen) — the business card slides up from bottom with swipe-to-dismiss
- **Split view:** Top 40% map, bottom 60% scrollable list — updating map viewport updates list in real-time
- This list-to-map toggle is one of the most copied patterns in local discovery apps

### Search & Filter UX

- Search bar is always visible, sticky at top
- After searching, filter bar appears below: Distance, Rating, Price, Hours, Open Now, More
- Filters are chips — selected ones show a dot/fill to confirm active state
- "Sort by" is a bottom sheet (not inline dropdown) — cleaner on mobile
- **Smart autocomplete:** Suggests businesses by name AND categories simultaneously in a unified list
- Recent searches are preserved and shown before typing

### Key Takeaway for EchoCity

Yelp's map-list split view with photo pins and bottom-sheet business detail is the UX to replicate for the Карта tab. The business-first model (deals surface inside places, not the other way around) also aligns well with EchoCity's architecture where Offer is a child of Place.

---

## 3. The Entertainer — Premium Annual Subscription, 2-for-1 Model

**Market:** UAE, Qatar, Kuwait, Saudi Arabia, UK, South Africa, Southeast Asia
**Model:** Annual app subscription unlock (~£60-200/year) giving access to 2-for-1 deals
**Key insight:** The highest-revenue-per-user deals app model outside North America

### Navigation Structure

- **4-tab bottom nav:** Home, Offers, Map, Account
- Home is a curated editorial feed with featured deal banners (full-width hero cards)
- "Offers" tab is the primary browsing surface — category-filtered horizontal scroll
- Map tab is full-screen Yandex/Google Maps with offer pins
- Account tab: subscription status, redemption history, saved offers

### Deal Card Design

- **Hero banner cards** at top of Home (full-width, 180px height, image + overlay text)
- **Standard offer card** (grid, 2-column):
  1. Restaurant/venue photo (top ~55%)
  2. Cuisine/category tag pill (bottom-left of image, semi-transparent dark background)
  3. Venue name (bold)
  4. "2-for-1" badge — prominent teal/green pill in top-right of image
  5. Cuisine type + star rating
  6. Distance from user
  7. "Offer available" indicator (subtle)
- **Color system:**
  - Primary brand: Deep teal/dark green `#003B49` (header, CTAs)
  - Accent: Gold/yellow for premium indicators
  - 2-for-1 badge: Lime green `#8CC63F`
  - Background: White cards, very minimal
  - Typography: Clean sans-serif, very readable

### Subscription Paywall UI

- On launch, non-subscribers see a **value proposition screen** before anything else
- Shows: "X offers, X restaurants, X countries" with specific numbers
- CTA: Large teal button "Get your product" — subscription purchase
- No free tier — full gate
- After purchase, seamless transition directly to deal feed
- **Subscription status** always visible in Account tab: plan name, expiry date, "X days remaining"

### Redemption Flow (Their signature UX)

1. User taps offer card → Offer detail page loads
2. "Redeem" button (large, bottom of screen)
3. **Confirmation step:** "You are about to redeem this offer. You have X redemptions remaining." — explicit remaining counter
4. Large animated countdown circle appears (typically 30-60 seconds)
5. A barcode/QR appears inside the countdown circle
6. Cashier scans the code before timer expires
7. Success state: Green checkmark animation + "Offer Redeemed" confirmation
8. The offer card updates to "Used today" / "X redemptions remaining"

The countdown timer with animated circle is extremely well-designed — creates urgency without panic, and the remaining count prevents over-use.

### Location Integration

- Geo-fencing: The app detects if you're near a participating outlet before allowing redemption
- "Nearby Offers" sorts by proximity automatically
- GPS accuracy indicator is shown on the map
- Search by neighborhood/area is a first-class feature

### Key Takeaway for EchoCity

The animated countdown circle with QR code inside is the best QR redemption UX in the industry — far better than a static code. The remaining-redemptions counter on the confirmation step is a trust-building pattern that EchoCity should copy verbatim. The 4-tab nav with Home / Offers / Map / Account is cleaner than Groupon's 5-tab.

---

## 4. Fave — Southeast Asia Super App for Local Commerce

**Market:** Singapore, Malaysia, Indonesia
**Model:** FaveDeals (pre-purchase discounts) + FavePay (cashback on payment at POS) + eCards
**Key insight:** Merged deals + payments into one loyalty loop

### Navigation Structure

- **5-tab bottom nav:** Home, Deals, FavePay, eCards, Me
- Home is location-personalized: "Near You", "Popular in [City]", Featured Brands
- FavePay tab: QR code for payment + cashback display — this is the primary tab for heavy users
- **The tab bar is the primary navigation** — no hamburger menu at all

### Deal Card Design

Fave went through a major redesign (post-2019) with clear principles:

- **Trust-first design** — most important decision after user research showed distrust of deals
- Deal card structure:
  1. Full-width merchant photo (top ~50%)
  2. Merchant name (bold)
  3. Category + ratings row
  4. Price: "From SGD X" (prominent) + "Was SGD Y" struck through
  5. Cashback badge: "X% cashback" in orange/coral pill — always visible
  6. Distance + "Open now" indicator
  7. Reviews count + "X people bought this" social proof
- **Cashback is the hero** — the discount % is secondary to cashback %
- **Color system:**
  - Primary: Coral/orange `#FF6B35` (cashback badges, CTAs)
  - Secondary: Deep navy `#1A1A4E`
  - Stars: Gold
  - Background: Off-white, cards with subtle shadow
  - Typography: Clean sans-serif, outline illustrations for empty states

### Trust-Building Patterns

Based on Fave's documented design journey, these elements were added specifically to build trust:
- Merchant rating prominently shown on card (not buried)
- "X people bought" social proof always shown
- Price guarantee badge on selected deals
- Business registration verification badges on merchant profiles
- "Most Popular" and "Bestseller" badges derived from actual purchase data

### FavePay QR Flow

- Home screen "Pay" button → full-screen QR code appears immediately
- No loading screen, no confirmation step — the QR is always ready
- QR rotates every 60 seconds (security) with a subtle pulse animation indicating freshness
- Cashback earned appears as a notification 2-3 seconds after payment confirmation
- **Cashback balance** is shown as a persistent "piggy bank" icon in the header — always visible
- Cashback history tab shows exactly which merchant + how much

### Onboarding

1. Location permission (city-level first, then precise)
2. "What do you love?" — 8 category icons, select any
3. Phone number verification (SMS OTP)
4. Feed appears immediately, no subscription gate
5. FavePay requires card linking — this is shown as a reward (earn cashback, not "add payment method")

### Key Takeaway for EchoCity

Fave's "cashback is the hero" badge design translates directly to EchoCity's discount-first card design. The "X people redeemed" social proof counter should be on every EchoCity deal card. The persistent cashback/savings balance visible in the header is a powerful engagement driver — EchoCity should show "total saved" (cumulative discount value) prominently in the user profile and possibly the home screen.

---

## 5. Wowcher — UK Flash Deals, Email-First

**Market:** UK only
**Model:** Flash deals (buy voucher, redeem at merchant or online), editorial curation
**Key insight:** How to do category browsing and email-driven engagement on mobile

### Navigation Structure

- **5-category top navigation + hamburger:** Trending, Travel, Spa, Experiences, Shops
- Mobile app adds bottom nav: Home, Categories, Search, My Wowcher, Account
- "My Wowcher" wallet tab is critical — stores purchased vouchers
- Strong editorial presence: "Deal of the Day" with countdown hero banner

### Deal Card Design

- **Full-width cards** (not grid) in the main feed — each card gets full horizontal real estate
- Card structure:
  1. Wide image (16:9, top 55%)
  2. "DEAL OF THE DAY" or category label ribbon (top-left, overlaid on image)
  3. Deal title (2 lines, bold)
  4. Original price struck through + deal price (large, in red)
  5. % saved badge (red pill, top-right of image)
  6. Star rating + review count
  7. "Buy Now" button (red, full-width, bottom of card)
- **"Buy Now" CTA on the card itself** — no need to open deal detail to start purchase
- **Color system:**
  - Primary: Wowcher red `#E5002B`
  - Secondary: Orange for limited offers
  - Strike-through: Medium gray
  - Background: Light gray feed, white cards
  - Typography: Bold headers, clear price hierarchy

### Deal of the Day Pattern

- Hero banner at top of home screen
- Countdown timer shows exact hours:minutes:seconds remaining
- "X sold today" real-time counter below the timer
- This combination (countdown + sold count) is extremely high-conversion

### Voucher Wallet UX

- Purchased vouchers live in "My Wowcher" tab
- Each voucher shows: merchant name, deal title, expiry date, status (valid/used/expired)
- Large "Redeem" button on each voucher
- Voucher codes are displayed as both alphanumeric text AND barcode
- "Add to Apple Wallet / Google Wallet" available — this is a strong convenience feature

### Key Takeaway for EchoCity

The "Deal of the Day" hero with dual urgency signals (countdown + sold count) is the highest-converting home screen pattern in the UK market. EchoCity's Flash deals section should use this exact pattern. The wallet tab for purchased/saved vouchers maps directly to EchoCity's Избранное tab — consider making it a hybrid of saved + activated deals.

---

## 6. Honey / PayPal Offers — Passive Discovery, Browser-Embedded

**Market:** Global (US-primary), browser extension + mobile app
**Model:** Automatic coupon application at checkout + cashback rewards
**Key insight:** Frictionless background operation, then surfaced rewards

### Core UX Philosophy

Honey's fundamental UX innovation is zero active engagement required. The user never has to search for deals — the extension/app finds and applies them automatically. This is the opposite of every other platform on this list.

### Mobile App Navigation

- **4-tab bottom nav:** Home, Savings, Deals, Account
- Home shows: savings found this month (large number, motivating), recent savings history
- "Deals" tab is a traditional deal browser (less used than the extension)
- The mobile app's primary value is the rewards/savings dashboard, not deal browsing

### Savings Dashboard UX

- **"You've saved $XXX total"** — the cumulative savings number is the hero element, always front-and-center
- Monthly savings breakdown by category (bar chart visualization)
- Gold bar progress — cashback points displayed as "X Gold bars = $Y"
- Dopamine-optimized: each new saving event triggers a gold particle animation

### Agentic Commerce (2025 Direction)

PayPal announced AI agent integration in late 2025: Honey now matches AI-recommended products with live merchant links, current pricing, and exclusive cashback. This transforms passive coupon-finding into proactive deal discovery. Integration with ChatGPT and other AI assistants is the next frontier.

### Key Takeaway for EchoCity

The cumulative savings dashboard ("You've saved X₽ total with EchoCity") is a powerful retention mechanism. Users who see their total savings are dramatically less likely to cancel subscriptions. EchoCity should calculate and display: "Your Plus subscription has saved you X₽ this month" on the subscription/profile screen. The psychological anchor of concrete savings numbers justifies the subscription cost visually.

---

## 7. Too Good To Go — The Best Mobile UX in the Food Deals Space

**Market:** Europe, North America (23+ countries)
**Model:** Surprise bag pickup reservations for unsold food at steep discount (€3-6 retail value = €12-18)
**Key insight:** Highest-rated UX in any deals category globally — studied by every major app design course

### Navigation Structure

- **4-tab bottom nav (the cleanest in the category):**
  - Discover (personalized, curated, "for you" logic)
  - Browse (all listings, map/list toggle)
  - My Bags (order history + active orders)
  - Profile
- 4 tabs is the optimal number — less decision paralysis than 5
- The map is accessible from Browse via a prominent toggle at the top — not a separate tab

### Deal Card Design (Surprise Bag Card)

TGTG's card design is widely cited as the best in the deals space:

- **Card structure:**
  1. Full-width restaurant/store photo with gentle gradient overlay at bottom
  2. Category icon (small, top-left corner of image)
  3. Pickup time window badge — "Pick up: 6:00 PM - 8:00 PM" (most prominent info after the image)
  4. Business name (bold, 16px)
  5. Distance (small, muted)
  6. Price: Large bold "€3.99" + "Value: ~€12" in smaller muted text
  7. Availability: "2 left" in amber/orange pill when low, green when available
- **No explicit discount %** — the value comparison (€3.99 vs ~€12) implies the deal without a badge
- Cards never feel cluttered — radical information restraint
- **Color system:**
  - Primary: Bright green `#3D9970` (brand, CTAs, success states)
  - Accent: Warm yellow `#F5C518` for ratings
  - Low availability: Amber `#F5A623`
  - Available: Green `#27AE60`
  - Background: Very light warm gray `#F7F7F2`, white cards
  - Typography: Rounded sans-serif (custom), warm and approachable, not corporate

### Onboarding Flow (Best-in-Class)

1. **Splash screen:** Animated illustration (no text, pure visual brand statement)
2. **Value proposition:** Single screen, "Save food, save money" — ONE message only
3. Location permission: Friendly illustration, "Let's find food near you" — immediate, no explanation overload
4. **No sign-up before browsing** — user sees nearby bags immediately after location grant
5. Sign-up is prompted only when trying to reserve — "Great taste! Create an account to save this bag"
6. Sign-up: Email or Apple/Google, single screen, minimal fields
7. No preference selection — algorithm infers from location and history

This deferred sign-up approach (browse first, register on action) reduces drop-off by ~40% vs. forced registration gates.

### Map / Browse Toggle

- Browse tab opens in list view by default
- Map toggle (top-right, icon only, no label) switches to map view
- Map pins are circular with the venue's photo inside (same pattern as Yelp)
- Tapping a pin: bottom card slides up with full deal info (not a new screen — stays on map)
- Map view maintains the same search/filter functionality as list view
- Filter bar: "Pickup time" (today/tomorrow), "Type" (restaurant/bakery/cafe/store/other), "Portions"

### Reservation / Pickup Flow

1. Tap card → Bag detail screen (full-screen, image hero at top)
2. Detail shows: Business description, pickup window, address, ratings, "What's in the bag" (always "Surprise!")
3. **One-tap reservation:** "Reserve Bag" button (full-width, green, bottom of screen) — no quantity selection, no customization
4. **Post-reservation screen:** Animated confirmation (bag with sparkles), pickup instructions, map to location
5. "My Bags" tab updates immediately with the active order card
6. Order card shows: pickup window countdown, "Show this screen at pickup"
7. At pickup: Staff confirms on their device; user sees card update to "Picked up" in real-time
8. If not picked up: "Pickup not confirmed" with a pop-up explanation (reduces confusion)
9. Post-pickup: Rating prompt (5-star + comment) surfaces immediately on My Bags tab

### Micro-Interactions

TGTG is cited by design educators specifically for these micro-interactions:
- **Page transitions:** Smooth slide (not jump) between tabs
- **Bag reservation confirmation:** Particle burst animation (not just a checkmark)
- **Pull-to-refresh:** Custom animated icon (earth with a leaf)
- **Empty state:** Illustrated empty bag with "Check back soon!" (no dead text screen)
- **Loading states:** Skeleton screens for cards (no spinners) — content layout is preserved
- **Heart/favorite:** Bounce animation on tap
- **Rating entry:** Star fill is animated left-to-right with a warm color transition

These micro-interactions are not cosmetic — they create what designers call "emotional design" — the user feels the app is alive and responsive.

### What Makes TGTG the Best

1. **Radical restraint** — every screen has one primary action. No cognitive overload.
2. **Deferred auth** — browse before sign-up eliminates the biggest conversion barrier
3. **Surprise mechanism** — the "surprise bag" removes the paradox of choice entirely
4. **Mission alignment** — "Save food, save money" creates emotional engagement beyond pure transaction
5. **Information hierarchy** — pickup time is more important than price on the card (time-sensitive > value)

---

## 8. ClassPass — Subscription-First, Credits as Currency

**Market:** Global (US, UK, EU, AU), 30,000+ venues in 28+ countries
**Model:** Monthly credit subscription — spend credits on fitness classes, wellness, beauty
**Key insight:** The most sophisticated subscription UI in the local services space

### Navigation Structure

- **5-tab bottom nav:** Explore, Schedule, Book, Activity, Account
- "Explore" is the discovery tab with categories: Fitness, Spa & Beauty, Golf
- "Schedule" shows upcoming bookings in calendar view — critical for the repeat-usage loop
- "Book" is a quick re-book from past favorites — frictionless re-engagement
- Credits balance is **always visible in the header** — persistent through all tabs

### Credit System UI (Critical Learning)

Credits are ClassPass's core UX innovation:

- **Credits balance chip** in the top-right of every screen — always visible
- Format: "42 credits" with a circular icon — exact balance, no hiding
- On each class card: "X credits" shown in a pill badge (like a price)
- When browsing, filter by credit range (slider: 0-6 credits, 0-10 credits, etc.)
- **The credit cost varies** by class popularity, time, and location — this is shown transparently
- "How much is this class?" is answered with BOTH credits AND dollar equivalent: "3 credits (~$15 value)"
- Monthly plan page shows: plan name, credit balance, renewal date, "Need more?" upsell

### Subscription Paywall Design

ClassPass's paywall is notable for showing value before asking for payment:
1. User must see 3-5 classes they want before the paywall appears
2. Paywall shows: "Start with 10 free credits" (trial) before any plan selection
3. Plan selection is horizontal scroll: 10 / 20 / 30 / 50 / 100 credits per month — not named tiers (Plus/Premium)
4. Each plan shows: credit count (large), monthly price, "Best for" description, a sample class it can afford
5. Annual plan toggle with "Save 15%" badge
6. "No commitment" and "Cancel anytime" are in EVERY paywall variant

### Map Integration

- Explore tab has a map/list toggle (same pattern as TGTG and Yelp)
- Map view with custom brand-color pins
- Tapping a studio pin: bottom sheet with studio photo, distance, class types, soonest available class
- "Book a class here" CTA on the bottom sheet — no need to go to full studio page for quick booking

### Schedule / Upcoming View

This is ClassPass's retention engine:
- Calendar view showing upcoming booked classes with studio name, time, location
- "Add to calendar" available for each booking
- **Late cancellation warning** shown prominently on upcoming class cards
- Class reminder notifications are opt-in but shown as a benefit (not a permission request)
- "You're on a streak!" gamification for consecutive weeks of activity

### Key Takeaway for EchoCity

The persistent credits balance chip in the header is directly applicable to EchoCity's subscription system. Instead of credits, EchoCity shows "Plus" / "Premium" badge + "X redemptions this month" or "X saved this month". The ClassPass approach of making subscription value tangible and continuously visible (not hidden in settings) dramatically reduces churn. The 3-tier credit plan (10/20/30 credits) model is worth considering for EchoCity Phase 2 if deal usage varies widely.

---

## Cross-Platform Patterns: The Universal Best Practices

### Bottom Navigation

| Platform | Tab Count | Primary Action Tab Position |
|---|---|---|
| Groupon | 5 | Browse (1st) |
| Yelp | 5 | Search (2nd, center) |
| The Entertainer | 4 | Offers (2nd) |
| Fave | 5 | FavePay (3rd, center) |
| TGTG | 4 | Browse (2nd) |
| ClassPass | 5 | Explore (1st) |
| **EchoCity (current)** | **5** | **Главная (1st)** |

**Recommendation:** EchoCity's 5-tab layout is correct. The order (Главная | Карта | Поиск | Избранное | Профиль) is good. Consider making the middle tab (Поиск) the most prominent — it should be center tab with the largest tap target.

### Deal Card Visual Hierarchy (Universal Order)

Every top platform follows this same order, with minor variations:
1. **Image** — full-width or dominant, 50-60% of card height
2. **Business name** — small/muted, establishes context
3. **Deal title** — bold, 2-line max
4. **Price block** — original struck through + deal price prominent
5. **Discount/savings badge** — top-right corner of image, pill shape
6. **Social proof** — ratings + sold count
7. **Distance + availability** — bottom of card, smallest text

Do not deviate from this order. Every platform that tested alternatives returned to this hierarchy.

### Urgency Patterns Ranked by Effectiveness

1. **Countdown timer + sold count** (Wowcher Deal of the Day) — highest conversion
2. **"X left" availability badge** (TGTG, Groupon) — creates scarcity
3. **"Ends in Xh" badge** (Groupon flash) — time urgency
4. **Animated countdown circle** (The Entertainer redemption) — at point of redemption

For EchoCity Flash deals: use all four simultaneously (countdown on card + "X activations left" + expiry timer).

### QR Redemption UX Comparison

| Platform | QR Type | TTL | Fallback | Security |
|---|---|---|---|---|
| Groupon | Static code | None (permanent) | Printed voucher | Low |
| The Entertainer | Animated QR | 30-60s | None | High |
| Fave (FavePay) | Rotating QR | 60s | None | High |
| TGTG | Static booking ref | Session | Show screen | Medium |
| **EchoCity (designed)** | **Live QR** | **60s** | **6-char code** | **Highest** |

EchoCity's redemption model (live QR + 6-char shortcode + auto-refresh at 30s) is technically superior to every competitor. The UX challenge is making the countdown feel comfortable, not stressful. The Entertainer's animated countdown circle is the right solution — use an animated progress ring around the QR code, not a text timer.

### Paywall / Subscription Conversion Patterns

Best practices derived from all platforms:
1. **Show value before asking for payment** — TGTG and ClassPass both do this (browse/explore first)
2. **Make savings tangible** — "Your subscription saved you X₽ this month" (Honey / ClassPass)
3. **Free trial framing** — "7 days free" beats "Try for 199₽" even at same price point
4. **Keep subscription status always visible** — The Entertainer and ClassPass both show plan badge/expiry in the header/profile
5. **Annual toggle with savings %** — ClassPass "Save 15%" toggle is high-converting
6. **"No commitment" / "Cancel anytime"** — must be visible on every paywall screen (ClassPass standard)

### Onboarding Drop-off Reduction

Ranked best to worst for reducing drop-off:
1. **Browse before sign-up** (TGTG) — ~40% fewer drop-offs
2. **Location permission before sign-up** (TGTG, Fave) — personalizes the immediate experience
3. **Social login options** (all platforms) — Apple/Google reduces friction
4. **No preference questionnaire** (TGTG) — infer from behavior, don't ask up front
5. **Immediate value on screen after sign-up** — first screen after auth must show personalized deals

---

## EchoCity Design Recommendations

Based on this competitive analysis, here are the highest-priority UX improvements to implement:

### 1. Deal Card (Highest Priority)

Follow the universal hierarchy:
- Full-bleed image (55% card height)
- Discount badge: top-right corner of image, pill shape, high-contrast color (use `#FF3B30` for % discount or `#34C759` for free deals)
- Deal title: 2 lines max, bold
- Price block: original struck through in gray + deal price in brand color, large and bold
- "X people used today" social proof — always shown if > 0
- Distance badge: bottom-left overlay on image
- For Flash deals: add countdown pill to the discount badge (replaces static %)
- For Members Only: lock icon + "Plus" badge replaces the discount badge on locked cards (blurred card background)

### 2. QR Redemption Screen

Replace any static code display with:
- Large QR code (centered, 60% of screen width)
- **Animated progress ring** around the QR (shrinks to zero as 60s timer counts down)
- 6-character shortcode below the QR in large monospace font
- "Refresh" auto-happens at 30s — show a brief pulse animation when QR regenerates
- Green background/header during active state
- Confirmation state: full-screen green with checkmark particle burst (TGTG-style)

### 3. Home Screen Structure

Follow Groupon's category pill + TGTG's restraint:
- City selector (top-left, compact, tappable)
- Search bar (full-width, prominent)
- Category pills (horizontal scroll, 8 categories with icons)
- "Рядом сейчас" section (3-4 cards, horizontal scroll)
- Flash deals section with countdown (if any active) — this is urgent inventory, show it early
- "Бесплатные предложения" section
- "Для подписчиков" section (blurred/locked cards with paywall nudge for free users)
- "Популярные места" section

### 4. Subscription Visibility

- Show subscription badge (Free/Plus/Premium chip) in the header next to the city selector
- On profile screen: "Your Plus plan has saved you X₽ this month" — calculate real savings
- Paywall screen must show: free trial CTA + "Cancel anytime" + concrete savings example
- Annual toggle with "Save 20%" visible on paywall

### 5. Onboarding

Apply TGTG's deferred auth:
- Show location permission request immediately on first launch (before sign-up)
- Display the deals feed for the user's location
- Prompt sign-up only when user tries to activate a deal
- Sign-up: Phone (SMS OTP) or email, single screen, no preferences questionnaire

### 6. Map Tab (Карта)

Apply Yelp + TGTG map patterns:
- Default to map view with deal pins (circular, color-coded by category)
- Bottom sheet slides up on pin tap (not a new screen)
- List/Map toggle at the top of the tab
- Filter chips below the toggle: category, price range, distance
- "Открыто сейчас" toggle filter (always visible)

### 7. Savings Dashboard

Add to Профиль tab:
- "Всего сэкономлено: X₽" — cumulative savings since account creation
- "В этом месяце: X₽" — current month
- Visual bar chart of savings by category
- "Всего активаций: X" — total redemptions
- This data retains subscribers and creates engagement without notifications

---

## Summary Table

| Platform | Navigation | Card Standout | Redemption | Subscription UI | Key Steal |
|---|---|---|---|---|---|
| Groupon | 5-tab bottom | Atomic variants, urgency badges | Static code (weak) | None | Anti-banner-blindness card variants |
| Yelp | 5-tab, search-center | Business-first, map pins | N/A | N/A | Split map-list view, photo pins |
| The Entertainer | 4-tab | 2-for-1 badge system | Animated countdown circle QR | Annual gate, days remaining | Animated QR countdown ring |
| Fave | 5-tab, pay-center | Cashback hero, trust badges | Rotating QR 60s | None explicit | "X people bought" + savings dashboard |
| Wowcher | 5-tab | Full-width cards, "Buy Now" on card | Voucher wallet tab | None | Deal of the Day countdown + sold count |
| Honey/PayPal | 4-tab | Savings dashboard hero | N/A (online only) | Passive rewards | Cumulative savings as retention hook |
| Too Good To Go | 4-tab | Radical restraint, pickup time hero | Booking confirmation screen | None | Deferred auth, skeleton loading, micro-interactions |
| ClassPass | 5-tab | Credits on every card | N/A | Persistent balance chip | Credits/savings always visible in header |
