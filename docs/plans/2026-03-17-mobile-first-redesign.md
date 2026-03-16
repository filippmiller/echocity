# Mobile-First Frontend Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform CityEcho from a desktop-first app into a world-class mobile-first deals platform, inspired by the best patterns from Groupon, Too Good To Go, The Entertainer, Yelp, 2GIS, Fave, Wowcher, and ClassPass.

**Architecture:** Mobile-first responsive redesign using the existing Next.js 15 + Tailwind stack. Add `framer-motion` for animations, `vaul` for bottom sheets, and `sonner` for toasts. New shared layout system with bottom navigation for mobile, top nav for desktop. All existing functionality preserved — this is a UI/UX overhaul, not a feature rewrite.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 3.4, framer-motion, vaul (bottom sheets), sonner (toasts), lucide-react (icons)

**Key Design Decisions (from competitor research):**
- Bottom nav with 5 tabs: Home, Deals, Map, Saved, Profile (Kuponator + every top app)
- Draggable bottom sheet over map (Airbnb + Yelp + 2GIS pattern)
- Urgency + scarcity indicators on deal cards (Groupon + Wowcher)
- Animated QR progress ring on redemption (The Entertainer)
- Deferred auth — browse before sign-up (Too Good To Go)
- Skeleton loading everywhere (Too Good To Go)
- Toast notifications replacing all alert() calls
- Persistent subscription badge (ClassPass)
- Celebration animation on redemption (confetti/particle burst)

---

## Phase 1: Foundation (Layout, Navigation, Dependencies)

### Task 1: Install New Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install animation and UI libraries**

Run:
```bash
cd C:\dev\echocity
npm install framer-motion vaul sonner
```

Expected: All three packages install successfully. No peer dependency conflicts (all support React 19).

**Step 2: Verify installation**

Run:
```bash
cd C:\dev\echocity && npm ls framer-motion vaul sonner
```

Expected: All three listed with versions.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion, vaul, sonner for mobile-first redesign"
```

---

### Task 2: Design Token System in Tailwind Config

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Step 1: Update Tailwind config with design tokens**

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        deal: {
          discount: '#EF4444',    // Red — discount badges
          savings: '#16A34A',     // Green — "you saved X"
          urgent: '#D97706',      // Amber — countdown timers
          premium: '#7C3AED',     // Purple — Plus/exclusive
          flash: '#E11D48',       // Rose — flash deals
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6',
        },
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'nav-height': '56px',
        'header-height': '56px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'confetti': 'confetti 0.8s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Update globals.css for mobile-first base styles**

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --foreground: 0 0% 3.9%;
    --background: 0 0% 100%;
    --muted: 0 0% 96.1%;
    --border: 0 0% 89.8%;
  }

  html {
    -webkit-tap-highlight-color: transparent;
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    @apply bg-white text-gray-900 antialiased;
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Prevent overscroll bounce on iOS */
  body {
    overscroll-behavior-y: none;
  }

  /* Minimum touch target size */
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }

  /* Exception for inline text links and small badges */
  a.inline-link,
  .badge,
  .chip {
    min-height: auto;
    min-width: auto;
  }
}

@layer components {
  /* Skeleton shimmer effect */
  .skeleton {
    @apply relative overflow-hidden bg-gray-200 rounded-lg;
  }
  .skeleton::after {
    content: '';
    @apply absolute inset-0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 2s infinite;
  }

  /* Bottom safe area spacer */
  .pb-safe {
    padding-bottom: calc(56px + env(safe-area-inset-bottom));
  }

  /* Hide scrollbar for horizontal scroll areas */
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
}
```

**Step 3: Verify the build compiles**

Run:
```bash
cd C:\dev\echocity && npm run build 2>&1 | head -20
```

Expected: Build starts without Tailwind config errors.

**Step 4: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat: add design token system and mobile-first base styles"
```

---

### Task 3: Create Toast Provider

**Files:**
- Create: `components/ui/Toaster.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create the Toaster wrapper component**

Create `components/ui/Toaster.tsx`:

```tsx
'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={72}
      toastOptions={{
        className: 'text-sm font-medium',
        duration: 3500,
        style: {
          borderRadius: '12px',
        },
      }}
    />
  )
}
```

Note: `offset={72}` ensures toasts appear above the 56px bottom nav + safe area.

**Step 2: Add Toaster to root layout**

In `app/layout.tsx`, add the Toaster import and render it inside `<body>`:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "ГдеСейчас — скидки рядом с вами",
  description: "Находите лучшие скидки в кафе, ресторанах и салонах вашего города. Активируйте через QR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**IMPORTANT:** Notice that `<Navbar />` is removed from the root layout. Navigation will now be part of the new mobile layout system (Task 4). This is intentional — different page groups need different navigation (consumer gets bottom nav, business gets sidebar, admin gets their own layout).

