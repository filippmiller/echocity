# Visual Audit Report -- EchoCity (GdeSejchas)

**Date:** 2026-04-08
**Method:** Source code analysis (curl to localhost:3010 timed out due to Next.js compilation; audit performed via direct reading of page.tsx, layout.tsx, and component files)
**Pages Audited:** 22

---

## Page 1: / (Homepage)

### A. First Impression
The homepage opens with a gradient hero section (brand-600 to blue-800) featuring a background image (`/images/hero-bg.jpg`) with 25% opacity overlay. A pulsing green dot badge shows "Sankt-Peterburg" and active offer count. The main heading "Skidki ryadom s vami" is bold and prominent. Below the hero: a "Deal of the Day" section, category chips, a 3-step "Kak eto rabotaet" explainer, near-you offers, stories bar, personalized feed, collections, seasonal collections, flash deals, bundles, free deals, members-only deals with a blurred upsell card, a demand CTA banner, business/subscription CTAs, and a full Footer.

### B. Meaning & Philosophy
Purpose is immediately clear: find discounts nearby, activate via QR, save money. The 3-step explainer ("Najdite skidku", "Pokazhite QR", "Poluchite skidku") is effective. Multiple CTAs point users to offers, subscription, and business registration. The page communicates a marketplace for local discounts in St. Petersburg.

### C. UI/UX Quality
- Well-structured Tailwind classes with consistent spacing (py-6, px-4, max-w-5xl)
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Horizontal scroll sections with `overflow-x-auto hide-scrollbar`
- Good use of gradient backgrounds to differentiate sections
- Category chips are compact pills with emojis
- The blurred members-only upsell card is a clever desire-gap pattern
- No obvious accessibility issues in structure (alt tags present, semantic sections used)

### D. Functional Behavior
- Hero search bar is a Link to `/offers` (not an actual input -- appropriate for homepage)
- All category links use proper `href` attributes
- "Smotret zavedeniya" CTA links to `/offers`
- Stats section conditionally renders (placeCount >= 20 shows stats, otherwise "Novye skidki kazhdyj den'")
- All sections conditionally render based on data availability (flashOffers.length > 0, etc.)
- `SavingsCounter`, `NearYouSection`, `ForYouSection` are client components with their own data fetching
- `export const dynamic = 'force-dynamic'` ensures fresh data on each request

