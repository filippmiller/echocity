# Technical Documentation - ГдеСейчас (EchoCity)

## Project Overview

**ГдеСейчас** (EchoCity) is a voice-activated search engine for local businesses. The platform allows users to find places, services, and leave reviews, while businesses can manage their locations and service catalogs.

**Tech Stack:**
- Next.js 15 (App Router) + TypeScript
- TailwindCSS for styling
- Prisma ORM with Supabase PostgreSQL
- Custom email/password authentication
- bcrypt for password hashing
- Zod for validation

**Development Port:** `3010` (http://localhost:3010)

---

## Database Structure

### Database Provider
- **Supabase PostgreSQL** (production database)
- Connection string stored in `.env` as `DATABASE_URL`
- All migrations applied via `prisma migrate deploy`

### Models Overview

#### Core User Models

**User**
- Primary user accounts with authentication
- Fields: `id`, `email`, `passwordHash`, `role`, `firstName`, `lastName`, `phone`, `city`, `language`, `isActive`
- Roles: `ADMIN`, `CITIZEN`, `BUSINESS_OWNER`
- Relations: `profile`, `businesses`, `reviews`, `ownedFranchises`, `franchiseMemberships`

**UserProfile**
- Extended user profile information
- Fields: `fullName`, `phone`, `homeCity`, `preferredLanguage`, `timezone`, `preferredRadius`, notification settings
- One-to-one with User

#### Business Models

**Business**
- Business entities (new model)
- Fields: `name`, `legalName`, `type` (BusinessType enum), `description`, `website`, social media links, `supportEmail`, `supportPhone`, `status` (BusinessStatus enum)
- Relations: `owner` (User), `places`

**BusinessAccount**
- Legacy business account model (kept for backward compatibility)
- Fields: `displayName`, `legalName`, `contactName`, `contactPhone`, `contactEmail`
- Relations: `owner` (User), `places`

**Place**
- Business locations/places
- Fields: `title`, `city`, `address`, `lat`, `lng`, `phone`, `placeType`, amenities flags (`hasWorkspace`, `hasWifi`, `hasSockets`, `isSpecialtyCoffee`, `hasParking`, `isKidsFriendly`), `openingHours` (JSON), `averageCheck`, `isActive`
- Relations: `business` (Business), `businessAccount` (legacy), `cityRelation` (City), `services` (PlaceService), `reviews` (Review)
- Legacy fields kept for backward compatibility

#### Service Catalog Models

**ServiceCategory**
- Service categories (e.g., "Красота", "Парикмахерские услуги")
- Fields: `name`, `slug` (unique), `description`, `icon`, `isActive`, `sortOrder`
- Relations: `serviceTypes`

**ServiceType**
- Specific service types (e.g., "Маникюр", "Стрижка")
- Fields: `name`, `slug` (unique), `description`, `isActive`, `sortOrder`
- Relations: `category` (ServiceCategory), `placeServices`

**PlaceService**
- Services offered at specific places
- Fields: `name` (custom name if different from ServiceType), `description`, `price`, `priceUnit` (ServicePricingUnit enum), `durationMinutes`, `isActive`
- Relations: `place` (Place), `serviceType` (ServiceType)
- Unique constraint: `[placeId, serviceTypeId]`

**ServicePricingUnit Enum:**
- `FIXED` - Fixed price
- `PER_HOUR` - Per hour
- `PER_ITEM` - Per item
- `PER_KG` - Per kilogram
- `PER_SQ_M` - Per square meter

#### Review Model

**Review**
- User reviews for places
- Fields: `rating` (1-5), `title` (optional), `body` (required), `visitDate` (optional), `isPublished`, `isDeleted`
- Relations: `place` (Place), `user` (User)
- Indexes: `placeId`, `userId`, `[isPublished, isDeleted]`, `[placeId, isPublished, isDeleted]`

#### Franchise Models

**Franchise**
- Franchise accounts for regional management
- Fields: `code` (unique), `name`, `status` (FranchiseStatus enum), `billingEmail`, `billingPlan`, `revenueSharePercent`, `settings` (JSON)
- Relations: `ownerUser` (User), `cities`, `members`

**City**
- Cities (can be linked to Franchise)
- Fields: `name`, `slug` (unique), `countryCode`, `timezone`, `defaultLanguage`
- Relations: `franchise` (optional), `places`

**FranchiseMember**
- Users linked to franchises with roles
- Fields: `role` (FranchiseMemberRole enum), `isActive`
- Relations: `franchise`, `user`
- Unique constraint: `[franchiseId, userId]`

**FranchiseStatus Enum:**
- `DRAFT`, `ACTIVE`, `SUSPENDED`, `EXPIRED`

**FranchiseMemberRole Enum:**
- `OWNER`, `MANAGER`, `SUPPORT`

---

## File Structure

```
echocity/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── me/route.ts
│   │   ├── business/             # Business-related endpoints
│   │   │   ├── places/
│   │   │   │   └── [placeId]/
│   │   │   │       └── services/
│   │   │   │           ├── route.ts (GET, POST)
│   │   │   │           └── [serviceId]/route.ts (PATCH, DELETE)
│   │   │   └── register/route.ts
│   │   ├── places/               # Place endpoints
│   │   │   └── [placeId]/
│   │   │       └── reviews/route.ts (POST)
│   │   ├── public/               # Public endpoints
│   │   │   └── places/
│   │   │       └── [placeId]/
│   │   │           ├── route.ts (GET place info)
│   │   │           └── reviews/route.ts (GET reviews)
│   │   ├── services/             # Service catalog endpoints
│   │   │   ├── categories/route.ts
│   │   │   └── types/route.ts
│   │   └── admin/                # Admin endpoints
│   │       ├── cities/route.ts
│   │       └── franchises/
│   │           ├── route.ts
│   │           └── list/route.ts
│   ├── auth/                     # Auth pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── business/                 # Business pages
│   │   ├── dashboard/page.tsx
│   │   ├── places/
│   │   │   ├── page.tsx
│   │   │   └── [placeId]/
│   │   │       └── services/page.tsx
│   │   ├── register/page.tsx
│   │   └── offers/page.tsx
│   ├── admin/                    # Admin pages
│   │   ├── page.tsx
│   │   ├── cities/page.tsx
│   │   └── franchises/page.tsx
│   ├── dev/                      # Development/test pages
│   │   └── reviews-test/
│   │       └── [placeId]/page.tsx
│   ├── map/page.tsx              # Map view (CITIZEN)
│   ├── favorites/page.tsx        # Favorites (CITIZEN)
│   ├── settings/page.tsx         # Settings (CITIZEN)
│   ├── dashboard/page.tsx        # User dashboard (legacy)
│   ├── for-users/page.tsx
│   ├── for-businesses/page.tsx
│   ├── layout.tsx                # Root layout with Navbar
│   ├── page.tsx                  # Home page
│   └── globals.css
├── components/                   # React components
│   ├── Navbar.tsx                # Main navigation
│   └── forms/
│       └── PasswordInput.tsx     # Password input with show/hide
├── lib/                          # Shared utilities
│   ├── prisma.ts                 # Prisma client singleton
│   ├── logger.ts                 # Simple logger
│   ├── password.ts               # Password validation
│   ├── auth-client.ts            # Client-side auth hook
│   ├── admin-guard.ts            # Admin role guard
│   └── service-import/           # Service import module
│       ├── types.ts              # Type definitions
│       ├── mapper.ts             # Mapping functions
│       └── upsert.ts             # Database upsert operations
├── modules/                      # Feature modules
│   └── auth/
│       ├── service.ts            # Auth business logic
│       └── session.ts            # Session management
├── prisma/                       # Prisma configuration
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Seed script
│   └── migrations/               # Database migrations
│       ├── 20251114150001_update_user_roles/
│       ├── 20251114150002_complete_migration/
│       ├── 20251114160000_add_service_catalog/
│       └── 20251114170000_add_reviews/
├── scripts/                      # CLI scripts
│   └── import-services-example.ts
├── data/                         # Data files
│   └── example-services.json     # Example service catalog
├── .env                          # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── README.md                     # Main documentation
├── TECHNICAL_DOCUMENTATION.md    # This file
└── HANDOFF_DOCUMENT.md           # Handoff document for new developers
```

---

## Key Features Implemented

### 1. Authentication System

**Registration:**
- CITIZEN registration: `/auth/register` with fields (firstName, lastName, phone, city, language)
- BUSINESS_OWNER registration: `/business/register` - 3-step wizard
  - Step 1: Contact person (email, password, name, phone)
  - Step 2: Business data (name, type, description, social media)
  - Step 3: First place (title, address, coordinates, amenities)

**Login:**
- Email/password authentication
- Session management via cookies
- Role-based redirects after login

**Password Requirements:**
- Minimum 8 characters
- Must contain letters and numbers
- Rejects common weak passwords

### 2. Service Catalog

**Structure:**
- Categories → Service Types → Place Services
- Categories: Красота, Парикмахерские услуги, Химчистка, Еда и напитки
- Service types: Маникюр, Стрижка, Химчистка, Кофе, etc.

**Business Management:**
- `/business/places/[placeId]/services` - Manage services for a place
- Add/update/delete services with pricing and duration
- Link services to service types from catalog

**Import Module:**
- Import services from external JSON
- Command: `npm run import:services`
- Supports upsert (create/update without duplicates)

### 3. Reviews System

**Features:**
- Users can leave reviews with rating (1-5), title, body, visit date
- Reviews linked to places and users
- Moderation flags: `isPublished`, `isDeleted`
- Public API for fetching published reviews
- Author names from UserProfile

**Test Page:**
- `/dev/reviews-test/[placeId]` - Simple test interface

### 4. Admin Panel

**Features:**
- City management (`/admin/cities`)
- Franchise management (`/admin/franchises`)
- Only accessible to ADMIN role

### 5. Navigation

**Navbar:**
- Dynamic based on user role
- Unauthenticated: "Войти", "Регистрация"
- CITIZEN: "Карта", "Избранное", "Настройки"
- BUSINESS_OWNER: "Мои заведения", "Акции"
- ADMIN: "Админ-панель", "Города", "Франшизы"

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Places
- `GET /api/public/places/[placeId]` - Get place info (public)
- `POST /api/places/[placeId]/reviews` - Create review (authenticated)
- `GET /api/public/places/[placeId]/reviews` - Get reviews (public)

### Services
- `GET /api/services/categories` - Get all categories
- `GET /api/services/types?categoryId=...` - Get service types (optional filter)

### Business
- `POST /api/business/register` - Register business (3-step wizard)
- `GET /api/business/places/[placeId]/services` - Get place services
- `POST /api/business/places/[placeId]/services` - Add service
- `PATCH /api/business/places/[placeId]/services/[serviceId]` - Update service
- `DELETE /api/business/places/[placeId]/services/[serviceId]` - Delete service

### Admin
- `GET /api/admin/cities` - List cities
- `POST /api/admin/cities` - Create city
- `GET /api/admin/franchises` - List franchises
- `POST /api/admin/franchises` - Create franchise

---

## Environment Variables

Required in `.env`:
```
DATABASE_URL="postgresql://postgres.REF:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Note:** `.env` is in `.gitignore` - never commit credentials!

---

## Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations (development - creates migration files)
npm run prisma:migrate

# Deploy migrations (production - applies to Supabase)
npm run prisma:deploy

# Seed database
npm run prisma:seed

# Import services
npm run import:services

# Start dev server (port 3010)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio
npm run prisma:studio
```

---

## Database Migrations

All migrations are in `prisma/migrations/`:
1. `20251114150001_update_user_roles` - Updated Role enum (USER → CITIZEN)
2. `20251114150002_complete_migration` - Complete schema update
3. `20251114160000_add_service_catalog` - Service catalog models
4. `20251114170000_add_reviews` - Review model

**Important:** Always use `prisma migrate deploy` for Supabase (not `prisma migrate dev`)

---

## Seed Data

Seed script (`prisma/seed.ts`) creates:
- Cities: Санкт-Петербург (spb), Москва (moscow)
- Service categories: Красота, Парикмахерские услуги, Химчистка, Еда и напитки
- Service types: Маникюр, Педикюр, Стрижка, Окрашивание, Химчистка, Кофе

---

## Security Notes

- Passwords hashed with bcrypt (10 rounds)
- Session management via HTTP-only cookies
- Role-based access control (RBAC)
- Input validation with Zod
- SQL injection protection via Prisma
- Environment variables never committed to git

---

## Next Steps / Roadmap

1. **Review Moderation:**
   - Admin/business can hide/approve reviews
   - Reply to reviews
   - Filter by rating

2. **Public Place Cards:**
   - Display reviews on place cards
   - Average rating calculation
   - Review statistics

3. **User Search:**
   - Search places by services
   - Filter by location, rating, price
   - Mobile-first UI

4. **Service Import:**
   - Connect real external sources (scrapers, APIs)
   - CSV/HTML parsers
   - Batch import for large datasets

---

## Troubleshooting

**Database connection issues:**
- Check `DATABASE_URL` in `.env`
- Verify Supabase credentials
- Try direct connection instead of pooler

**Migration issues:**
- Use `prisma migrate deploy` for Supabase
- Check migration status: `npx prisma migrate status`
- Never modify applied migrations

**Port conflicts:**
- Default dev port: 3010
- Change in `package.json` if needed

---

Last updated: 2025-11-14