**Step 3: Verify build**

Run:
```bash
cd C:\dev\echocity && npm run build 2>&1 | head -20
```

Expected: Build compiles. Pages may look broken (no navbar) — that's expected, we fix it in Task 4.

**Step 4: Commit**

```bash
git add components/ui/Toaster.tsx app/layout.tsx
git commit -m "feat: add sonner toast system, remove Navbar from root layout"
```

---

### Task 4: Create Mobile Bottom Navigation + App Shell Layout

This is the most important task. We create a new layout system that gives consumer pages a mobile-first bottom navigation bar with a compact top header.

**Files:**
- Create: `components/layout/MobileNav.tsx`
- Create: `components/layout/AppHeader.tsx`
- Create: `components/layout/AppShell.tsx`
- Create: `app/(consumer)/layout.tsx`
- Move existing consumer pages under `app/(consumer)/` route group

**Step 1: Create the bottom navigation bar**

Create `components/layout/MobileNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Tag, MapPin, Heart, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Главная' },
  { href: '/offers', icon: Tag, label: 'Скидки' },
  { href: '/map', icon: MapPin, label: 'Карта' },
  { href: '/favorites', icon: Heart, label: 'Избранное' },
  { href: '/profile', icon: User, label: 'Профиль' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive
                  ? 'text-brand-600'
                  : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 2: Create the compact mobile header**

Create `components/layout/AppHeader.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-client'
import { Search, Bell } from 'lucide-react'