### E. Improvement Extraction
- The page is very long with many sections. On mobile, users may never scroll past the first few sections. Consider lazy-loading lower sections or reducing the number of displayed sections.
- No skeleton/loading state for the server-rendered page (it's SSR, so the whole page renders at once, but initial load could be slow with 10+ parallel DB queries)
- The SavingsCounter in the hero adds vertical space; consider whether it's necessary on first visit

### Specific Verifications
- **Manrope font class**: PASS -- `Manrope` imported from `next/font/google` with `variable: '--font-manrope'`, applied as `manrope.variable` on `<html>` tag. Tailwind config sets `fontFamily.sans` to `var(--font-manrope)`
- **Hero background image**: PASS -- `<img src="/images/hero-bg.jpg">` with `absolute inset-0` positioning, `opacity-25 mix-blend-soft-light`
- **"Kak eto rabotaet" section**: PASS -- Present at lines 261-288 with 3-step grid (Najdite, Pokazhite QR, Poluchite skidku)
- **Category cards (only 5)**: PASS -- CATEGORIES array has exactly 5 items: Kofe, Eda, Bary, Krasota, Uslugi
- **Trust stats / "Novye skidki kazhdyj den'"**: PASS -- Conditional: shows stats when placeCount >= 20, otherwise shows "Novye skidki kazhdyj den'" fallback
- **Footer with legal links**: PASS -- Footer component includes /privacy and /terms links
- **OG meta tags**: PASS -- `og:url: 'https://echocity.vsedomatut.com'` in root layout metadata

---

## Page 2: /offers

### A. First Impression
A rich offer discovery page with a gradient header ("Skidki" heading), a StreakWidget, and a sticky multi-row filter bar. Filters include: city selector, visibility chips (Vse, Ryadom, Besplatnye, Plus, Sejchas), category pills with live counts (10 categories), and a metro station filter with dropdown. Below: NearbyOffers, RecentlyViewed, HomeStoriesBar, WhatsHot, ForYouOffers, and collapsible sections for TopRatedOffers, FeaturedCollections, and TrendingDemands. The main OfferFeed loads at the bottom. Footer is included.

### B. Meaning & Philosophy
This is the main catalog page. The multi-layer filtering (city + visibility + category + metro + activeNow) allows precise discovery. The page communicates: "here are all the deals, filter to find what you need."

### C. UI/UX Quality
- Sticky filter bar at `top-14 z-30` with shadow -- stays accessible while scrolling
- Filter chips use proper active/inactive states with color coding (brand, green, blue)
- Category pills show live counts fetched from API
- PullToRefresh wraps the entire feed for mobile
- CompareBar floats for offer comparison
- Metro dropdown is well-contained with max-height and overflow scroll

### D. Functional Behavior
- City selector fetches available cities from `/api/public/cities`
- Category counts fetched from `/api/offers/counts`
- PullToRefresh increments `refreshKey` to re-mount OfferFeed
- URL search params sync with state (city, visibility, category, activeNow, metro)
- CollapsibleSection wraps secondary content with expand/collapse
- useCompare hook manages compare state

### E. Improvement Extraction
- The sticky filter bar has 3 rows of controls -- on small screens this could consume significant vertical space. Consider collapsing metro filter behind a "More filters" toggle
- 10 category chips plus metro creates a dense UI
- No clear "reset all filters" button

### Specific Verifications
- **No orphaned "Svernut'" buttons**: PASS -- CollapsibleSection only shows the collapse button when `isOpen && hasContent` is true. When content is empty, neither expand nor collapse button renders. The "Svernut'" text uses `ChevronUp` and only appears contextually.
- **CollapsibleSection behavior**: PASS -- Uses localStorage to remember state. MutationObserver detects if children render content. If no content, the section hides entirely (no orphaned toggle).

---

## Page 3: /search

### A. First Impression
A clean search page with a sticky search bar (input with magnifying glass icon, clear button, and "Najti" submit button). Before searching: popular query chips and recent searches. After searching: results split into "Skidki" (offers) and "Zavedeniya" (places) sections with result count. Empty state shows a centered message with icon.

### B. Meaning & Philosophy
Unified search across both offers and places. The popular queries (Kofe, Burgery, Manikyur, etc.) serve as quick entry points. Recent searches provide convenience for returning users.

### C. UI/UX Quality
- Input auto-focuses on mount (`inputRef.current?.focus()`)
- Loading state uses skeleton placeholders
- Search results use proper link elements for navigation
- Offer results show benefit badges (e.g., "-20%") with colored backgrounds
- Place results show type badges and ratings
- Back arrow is mobile-only (`md:hidden`)
- Min height 44px touch targets on all interactive elements

### D. Functional Behavior
- Search triggered on Enter key or button click
- Recent searches stored in localStorage (max 7)
- Popular queries strip emoji prefix before searching
- API call to `/api/search` with query parameter
- Error handling with toast notifications
- Clear button resets query but doesn't clear results

### E. Improvement Extraction
- No debounced live search / autocomplete as user types
- Popular queries are hardcoded; could be dynamic based on trending searches
- No pagination for results

---

## Page 4: /map

### A. First Impression
A full-screen map view (height: `calc(100vh - 56px)`) with a loading spinner during initial fetch. Once loaded, a YandexMap component fills the viewport. Mobile gets a bottom sheet (MapBottomSheet) with place list. Desktop gets a sidebar panel on the left (w-80) and a selected-place info card at the bottom.

### B. Meaning & Philosophy
Geographic discovery of places. The map-first approach prioritizes spatial awareness for users who want to find nearby venues.

### C. UI/UX Quality
- Responsive design: bottom sheet for mobile, sidebar for desktop
- Desktop sidebar has max-height with overflow-y-auto
- Selected place highlight uses brand colors
- Loading state is centered with branded spinner
- Place cards in sidebar show name and address

### D. Functional Behavior
- Places fetched from `/api/places` on mount
- `handlePlaceClick` selects a place and opens bottom sheet
- Desktop shows selected place info with link to `/places/{id}`
- Map click handler is a no-op (could pan/zoom)

### E. Improvement Extraction
- No filtering on the map (by category, by offer type)
- No user location marker / "center on me" button
- Desktop selected-place card overlaps with sidebar at bottom-left area

### Specific Verifications
- **Fallback message "Karta vremenno nedostupna"**: PASS -- YandexMap component has `loadError` state. When true, renders message "Karta vremenno nedostupna". Triggers on: no API key, script load error, or 8-second timeout.

---

## Page 5: /auth/login

### A. First Impression
Centered login form on a gradient background (brand-50 to white). The auth layout provides a branded header with back arrow, "GdeSejchas" logo centered, and a minimal footer. The form has tabs for Phone and Email login, with a Yandex OAuth option.

### B. Meaning & Philosophy
Clear purpose: sign in to access discounts. The dual-tab approach (Phone OTP vs Email/Password) accommodates Russian user preferences. Yandex SSO provides a third option.

### C. UI/UX Quality
- Tab UI uses segmented control pattern (`grid-cols-2` with bg-gray-100)
- All buttons have min-h-[48px] for accessibility
- Phone input auto-formats as user types (+7 XXX XXX XX XX)
- OTP input is centered with wide letter-spacing
- Resend cooldown shows countdown timer
- Loading states on all buttons with spinner animation
- Password visibility toggle via PasswordInput component
- Focus rings on inputs (ring-2 ring-brand-500)

### D. Functional Behavior
- Phone OTP flow: enter phone -> send OTP -> enter 4-digit code -> verify
- Email flow: standard email + password form submission
- Redirect logic: CITIZEN -> /map, BUSINESS_OWNER -> /business/places, ADMIN -> /admin
- Supports `?redirect=` query parameter
- 60-second cooldown between OTP resends
- Error handling with toast notifications

### E. Improvement Extraction
- No "Forgot password" link for email login
- Phone format forces +7 prefix (Russia-only)
- No password requirements shown on login page (appropriate for login)

---

## Page 6: /auth/register

### A. First Impression
Registration form with the same auth layout. Tabs for Phone (quick, passwordless) and Email (full form). Email tab shows account type toggle (User/Business). The phone tab includes an informational banner explaining the passwordless flow.

### B. Meaning & Philosophy
Efficient registration with phone-first approach. The explanatory banner for phone registration reduces friction. Business users are redirected to a dedicated wizard.

### C. UI/UX Quality
- Same polished tab UI as login page
- Phone tab: minimal fields, explanatory banner, same OTP flow
- Email tab: comprehensive form with name, phone, city, language
- Required field markers (red asterisks)
- Password strength validation via `getPasswordStrengthError`
- Confirm password with mismatch error shown inline
- Business account type shows CTA to dedicated `/business/register` wizard
- Language selector with ru/en toggle

### D. Functional Behavior
- Phone OTP creates account automatically on verification
- Email registration sends full payload including optional fields
- Password strength validated on change, not just on submit
- Account type toggle affects which fields are shown
- Same redirect logic as login

### E. Improvement Extraction
- City field is a free-text input; should be a dropdown of available cities
- No terms/privacy checkbox on registration form
- Business registration via email tab is just a redirect message -- could be confusing

---

## Page 7: /subscription

### A. First Impression
A premium subscription page with a purple gradient header (Crown icon, "Vyberte svoj plan"). Below: 3-column plan comparison grid (Free, Plus, Premium) with feature matrix. Current subscription status shown for logged-in users. FAQ section at bottom. Footer included.

### B. Meaning & Philosophy
Clear tiered value proposition. The feature matrix (8 features) lets users compare plans at a glance. The "Popular" badge on Plus plan guides decision-making. Trial period prominently shown.

### C. UI/UX Quality
- Plan cards use visual hierarchy: Plus gets brand ring + scale-[1.02], Premium gets gradient background
- Feature matrix uses Check/X icons with opacity for disabled features
- Success/error messages have dismiss buttons
- SatisfactionGuarantee component builds trust
- SubscriptionSavingsCard shows ROI for subscribers
- Loading skeleton matches card layout
- YuKassa payment integration with redirect flow

### D. Functional Behavior
- Plans fetched from `/api/subscriptions/plans`
- Status polled after payment redirect (`?status=success`)
- Subscribe triggers trial or YuKassa payment
- Plan switching supported for existing subscribers
- Cancel button for active subscribers
- Guest users see "Login to subscribe" CTA

### E. Improvement Extraction
- No annual pricing option (only monthly shown)
- FAQ is static; could be interactive accordions for space savings
- No visual indicator of how much user would save per month with subscription

---

## Page 8: /for-businesses

### A. First Impression
A comprehensive landing page for business owners. Dark hero section (gray-900) with ROI calculator showing 300 clients/month for 15,000 RUB. Live platform stats (places, offers, redemptions). 3-step onboarding, QR demo section, 5 offer templates, 6 benefit cards, FAQ with expandable details, and a bold blue final CTA.

### B. Meaning & Philosophy
Strong business value proposition: "Get clients for free, pay only for results (50 RUB/client)." The ROI calculator and real stats from the database build credibility. Offer templates reduce friction for onboarding.

### C. UI/UX Quality
- Professional dark hero with good contrast
- Stats section uses real database counts (not fake numbers)
- Steps use colored icon containers with shadow
- QR demo section shows the scanning flow visually
- Offer templates use color-coded cards with examples
- FAQ uses `<details>` elements for native expand/collapse
- Final CTA has shadow effect for emphasis
- Responsive grid breakpoints throughout

### D. Functional Behavior
- Server-side rendered (`export const dynamic = 'force-dynamic'`) with real stats
- Multiple CTAs all point to `/business/register`
- FAQ uses native HTML `<details>` (no JS needed for expand/collapse)
- Anchor link `#how-it-works` for smooth scrolling

### E. Improvement Extraction
- No testimonials or case studies from existing businesses
- ROI calculator is static; could be interactive (let user input their average check)
- No "contact us" form for businesses with questions
- Missing Footer component

---

## Page 9: /for-users

### A. First Impression
A user-facing landing page with brand gradient hero, 3-step how-it-works, 4 feature cards (nearby deals, missions, flash deals, mystery bags), and a subscription CTA. Clean and focused.

### B. Meaning & Philosophy
Communicates the user value: find discounts nearby, activate via QR, earn rewards. The feature cards highlight gamification elements (missions, mystery bags) that differentiate from simple coupon apps.

### C. UI/UX Quality
- Clean gradient hero with two CTA buttons (register + browse)
- Feature cards use consistent structure: emoji + title + description
- Cards have shadow-sm and rounded-2xl
- Subscription CTA has a secondary note about pricing and cancellation
- Good spacing and typography hierarchy

### D. Functional Behavior
- All links use proper Next.js Link components
- Server-rendered with metadata export
- Two primary CTAs: register and browse offers
- Subscription CTA links to /subscription

### E. Improvement Extraction
- Missing Footer component (unlike most other pages)
- No social proof (user count, savings total)
- No FAQ section
- Page is relatively sparse compared to /for-businesses

### Specific Verifications
- **Russian content**: PASS -- All content is in Russian
- **"GdeSejchas" brand**: PASS -- Used in metadata title "Dlya pol'zovatelej -- GdeSejchas", hero text, and throughout copy

---

## Page 10: /privacy

### A. First Impression
Clean legal page with max-w-3xl centered content. White background, proper heading hierarchy (h1 for title, h2 for sections). Date stamp shown. 8 sections covering data policy. Footer included.

### B. Meaning & Philosophy
Standard privacy policy with Russian legal references (Federal Law 152-FZ). Covers: data collected, purposes, protection measures, third-party sharing, user rights, cookies, and contact info.

### C. UI/UX Quality
- Uses Tailwind `prose prose-sm prose-gray` for readable text formatting
- Sections use unordered lists for scannable content
- Appropriate spacing between sections
- Contact email provided (info@gdesejchas.ru)

### D. Functional Behavior
- Server-rendered with metadata export
- Footer component included
- No interactive elements (appropriate for legal page)

### E. Improvement Extraction
- No table of contents for quick navigation
- No "last updated" auto-generation
- Could add accordion expand/collapse for sections on mobile

### Specific Verifications
- **Russian legal content**: PASS -- Full Russian text referencing Federal Law 152-FZ "O personal'nyh dannyh"

---

## Page 11: /terms

### A. First Impression
Same clean legal layout as /privacy. 9 sections covering: general provisions, service description, registration, discount usage, subscription, prohibited actions, liability, changes, and contacts. Footer included.

### B. Meaning & Philosophy
Standard terms of service covering platform rules, user obligations, and disclaimers. Written in clear, accessible Russian.

### C. UI/UX Quality
- Same `prose` styling as privacy page
- Consistent with privacy page design
- Good section headings for navigation

### D. Functional Behavior
- Server-rendered with metadata
- Footer included
- Static content, no interactive elements

### E. Improvement Extraction
- Same improvements as /privacy (TOC, accordion)
- No version history or changelog
- "2024-2026" in auth footer but terms show April 2026 date

### Specific Verifications
- **Russian legal content**: PASS -- Full Russian terms text

---

## Page 12: /dashboard

### A. First Impression
This page is a redirect hub. It has no visual content -- it reads the user session and redirects based on role.

### B. Meaning & Philosophy
Smart routing: CITIZEN -> /profile, BUSINESS_OWNER -> /business/dashboard, ADMIN -> /admin. Unauthenticated users -> /auth/login.

### C. UI/UX Quality
N/A -- no rendered content.

### D. Functional Behavior
- Server-side `getSession()` check
- Three role-based redirects
- Default for citizens: /profile (not a separate dashboard)

### E. Improvement Extraction
- Citizens get redirected to /profile rather than having a dedicated dashboard. Could consider a user dashboard that aggregates recent activity, nearby offers, and savings.

---

## Page 13: /favorites

### A. First Impression
Tabbed favorites page with "Skidki" and "Mesta" tabs. Header shows heart icon and title. Guests see a login prompt with branded icon. Authenticated users see a grid of saved offer cards (2 columns) or saved place cards (list). Each item has a hover-to-reveal remove button.

### B. Meaning & Philosophy
Personal collection of saved items. The dual-tab approach separates offers from places. Empty states guide users to browse and discover.

### C. UI/UX Quality
- Segmented tab control with count badges
- Loading skeletons match card layouts
- Empty states have icon, message, description, and CTA button
- Remove buttons use opacity animation on hover
- Offer cards reuse the global OfferCard component
- Place cards show type labels, address, and business name
- Guest state has clear login + register CTAs

### D. Functional Behavior
- Favorites fetched from `/api/favorites?entityType=TYPE`
- Optimistic removal with rollback on error
- Both tabs loaded in parallel on mount
- Remove via DELETE `/api/favorites/{type}/{id}`

### E. Improvement Extraction
- Remove buttons are hover-only (not accessible on touch devices -- need tap/long-press alternative)
- No sorting or filtering within favorites
- No empty-to-full animation when removing last item

---

## Page 14: /profile

### A. First Impression
A profile hub page with: avatar + name header with subscription badge, savings banner, stats row (redemptions, favorites, days), savings tracker, menu sections (history, favorites, subscription, family, reservations, referral, missions, leaderboard, roulette, settings, logout). Background is gray-50 with white cards.

### B. Meaning & Philosophy
Central user hub. The savings banner reinforces the value proposition. Menu links provide access to all user features. Referral section encourages growth.

### C. UI/UX Quality
- Clean card-based layout with proper spacing
- Avatar with initials fallback
- Stats row uses consistent StatCard components
- Menu links use ChevronRight for navigation affordance
- Dividers use inset (ml-12) for visual grouping
- Referral code with copy button and success feedback
- Logout styled with danger variant (red)
- Proper bottom padding (pb-24) for mobile nav bar

### D. Functional Behavior
- Stats and referral data fetched from API
- 401 handling redirects to auth prompt
- Logout calls POST /api/auth/logout
- Referral code copy uses clipboard API with toast feedback
- Loading state shows centered spinner

### E. Improvement Extraction
- No pull-to-refresh for profile data
- The menu list is very long (11 items) -- could benefit from grouping or icons
- No badge indicators for unread notifications or pending actions

---

## Page 15: /settings

### A. First Impression
Settings page with: savings counter, subscription savings card, referral card, avatar upload section, profile form (name, phone, city, language, radius), notification settings, and photo gallery. White cards on gray background.

### B. Meaning & Philosophy
Comprehensive profile management. Covers personal info, preferences, photos, and notifications in one page.

### C. UI/UX Quality
- Avatar upload with preview and file type restrictions
- Form inputs use consistent styling
- Language selector as dropdown
- Notification settings delegated to component
- Photo gallery with hover actions (set as avatar, delete)
- Upload buttons have loading states
- Disabled states during uploads

### D. Functional Behavior
- Profile fetched from `/api/profile`
- Form submission via PUT `/api/profile`
- Avatar upload via POST `/api/profile/avatar` with FormData
- Photo upload/delete/set-avatar via corresponding API endpoints
- Photo deletion requires confirm dialog
- All actions show toast notifications

### E. Improvement Extraction
- Form doesn't show which fields were changed
- No cancel/revert button
- Mixing upload functionality, settings form, referral card, and savings on one page -- consider splitting
- Avatar upload button uses cursor-pointer class redundantly (already a button)

---

## Page 16: /wallet

### A. First Impression
EchoCoins wallet page with: gold gradient balance card (showing coin count and ruble equivalent), "How to earn" section with 4 methods, and transaction history. Centered, narrow layout (max-w-lg).

### B. Meaning & Philosophy
Virtual currency system. 1 coin = 1 ruble. Earned through redemptions (3% cashback), referrals, streaks, and manual adjustments. Can be used for subscription payment.

### C. UI/UX Quality
- Gold gradient card is visually distinct for financial content
- Earn methods use colored icon containers with clear descriptions
- Transaction history shows directional icons (up for earn, down for spend)
- Color coding: green for earnings, red for spending
- Pagination via cursor-based "Show more" button
- Empty state guides users to first action
- Loading skeletons in transaction list

### D. Functional Behavior
- Balance fetched from `/api/coins`
- History fetched from `/api/coins/history` with cursor pagination
- Parallel initial fetch for balance and history
- Load more appends to existing transactions

### E. Improvement Extraction
- No "Spend coins" CTA or explanation of where to use them (only mentions subscription)
- No date grouping in transaction history
- No running balance per transaction

---

## Page 17: /missions

### A. First Impression
Gamification page with: sticky header with back arrow to /profile, XP progress bar (level, XP count, progress to next level), tabs for Active/Completed missions, mission cards with emoji icons and progress bars, and badges grid at bottom.

### B. Meaning & Philosophy
Engagement through gamification. Missions give users XP rewards for specific actions. Badges reward achievements. The XP bar with level system creates progression.

### C. UI/UX Quality
- XP bar uses brand gradient with gold progress indicator
- Mission cards show emoji, title, XP reward, description, and progress bar
- Completed missions use green styling with completion date
- Active missions show progress percentage
- Tabs include item counts
- Empty states have contextual emoji and message
- BadgesGrid component handles badge display

### D. Functional Behavior
- Profile and missions fetched in parallel from API
- Tab switching is client-side (no re-fetch)
- Progress formatting handles special cases (BIG_SAVER shows currency)
- Back navigation to /profile

### E. Improvement Extraction
- No push notification when mission completes
- No celebration animation when completing a mission
- Badge section could show locked/upcoming badges for motivation

---

## Page 18: /admin

### A. First Impression
Admin dashboard with: 4 hero stat cards (users, subscribers, redemptions today, monthly revenue), weekly growth section with 4 comparison cards, engagement section with 3 cards, demand + quality row, quick access links (4 cards), and recent redemptions table.

### B. Meaning & Philosophy
Comprehensive platform overview for admin. Covers: user growth, revenue, engagement, quality metrics, and operational quick links.

### C. UI/UX Quality
- Stat cards use colored borders and icon containers
- Growth badges show percentage change with trend icons
- Quick access cards have hover effects with color transitions
- Recent redemptions in a clean table with time-ago formatting
- Loading skeletons match card layouts
- Error state shows centered message
- Proper responsive grid breakpoints (1/2/4 columns)

### D. Functional Behavior
- All data from single `/api/admin/analytics` endpoint
- Formatters for rubles (kopecks -> rubles) and numbers (locale formatting)
- Time ago function for recent activity
- Quick links to moderation, cities, franchises, fraud monitoring

### E. Improvement Extraction
- No auto-refresh for real-time data
- No date range selector for metrics
- Charts/graphs would improve data visualization
- No comparison to previous month for revenue

---

## Page 19: /admin/offers

### A. First Impression
Offer moderation page showing pending offers in a list. Each offer shows: title, type, benefit, branch info, merchant, creator, and creation date. Action buttons for approve/reject.

### B. Meaning & Philosophy
Moderation workflow: review pending offers, approve or reject with reason. Clean admin tooling.

### C. UI/UX Quality
- Clean list layout with action buttons
- Reject requires reason input (modal pattern)
- Loading states on action buttons
- Uses brand-consistent styling
- Proper auth check (user.role === 'ADMIN')

### D. Functional Behavior
- Fetches pending offers from `/api/admin/offers?status=PENDING`
- Approve via POST `/api/admin/offers/{id}/approve`
- Reject via POST with reason
- List refreshes after each action
- Toast notifications for success/error

### E. Improvement Extraction
- No bulk actions (approve all, reject all)
- No offer preview before approval
- No history of approved/rejected offers on this page

---

## Page 20: /admin/users

### A. First Impression
User management page with search, pagination, and expandable user details. Table/list shows: email, name, role, city, status, creation date, and action counts (redemptions, complaints, demands).

### B. Meaning & Philosophy
User administration: search, review, and manage user accounts. Expandable details show subscriptions, redemptions, and complaints.

### C. UI/UX Quality
- Search input with icon
- Pagination with prev/next and page number display
- Expandable rows with chevron indicators
- User detail sections for profile, subscriptions, redemptions, complaints
- Ban/unban toggle buttons

### D. Functional Behavior
- Users fetched with search and pagination parameters
- Expand shows detailed user data from `/api/admin/users/{id}`
- Role and status management
- Proper auth gating

### E. Improvement Extraction
- No export/CSV download
- No filter by role, status, or date range
- Subscription data could show plan details inline

---

## Page 21: /admin/complaints

### A. First Impression
Complaints management page with filters (status, priority, type), sortable list, expandable complaint details with admin notes, and status update actions.

### B. Meaning & Philosophy
Quality management: review, prioritize, and resolve user complaints. Priority system (Urgent/High/Medium/Low) with color coding.

### C. UI/UX Quality
- Filter row with dropdowns for status, priority, and type
- Priority badges use semantic colors (red/orange/yellow/gray)
- Status labels translated to Russian
- Type labels mapped from English codes to Russian descriptions
- Expandable cards with admin note input
- Status update buttons

### D. Functional Behavior
- Complaints fetched from `/api/complaints`
- Filtering by status, priority, type
- Sorting by date or priority
- Status update with admin notes
- Expandable detail view

### E. Improvement Extraction
- No pagination (loads all complaints at once)
- No assignment to specific admin
- No notification when complaint is updated
- No link to the related offer or place from complaint detail

---

## Summary of Cross-Cutting Verifications

### Footer with legal links on all pages
| Page | Footer Present | Legal Links |
|------|---------------|-------------|
| / | PASS | PASS (/privacy, /terms) |
| /offers | PASS | PASS |
| /search | FAIL (no Footer) | N/A |
| /map | FAIL (no Footer, full-screen map) | N/A |
| /auth/login | PASS (auth layout footer) | FAIL (no /privacy, /terms links in auth footer) |
| /auth/register | PASS (auth layout footer) | FAIL (no /privacy, /terms links) |
| /subscription | PASS | PASS |
| /for-businesses | FAIL (no Footer imported) | N/A |
| /for-users | FAIL (no Footer imported) | N/A |
| /privacy | PASS | PASS |
| /terms | PASS | PASS |
| /favorites | FAIL (no Footer) | N/A |
| /profile | FAIL (no Footer) | N/A |
| /settings | FAIL (no Footer) | N/A |
| /wallet | FAIL (no Footer) | N/A |
| /missions | FAIL (no Footer) | N/A |
| /admin/* | N/A (admin pages) | N/A |

**Footer visibility on mobile**: PASS -- The Footer uses `pb-24 md:pb-10` padding to account for mobile bottom nav bar. The footer grid uses `grid-cols-2 md:grid-cols-4`, meaning it's always visible (not hidden behind `md:block`). Legal links in the footer bottom section use `flex-col md:flex-row` so they're visible on all screen sizes.

### OG Meta Tags
- **og:url**: PASS -- Set to `https://echocity.vsedomatut.com` in root layout
- **og:title**: PASS -- "GdeSejchas -- skidki ryadom s vami"
- **og:description**: PASS -- Present
- **og:locale**: PASS -- `ru_RU`
- **og:type**: PASS -- `website`

### Manrope Font
- **Import**: PASS -- `Manrope` from `next/font/google`
- **Subsets**: PASS -- `cyrillic, latin`
- **CSS Variable**: PASS -- `--font-manrope` applied to `<html>`
- **Tailwind config**: PASS -- `fontFamily.sans` set to `var(--font-manrope)`

---

## Priority Issues Found

1. **Missing Footer on 8 pages**: /search, /map, /for-businesses, /for-users, /favorites, /profile, /settings, /wallet, /missions lack the Footer component with legal links
2. **Auth layout footer missing legal links**: /auth/login and /auth/register have a minimal footer that only shows copyright, not /privacy and /terms links
3. **No "Forgot password" on login page**: Email login has no password recovery option
4. **No terms/privacy acceptance on registration**: Users register without explicit agreement to terms
5. **City field is free text on registration**: Should be a dropdown matching available cities
6. **Remove buttons on /favorites are hover-only**: Not accessible on touch devices
7. **/for-users and /for-businesses are missing Footer**: Important landing pages without legal footer