export function AppHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-gray-900 shrink-0">
          ГдеСейчас
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/offers" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            Скидки
          </Link>
          <Link href="/map" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            Карта
          </Link>
          <Link href="/search" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            Поиск
          </Link>
          <Link href="/favorites" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50">
            Избранное
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search icon — mobile only */}
          <Link
            href="/search"
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Auth state */}
          {user ? (
            <Link
              href={
                user.role === 'BUSINESS_OWNER' ? '/business/dashboard'
                : user.role === 'ADMIN' ? '/admin'
                : '/profile'
              }
              className="flex items-center gap-2"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                  {user.email[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="hidden md:inline-flex px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
```

**Step 3: Create the App Shell that combines header + bottom nav**

Create `components/layout/AppShell.tsx`:

```tsx
'use client'

import { AppHeader } from './AppHeader'
import { MobileNav } from './MobileNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <AppHeader />
      <main className="pb-safe md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
```

**Step 4: Create the consumer route group layout**

Create `app/(consumer)/layout.tsx`:

```tsx
import { AppShell } from '@/components/layout/AppShell'

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
```

**Step 5: Move consumer pages into the (consumer) route group**

Move the following pages/directories into `app/(consumer)/`:
- `app/page.tsx` → `app/(consumer)/page.tsx`
- `app/offers/` → `app/(consumer)/offers/`
- `app/search/` → `app/(consumer)/search/`
- `app/map/` → `app/(consumer)/map/`
- `app/favorites/` → `app/(consumer)/favorites/`
- `app/subscription/` → `app/(consumer)/subscription/`
- `app/settings/` → `app/(consumer)/settings/`
- `app/places/` → `app/(consumer)/places/`
- `app/dashboard/` → `app/(consumer)/dashboard/`

Create a profile redirect page:
- Create: `app/(consumer)/profile/page.tsx`

```tsx
import { redirect } from 'next/navigation'

export default function ProfilePage() {
  redirect('/settings')
}
```

**IMPORTANT:** Route groups `(consumer)` don't affect the URL — `/offers` still works as `/offers`. The parentheses just group layouts.

The `app/auth/`, `app/business/`, and `app/admin/` routes should NOT be moved — they'll get their own layouts later.

For business and admin pages, create temporary layouts that include the old Navbar:

Create `app/business/layout.tsx`:
```tsx
import { Navbar } from '@/components/Navbar'

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
```

Create `app/admin/layout.tsx`:
```tsx
import { Navbar } from '@/components/Navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
```

Create `app/auth/layout.tsx`:
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
```

**Step 6: Verify build and test navigation**

Run:
```bash
cd C:\dev\echocity && npm run build
```

Expected: Build succeeds. Consumer pages now have bottom nav on mobile, header on top, no more old Navbar. Business/admin pages still have the old Navbar.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: mobile-first app shell with bottom navigation bar

- 5-tab bottom nav: Home, Deals, Map, Saved, Profile
- Compact sticky header with logo + search + avatar
- Consumer pages use new AppShell layout via (consumer) route group
- Business/admin pages retain legacy Navbar temporarily
- Safe area support for iPhone notch/home indicator
- Desktop: bottom nav hidden, full top nav visible"
```

---

## Phase 2: Core Components (Cards, Skeletons, Urgency)

### Task 5: Create Skeleton Components

**Files:**
- Create: `components/ui/Skeleton.tsx`
- Create: `components/ui/OfferCardSkeleton.tsx`

**Step 1: Create base Skeleton primitive**

Create `components/ui/Skeleton.tsx`:

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}
```

**Step 2: Create OfferCard skeleton that matches the real card geometry**

Create `components/ui/OfferCardSkeleton.tsx`:

```tsx
import { Skeleton } from './Skeleton'

export function OfferCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Image area */}
      <Skeleton className="aspect-[16/10] w-full" />
      {/* Content area */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add components/ui/Skeleton.tsx components/ui/OfferCardSkeleton.tsx
git commit -m "feat: add skeleton loading components for perceived performance"
```

---

### Task 6: Redesign OfferCard with Urgency + Scarcity Signals

**Files:**
- Modify: `components/OfferCard.tsx`
- Modify: `components/OfferFeed.tsx`

**Step 1: Redesign OfferCard**

Replace `components/OfferCard.tsx` with the new mobile-optimized version:

```tsx
'use client'

import Link from 'next/link'
import { Clock, Users, Flame } from 'lucide-react'

interface OfferCardProps {
  id: string
  title: string
  subtitle?: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl?: string | null
  branchName: string
  branchAddress: string
  distance?: number
  // New urgency props
  expiresAt?: string | null
  redemptionCount?: number
  maxRedemptions?: number | null
  isFlash?: boolean
}

function getBenefitBadge(benefitType: string, benefitValue: number) {
  switch (benefitType) {
    case 'PERCENT': return `-${benefitValue}%`
    case 'FIXED_AMOUNT': return `-${benefitValue / 100}\u20BD`
    case 'FIXED_PRICE': return `${benefitValue / 100}\u20BD`
    case 'FREE_ITEM': return 'Бесплатно'
    case 'BUNDLE': return 'Комплект'
    default: return `${benefitValue}`
  }
}

function getTimeLeft(expiresAt: string): string | null {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 24) return null // Don't show if > 24h
  if (hours > 0) return `${hours}ч ${minutes}м`
  return `${minutes}м`
}

export function OfferCard({
  id, title, subtitle, benefitType, benefitValue, visibility,
  imageUrl, branchName, branchAddress, distance,
  expiresAt, redemptionCount, maxRedemptions, isFlash,
}: OfferCardProps) {
  const badge = getBenefitBadge(benefitType, benefitValue)
  const isMembersOnly = visibility === 'MEMBERS_ONLY'
  const timeLeft = expiresAt ? getTimeLeft(expiresAt) : null
  const utilizationPercent = maxRedemptions && redemptionCount
    ? Math.round((redemptionCount / maxRedemptions) * 100)
    : 0
  const isAlmostGone = utilizationPercent >= 80

  return (
    <Link href={`/offers/${id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-[16/10] bg-gray-100">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-4xl text-gray-300">%</span>
            </div>
          )}

          {/* Discount badge — top left */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-sm font-bold text-white ${
            isFlash ? 'bg-deal-flash' : 'bg-deal-discount'
          }`}>
            {isFlash && <Flame className="inline w-3.5 h-3.5 mr-0.5 -mt-0.5" />}
            {badge}
          </div>

          {/* Plus badge — top right */}
          {isMembersOnly && (
            <div className="absolute top-2 right-2 bg-deal-premium text-white px-2 py-0.5 rounded text-xs font-semibold">
              Plus
            </div>
          )}

          {/* Urgency bar — bottom of image */}
          {(timeLeft || isAlmostGone) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 flex items-center gap-2">
              {timeLeft && (
                <span className="flex items-center gap-1 text-xs font-medium text-deal-urgent">
                  <Clock className="w-3 h-3" />
                  {timeLeft}
                </span>
              )}
              {isAlmostGone && maxRedemptions && redemptionCount !== undefined && (
                <span className="flex items-center gap-1 text-xs font-medium text-white">
                  Осталось {maxRedemptions - (redemptionCount || 0)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-600">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{subtitle}</p>
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="truncate max-w-[60%]">{branchName}</span>
            {distance !== undefined && (
              <span className="shrink-0 font-medium text-gray-600">
                {distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`}
              </span>
            )}
          </div>

          {/* Social proof */}
          {redemptionCount !== undefined && redemptionCount > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              <span>{redemptionCount} использовали</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
```

**Step 2: Update OfferFeed to use proper skeletons and pass new props**

Replace `components/OfferFeed.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { OfferCard } from './OfferCard'
import { OfferCardSkeleton } from './ui/OfferCardSkeleton'

interface OfferData {
  id: string
  title: string
  subtitle: string | null
  offerType: string
  visibility: string
  benefitType: string
  benefitValue: number
  imageUrl: string | null
  branch: { title: string; address: string; city: string }
  merchant: { name: string }
  expiresAt?: string | null
  redemptionCount?: number
  maxRedemptions?: number | null
  isFlash?: boolean
}

export function OfferFeed({ city, visibility }: { city?: string; visibility?: string }) {
  const [offers, setOffers] = useState<OfferData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (visibility) params.set('visibility', visibility)

    fetch(`/api/offers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [city, visibility])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-400">%</span>
        </div>
        <p className="text-gray-500 font-medium">Нет активных предложений</p>
        <p className="text-sm text-gray-400 mt-1">Попробуйте изменить фильтры</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {offers.map((offer) => (
        <OfferCard
          key={offer.id}
          id={offer.id}
          title={offer.title}
          subtitle={offer.subtitle}
          offerType={offer.offerType}
          visibility={offer.visibility}
          benefitType={offer.benefitType}
          benefitValue={Number(offer.benefitValue)}
          imageUrl={offer.imageUrl}
          branchName={offer.branch.title}
          branchAddress={offer.branch.address}
          expiresAt={offer.expiresAt}
          redemptionCount={offer.redemptionCount}
          maxRedemptions={offer.maxRedemptions}
          isFlash={offer.isFlash}
        />
      ))}
    </div>
  )
}
```

**Step 3: Verify build**

Run: `cd C:\dev\echocity && npm run build`

**Step 4: Commit**

```bash
git add components/OfferCard.tsx components/OfferFeed.tsx
git commit -m "feat: redesign OfferCard with urgency signals, social proof, and skeleton loading

- Countdown timer for offers expiring within 24h
- 'Almost gone' indicator when >80% utilized
- Social proof: 'X people used this'
- Flash deal badge with flame icon
- Aspect-ratio based image (16:10) instead of fixed height
- Active press scale animation for touch feedback
- Proper empty state with illustration"
```

---

### Task 7: Redesign Home Page (Mobile-First)

**Files:**
- Modify: `app/(consumer)/page.tsx` (moved from `app/page.tsx`)

**Step 1: Rewrite the home page**

Replace with a mobile-first design featuring:
- Compact hero with search CTA
- Horizontally scrollable category chips with color-coded icons (Biglion pattern)
- "Near you" section with offer cards
- Subscription CTA (ClassPass pattern)
- For business CTA

```tsx
import Link from 'next/link'
import { Search, Coffee, UtensilsCrossed, Wine, Scissors, Sparkles, ShoppingBag, Dumbbell, Car } from 'lucide-react'

const CATEGORIES = [
  { name: 'Кофейни', slug: 'coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { name: 'Еда', slug: 'food', icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-700' },
  { name: 'Бары', slug: 'bars', icon: Wine, color: 'bg-purple-100 text-purple-700' },
  { name: 'Красота', slug: 'beauty', icon: Scissors, color: 'bg-pink-100 text-pink-700' },
  { name: 'SPA', slug: 'spa', icon: Sparkles, color: 'bg-teal-100 text-teal-700' },
  { name: 'Шоппинг', slug: 'shopping', icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
  { name: 'Фитнес', slug: 'fitness', icon: Dumbbell, color: 'bg-green-100 text-green-700' },
  { name: 'Авто', slug: 'auto', icon: Car, color: 'bg-slate-100 text-slate-700' },
]

export default function Home() {
  return (
    <div>
      {/* Hero — compact on mobile */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-700 text-white px-4 pt-6 pb-8 md:pt-12 md:pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">
            Скидки рядом с вами
          </h1>
          <p className="text-sm md:text-lg text-blue-100 mb-5 md:mb-8 max-w-md">
            Лучшие предложения кафе, ресторанов и салонов. Активируйте через QR.
          </p>

          {/* Search bar — tappable on mobile, redirects to /search */}
          <Link
            href="/search"
            className="flex items-center gap-3 w-full max-w-lg bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-white/70 hover:bg-white/20 transition-colors"
          >
            <Search className="w-5 h-5 shrink-0" />
            <span className="text-sm">Поиск заведений и скидок...</span>
          </Link>
        </div>
      </section>

      {/* Categories — horizontal scroll */}
      <section className="px-4 -mt-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.slug}
                  href={`/search?category=${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{cat.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick links — mobile grid */}
      <section className="px-4 pt-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Популярные скидки</h2>
            <Link href="/offers" className="text-sm font-medium text-brand-600">
              Все →
            </Link>
          </div>
          {/* OfferFeed will be rendered client-side here — see Task 8 */}
          <div className="text-sm text-gray-500">
            {/* Placeholder — will be replaced with OfferFeed */}
          </div>
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-deal-premium to-purple-800 rounded-2xl p-5 md:p-8 text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Подписка Plus</h2>
            <p className="text-sm text-purple-200 mb-4 max-w-md">
              Эксклюзивные скидки до 50% в лучших заведениях. Первые 7 дней бесплатно. Отмена в любой момент.
            </p>
            <Link
              href="/subscription"
              className="inline-block px-5 py-2.5 bg-white text-deal-premium font-semibold text-sm rounded-xl hover:bg-purple-50 transition-colors"
            >
              Попробовать бесплатно
            </Link>
          </div>
        </div>
      </section>

      {/* For Business CTA */}
      <section className="px-4 py-6 mb-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-2xl p-5 md:p-8 text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Для бизнеса</h2>
            <p className="text-sm text-gray-400 mb-4 max-w-md">
              Привлекайте клиентов через акции. Отслеживайте результаты в реальном времени.
            </p>
            <Link
              href="/business/register"
              className="inline-block px-5 py-2.5 bg-white text-gray-900 font-semibold text-sm rounded-xl hover:bg-gray-100 transition-colors"
            >
              Подключить заведение
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `cd C:\dev\echocity && npm run build`

**Step 3: Commit**

```bash
git add app/(consumer)/page.tsx
git commit -m "feat: mobile-first home page with category chips, compact hero, CTA cards"
```

---

### Task 8: Add Home Page Offer Feed (Client Component)

**Files:**
- Create: `components/HomeFeed.tsx`
- Modify: `app/(consumer)/page.tsx` — add the HomeFeed component

**Step 1: Create a lightweight home feed component**

Create `components/HomeFeed.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { OfferCard } from './OfferCard'
import { OfferCardSkeleton } from './ui/OfferCardSkeleton'
import Link from 'next/link'

export function HomeFeed() {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/offers?limit=6')
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">
        Пока нет активных предложений
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {offers.slice(0, 6).map((offer: any) => (
          <OfferCard
            key={offer.id}
            id={offer.id}
            title={offer.title}
            subtitle={offer.subtitle}
            offerType={offer.offerType}
            visibility={offer.visibility}
            benefitType={offer.benefitType}
            benefitValue={Number(offer.benefitValue)}
            imageUrl={offer.imageUrl}
            branchName={offer.branch?.title || ''}
            branchAddress={offer.branch?.address || ''}
            redemptionCount={offer.redemptionCount}
          />
        ))}
      </div>
      {offers.length > 6 && (
        <div className="text-center mt-4">
          <Link
            href="/offers"
            className="inline-block px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
          >
            Показать все скидки
          </Link>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Import HomeFeed into the home page**

In `app/(consumer)/page.tsx`, replace the placeholder comment inside the "Популярные скидки" section with:

```tsx
// At the top of the file, add:
import { HomeFeed } from '@/components/HomeFeed'

// Replace the placeholder div with:
<HomeFeed />
```

The home page will remain a Server Component with the HomeFeed as a Client Component island.

**Step 3: Commit**

```bash
git add components/HomeFeed.tsx app/(consumer)/page.tsx
git commit -m "feat: add HomeFeed component with skeleton loading to home page"
```

---

### Task 9: Redesign Offers Page with Sticky Chip Filters

**Files:**
- Modify: `app/(consumer)/offers/page.tsx`

**Step 1: Rewrite the offers page with sticky filters**

```tsx
'use client'

import { useState } from 'react'
import { OfferFeed } from '@/components/OfferFeed'
import { SlidersHorizontal } from 'lucide-react'

const CITIES = ['Санкт-Петербург', 'Москва']

const FILTER_CHIPS = [
  { key: 'all', label: 'Все' },
  { key: 'FREE_FOR_ALL', label: 'Бесплатные' },
  { key: 'MEMBERS_ONLY', label: 'Plus' },
]

export default function OffersPage() {
  const [city, setCity] = useState('Санкт-Петербург')
  const [section, setSection] = useState('all')

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* City selector */}
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 shrink-0"
            >
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Filter chips — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setSection(chip.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    section === chip.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <OfferFeed city={city} visibility={section === 'all' ? undefined : section} />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/(consumer)/offers/page.tsx
git commit -m "feat: redesign offers page with sticky chip filters"
```

---

## Phase 3: Map Redesign with Bottom Sheet

### Task 10: Map Page with Draggable Bottom Sheet

**Files:**
- Modify: `app/(consumer)/map/page.tsx`
- Create: `components/MapBottomSheet.tsx`

**Step 1: Create the bottom sheet wrapper for map place list**

Create `components/MapBottomSheet.tsx`:

```tsx
'use client'

import { Drawer } from 'vaul'
import Link from 'next/link'
import { MapPin, Star } from 'lucide-react'

interface Place {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  addressLine1?: string | null
  placeType?: string | null
  averageRating?: number | null
}

export function MapBottomSheet({
  places,
  selectedPlace,
  onPlaceSelect,
  open,
  onOpenChange,
}: {
  places: Place[]
  selectedPlace: Place | null
  onPlaceSelect: (place: Place) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
      snapPoints={[0.25, 0.5, 1]}
      defaultSnap={0.25}
    >
      <Drawer.Portal>
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-40 flex flex-col bg-white rounded-t-2xl md:hidden"
          style={{ maxHeight: '85vh' }}
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-gray-300 my-3" />

          {/* Selected place detail */}
          {selectedPlace && (
            <div className="px-4 pb-3 border-b border-gray-100">
              <Link href={`/places/${selectedPlace.id}`} className="block">
                <h3 className="font-semibold text-gray-900">{selectedPlace.name}</h3>
                {selectedPlace.addressLine1 && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedPlace.addressLine1}
                  </p>
                )}
                {selectedPlace.placeType && (
                  <span className="inline-block mt-1.5 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                    {selectedPlace.placeType}
                  </span>
                )}
              </Link>
            </div>
          )}

          {/* Place list */}
          <div className="flex-1 overflow-y-auto px-4 py-2" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
            <p className="text-xs text-gray-400 mb-2">{places.length} мест на карте</p>
            <div className="space-y-2">
              {places.map((place) => (
                <button
                  key={place.id}
                  onClick={() => onPlaceSelect(place)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    selectedPlace?.id === place.id
                      ? 'bg-brand-50 border border-brand-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <h4 className="font-medium text-sm text-gray-900">{place.name}</h4>
                  {place.addressLine1 && (
                    <p className="text-xs text-gray-500 mt-0.5">{place.addressLine1}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

**Step 2: Rewrite the map page**

Replace `app/(consumer)/map/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import YandexMap from '@/components/YandexMap'
import { MapBottomSheet } from '@/components/MapBottomSheet'
import { toast } from 'sonner'

interface Place {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  addressLine1?: string | null
  placeType?: string | null
}

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [sheetOpen, setSheetOpen] = useState(true)

  useEffect(() => {
    fetch('/api/places')
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('Не удалось загрузить места')
        setLoading(false)
      })
  }, [])

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place)
    setSheetOpen(true)
  }

  return (
    <div className="relative h-[calc(100vh-56px)] md:h-[calc(100vh-56px)]">
      {/* Full-screen map */}
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Загрузка карты...</p>
          </div>
        </div>
      ) : (
        <YandexMap
          places={places}
          onPlaceClick={handlePlaceClick}
          onMapClick={() => {}}
          height="100%"
        />
      )}

      {/* Bottom sheet with place list — mobile only */}
      <MapBottomSheet
        places={places}
        selectedPlace={selectedPlace}
        onPlaceSelect={handlePlaceClick}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block absolute top-4 left-4 w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-xl shadow-lg">
        <div className="p-4">
          <h2 className="font-bold text-gray-900 mb-3">Места ({places.length})</h2>
          <div className="space-y-2">
            {places.map((place) => (
              <button
                key={place.id}
                onClick={() => handlePlaceClick(place)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedPlace?.id === place.id
                    ? 'bg-brand-50 border border-brand-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <h4 className="font-medium text-sm">{place.name}</h4>
                {place.addressLine1 && (
                  <p className="text-xs text-gray-500 mt-0.5">{place.addressLine1}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Verify build**

Run: `cd C:\dev\echocity && npm run build`

**Step 4: Commit**

```bash
git add components/MapBottomSheet.tsx app/(consumer)/map/page.tsx
git commit -m "feat: full-screen map with draggable bottom sheet (Airbnb pattern)

- Map fills entire viewport below header
- Mobile: draggable bottom sheet with 3 snap points (25%, 50%, 100%)
- Desktop: sidebar panel for place list
- Selected place highlighted in both sheet and map
- Toast notifications replace alert() calls
- Loading spinner while map initializes"
```

---

## Phase 4: QR Redemption Celebration

### Task 11: Animated QR Redemption Screen

**Files:**
- Modify: `components/QRRedeemScreen.tsx`

**Step 1: Redesign with progress ring and celebration animation**

Replace `components/QRRedeemScreen.tsx`:

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { CheckCircle2, RefreshCw } from 'lucide-react'

interface QRRedeemScreenProps {
  offerId: string
  offerTitle?: string
}

interface SessionData {
  id: string
  sessionToken: string
  shortCode: string
  expiresAt: string
}

export function QRRedeemScreen({ offerId, offerTitle }: QRRedeemScreenProps) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redeemed, setRedeemed] = useState(false)

  const createSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/redemptions/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || data.error || 'Ошибка')
        setSession(null)
        return
      }
      setSession(data.session)
      setSecondsLeft(60)

      const url = await QRCode.toDataURL(data.session.sessionToken, {
        width: 280,
        margin: 2,
        color: { dark: '#1D4ED8', light: '#FFFFFF' },
      })
      setQrDataUrl(url)
    } catch {
      setError('Не удалось создать сессию')
    } finally {
      setLoading(false)
    }
  }, [offerId])

  useEffect(() => {
    createSession()
  }, [createSession])

  // Countdown timer
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [session])

  // Auto-refresh at 30s
  useEffect(() => {
    if (secondsLeft === 30) {
      createSession()
    }
  }, [secondsLeft, createSession])

  // Progress ring calculation
  const progress = secondsLeft / 60
  const circumference = 2 * Math.PI * 130 // radius = 130
  const strokeDashoffset = circumference * (1 - progress)

  if (redeemed) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <CheckCircle2 className="w-24 h-24 text-deal-savings" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-900 mt-4"
        >
          Использовано!
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 mt-2"
        >
          {offerTitle || 'Скидка активирована'}
        </motion.p>
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={createSession}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Попробовать снова
        </button>
      </div>
    )
  }

  if (loading && !session) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 mt-3">Создание QR-кода...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-sm text-gray-500 font-medium">Покажите QR-код кассиру</p>

      {/* QR Code with progress ring */}
      <div className="relative">
        {/* SVG progress ring */}
        <svg className="w-72 h-72" viewBox="0 0 280 280">
          {/* Background ring */}
          <circle
            cx="140" cy="140" r="130"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <circle
            cx="140" cy="140" r="130"
            fill="none"
            stroke={secondsLeft <= 10 ? '#EF4444' : '#2563EB'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 140 140)"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* QR code centered inside the ring */}
        <AnimatePresence mode="wait">
          {qrDataUrl && (
            <motion.div
              key={session?.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-52 h-52 rounded-xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Short code */}
      {session && (
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">или введите код</p>
          <p className="text-3xl font-mono font-bold tracking-widest text-gray-900">
            {session.shortCode}
          </p>
        </div>
      )}

      {/* Timer */}
      <div className={`text-sm font-semibold ${secondsLeft <= 10 ? 'text-deal-discount' : 'text-gray-500'}`}>
        {secondsLeft > 0 ? `${secondsLeft}с` : 'Истёк'}
      </div>

      {/* Refresh button when expired */}
      {secondsLeft === 0 && (
        <button
          onClick={createSession}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить QR
        </button>
      )}
    </div>
  )
}
```

**Step 2: Verify build**

Run: `cd C:\dev\echocity && npm run build`

**Step 3: Commit**

```bash
git add components/QRRedeemScreen.tsx
git commit -m "feat: animated QR redemption with progress ring and celebration

- SVG progress ring around QR code (The Entertainer pattern)
- Ring color changes to red when < 10 seconds remain
- Smooth QR code transition animation on refresh
- Celebration screen with spring-physics checkmark animation
- Brand-colored QR code (blue instead of black)"
```

---

## Phase 5: Search Redesign

### Task 12: Full-Screen Mobile Search Overlay

**Files:**
- Modify: `app/(consumer)/search/page.tsx`

**Step 1: Rewrite search page as mobile-first**

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Star, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Place {
  id: string
  name: string
  address: string
  city: string
  placeType: string
  averageRating?: number | null
  reviewCount?: number
  services?: Array<{ name: string; price?: string | number }>
}

const RECENT_SEARCHES_KEY = 'echocity_recent_searches'

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(query: string) {
  const searches = getRecentSearches().filter((s) => s !== query)
  searches.unshift(query)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 7)))
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRecentSearches(getRecentSearches())
    // Auto-focus search input
    inputRef.current?.focus()
  }, [])

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setLoading(true)
    setHasSearched(true)
    addRecentSearch(q.trim())
    setRecentSearches(getRecentSearches())

    try {
      const params = new URLSearchParams({ q: q.trim() })
      const response = await fetch(`/api/public/search?${params}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)
      setPlaces(data.places || [])
    } catch (err: any) {
      toast.error(err.message || 'Ошибка при поиске')
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Search header */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="md:hidden p-1 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Кафе, парикмахерская, химчистка..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white border border-transparent focus:border-brand-200"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 shrink-0"
          >
            Найти
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Recent searches — shown before first search */}
        {!hasSearched && recentSearches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Недавние</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s)
                    handleSearch(s)
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-gray-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <>
            {places.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Ничего не найдено</p>
                <p className="text-sm text-gray-400 mt-1">Попробуйте изменить запрос</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">{places.length} результатов</p>
                {places.map((place) => (
                  <Link
                    key={place.id}
                    href={`/places/${place.id}`}
                    className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 active:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">{place.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {place.city}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                        {place.placeType}
                      </span>
                      {place.averageRating != null && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {place.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {place.services && place.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {place.services.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/(consumer)/search/page.tsx
git commit -m "feat: mobile-first search with recent searches, skeleton loading, and empty states"
```

---

## Phase 6: Final Polish

### Task 13: Replace All alert() Calls with Toast

**Files:**
- Search for and replace all `alert(` calls across the codebase

**Step 1: Find all alert() usages**

Run:
```bash
cd C:\dev\echocity && grep -rn "alert(" app/ components/ --include="*.tsx" --include="*.ts"
```

**Step 2: Replace each alert() with toast**

For each file containing `alert()`:
1. Add `import { toast } from 'sonner'` at the top
2. Replace `alert('error message')` with `toast.error('error message')`
3. Replace `alert('success message')` with `toast.success('success message')`

**Step 3: Verify build**

Run: `cd C:\dev\echocity && npm run build`

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: replace all alert() calls with sonner toasts"
```

---

### Task 14: Verify Full Build and Manual Testing Checklist

**Step 1: Run full build**

```bash
cd C:\dev\echocity && npm run build
```

Expected: Clean build with zero errors.

**Step 2: Start dev server**

```bash
cd C:\dev\echocity && npm run dev
```

Expected: Server starts on port 3010.

**Step 3: Manual testing checklist**

Test each of these in Chrome DevTools mobile emulator (iPhone 14 Pro):

- [ ] Home page loads with compact hero, category chips scroll horizontally
- [ ] Bottom nav shows 5 tabs, highlights the active tab
- [ ] Tapping "Скидки" tab navigates to offers page with sticky filters
- [ ] Filter chips work: Все, Бесплатные, Plus
- [ ] OfferCards show with skeleton loading, then real content
- [ ] Map page shows full-screen map with draggable bottom sheet
- [ ] Bottom sheet has 3 snap points (25%, 50%, 100%)
- [ ] Tapping a place in the sheet highlights it
- [ ] Search page has auto-focused input, recent searches display
- [ ] Searching shows skeleton loading, then results
- [ ] Empty search shows custom empty state
- [ ] Toast notifications appear (not alert dialogs)
- [ ] QR redemption screen shows progress ring around QR code
- [ ] Bottom nav is hidden on desktop, top nav is shown instead
- [ ] All pages have safe bottom padding (no content hidden behind bottom nav)

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete mobile-first frontend redesign

- 5-tab bottom navigation (Home, Deals, Map, Saved, Profile)
- Compact sticky header with search and avatar
- Redesigned OfferCard with urgency/scarcity signals
- Full-screen map with draggable bottom sheet
- Animated QR redemption with progress ring
- Skeleton loading throughout
- Sonner toast notifications
- Mobile-first responsive design
- Color-coded category system
- Recent searches with localStorage
- Custom empty states
- Safe area support for modern phones"
```

---

## Summary of All New/Modified Files

### New Files
| File | Purpose |
|------|---------|
| `components/ui/Toaster.tsx` | Sonner toast provider |
| `components/ui/Skeleton.tsx` | Base skeleton component |
| `components/ui/OfferCardSkeleton.tsx` | Card-shaped skeleton |
| `components/layout/MobileNav.tsx` | Bottom navigation bar |
| `components/layout/AppHeader.tsx` | Compact sticky header |
| `components/layout/AppShell.tsx` | Layout wrapper |
| `components/MapBottomSheet.tsx` | Draggable sheet over map |
| `components/HomeFeed.tsx` | Home page offer feed |
| `app/(consumer)/layout.tsx` | Consumer route layout |
| `app/(consumer)/profile/page.tsx` | Profile redirect |
| `app/business/layout.tsx` | Temporary business layout |
| `app/admin/layout.tsx` | Temporary admin layout |
| `app/auth/layout.tsx` | Auth layout |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Added framer-motion, vaul, sonner |
| `tailwind.config.ts` | Design tokens, animations, colors |
| `app/globals.css` | Mobile-first base styles, skeleton utility |
| `app/layout.tsx` | Removed Navbar, added Toaster + viewport meta |
| `components/OfferCard.tsx` | Complete redesign with urgency signals |
| `components/OfferFeed.tsx` | Proper skeletons, new card props |
| `components/QRRedeemScreen.tsx` | Progress ring + celebration animation |
| `app/(consumer)/page.tsx` | Mobile-first home page |
| `app/(consumer)/offers/page.tsx` | Sticky chip filters |
| `app/(consumer)/map/page.tsx` | Full-screen map + bottom sheet |
| `app/(consumer)/search/page.tsx` | Recent searches + mobile overlay |

### Moved Files (same content, new location)
All consumer pages moved from `app/` to `app/(consumer)/` route group.
