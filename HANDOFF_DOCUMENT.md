# Handoff Document - ГдеСейчас (EchoCity)

**Purpose:** Complete handoff document for transferring the project to another developer or AI agent.  
**Project Name:** ГдеСейчас (EchoCity)  
**Location:** `C:\dev\echocity`  
**Last Updated:** 2025-11-15  
**Dev Port:** 3010

---

## ⚠️ CRITICAL: Credentials Storage Policy

**IMPORTANT:** This project uses **TEST credentials** that are explicitly authorized to be stored openly in text files. These credentials will be rotated once development is complete.

**Where credentials are stored:**
- `supabase_keys.txt` - Contains Supabase database credentials (TEST ONLY)
- `.env` - Environment variables (should be created from `.env.example`)

**Authorization:** You are explicitly authorized to:
- ✅ Store credentials in `supabase_keys.txt` file
- ✅ Reference credentials in documentation
- ✅ Use credentials for development and testing
- ⚠️ These are TEST credentials and will be rotated after development

**Security Note:** In production, these credentials will be rotated and stored securely. For now, they are test credentials for development purposes only.

---

## Quick Start Guide

### 1. Prerequisites

- Node.js 18+ installed
- Git installed
- Access to Supabase project (credentials in `supabase_keys.txt`)

### 2. Initial Setup

```bash
# Navigate to project directory
cd C:\dev\echocity

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add credentials from supabase_keys.txt
# See "Environment Variables" section below

# Generate Prisma client
npm run prisma:generate

# Apply database migrations
npm run prisma:deploy

# Seed initial data (cities, service categories)
npm run prisma:seed

# Start development server
npm run dev
```

**Open:** http://localhost:3010

---

## Environment Variables

### Required Variables

Create `.env` file in project root with the following:

```env
# Database (from supabase_keys.txt)
DATABASE_URL="postgresql://postgres.renayyeveulagnhgocsd:Airbus3803802024@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"

# Supabase (from supabase_keys.txt)
NEXT_PUBLIC_SUPABASE_URL="https://renayyeveulagnhgocsd.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlbmF5eWV2ZXVsYWduaGdvY3NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyODY5NywiZXhwIjoyMDc4NzA0Njk3fQ.dCCA97LPdz8M2FvrhG_oZJ8n9Q1_yRFhJR-R2oqI9LQ"
SUPABASE_USER_PHOTOS_BUCKET="user-photos"
```

**Source:** All values are in `supabase_keys.txt` file in project root.

### Optional Variables (Yandex Integration)

```env
# Yandex OAuth (for Yandex ID sign-in)
YANDEX_CLIENT_ID="__CHANGE_ME__"
YANDEX_CLIENT_SECRET="__CHANGE_ME__"
YANDEX_OAUTH_REDIRECT_URI="http://localhost:3010/api/auth/yandex/callback"

# Yandex Maps API (for business verification and map display)
YANDEX_MAPS_API_KEY="__CHANGE_ME__"
NEXT_PUBLIC_YANDEX_MAPS_API_KEY="__CHANGE_ME__"
```

**Note:** See `docs/YANDEX_INTEGRATION.md` for detailed setup instructions.

---

## Database Access (Supabase)

### Connection Details

**Provider:** Supabase PostgreSQL  
**Project Reference:** `renayyeveulagnhgocsd`  
**Dashboard:** https://supabase.com/dashboard/project/renayyeveulagnhgocsd

**Credentials Location:**
- File: `supabase_keys.txt` (in project root)
- Contains: Database password, connection strings, API keys

**Connection String:**
```
postgresql://postgres.renayyeveulagnhgocsd:Airbus3803802024@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**Direct Connection (if pooler fails):**
```
postgresql://postgres.renayyeveulagnhgocsd:Airbus3803802024@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require
```

### Accessing Database

**1. Via Prisma Studio (Recommended):**
```bash
npm run prisma:studio
```
Opens GUI at http://localhost:5555

**2. Via Supabase Dashboard:**
- URL: https://supabase.com/dashboard/project/renayyeveulagnhgocsd
- Navigate to: Table Editor
- View/edit tables directly

**3. Via SQL Editor:**
- Supabase Dashboard → SQL Editor
- Run queries directly

### Supabase Storage

**Bucket:** `user-photos` (Private bucket)

**Setup:**
1. Go to Supabase Dashboard → Storage
2. Create bucket: `user-photos`
3. Set as **Private** (not public)
4. Access controlled via Service Role Key on server

**Script to create bucket:**
```bash
tsx scripts/create-storage-bucket.ts
```

### Database Migrations

**Current Migrations Applied:**
1. ✅ `20251114140602_init_franchise_cities`
2. ✅ `20251114150000_update_role_enum`
3. ✅ `20251114150001_update_user_roles`
4. ✅ `20251114150002_complete_migration`
5. ✅ `20251114160000_add_service_catalog`
6. ✅ `20251114170000_add_reviews`
7. ✅ `20251114180000_add_profile_avatar_and_photos`
8. ✅ `20251115000000_add_yandex_oauth_and_business_linking`
9. ✅ `20251115000001_add_place_service_specials`

**Check migration status:**
```bash
npx prisma migrate status
```

**Apply migrations:**
```bash
# For Supabase (production-like)
npm run prisma:deploy

# For development (creates migration files)
npm run prisma:migrate
```

---

## GitHub Repository

### Repository Information

**URL:** https://github.com/filippmiller/echocity  
**Default Branch:** `main`  
**Remote:** `origin`

### Access

**Check current status:**
```bash
git status
```

**Pull latest changes:**
```bash
git pull origin main
```

**Push changes:**
```bash
# After committing
git push origin main
```

### Git Workflow

**Standard workflow:**
```bash
# Check what's changed
git status

# Add changes
git add -A

# Commit with descriptive message
git commit -m "cursor: description of changes"

# Push to remote
git push -u origin HEAD
```

**Branching strategy:**
- `main` - Production-ready code
- Feature branches for new features
- Create PRs for merging to main

**Important:**
- ❌ Never commit `.env` or `supabase_keys.txt`
- ✅ Check `.gitignore` before committing
- ✅ Review changes before pushing
- ✅ Use descriptive commit messages

### Current Git Status

- Local branch: `main`
- Remote: `origin/main`
- May have uncommitted changes or commits ahead of origin

---

## Railway Deployment (Future)

**Status:** Not yet configured

**When ready to deploy:**
1. Connect GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Railway auto-deploys on push to main
4. Run migrations: `npm run prisma:deploy`
5. Build and start: `npm run build && npm start`

**Environment Variables in Railway:**
- Copy all variables from `.env`
- Add production-specific values
- Never commit Railway credentials

---

## Project Architecture

### Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + TailwindCSS
- **Backend:** Next.js API Routes + Prisma ORM
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage (for user photos)
- **Authentication:** Custom session-based (HTTP-only cookies)
- **Password Hashing:** bcrypt (10 rounds)
- **Validation:** Zod schemas

### Project Structure

```
echocity/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── business/             # Business management
│   │   ├── public/               # Public APIs (search, places)
│   │   ├── profile/              # Profile management
│   │   ├── integrations/         # External integrations (Yandex)
│   │   └── places/               # Places API
│   ├── auth/                     # Auth pages (login, register)
│   ├── business/                 # Business owner pages
│   ├── admin/                    # Admin panel
│   ├── places/                   # Public place pages
│   ├── search/                   # Search page
│   ├── map/                      # Map page
│   └── settings/                 # User settings
├── components/                   # React components
│   ├── forms/                    # Form components
│   └── [feature components]      # Feature-specific components
├── lib/                          # Utilities and shared code
│   ├── service-import/           # Service import module
│   └── [utilities]               # Helper functions
├── modules/                      # Feature modules
│   ├── auth/                     # Authentication module
│   └── yandex/                   # Yandex integration
├── prisma/                       # Database
│   ├── migrations/               # Migration files
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed script
├── scripts/                      # CLI scripts
├── docs/                         # Documentation
└── data/                         # Data files (JSON, etc.)
```

### Key Files

**Configuration:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config
- `next.config.ts` - Next.js config
- `tailwind.config.ts` - TailwindCSS config
- `prisma/schema.prisma` - Database schema

**Environment:**
- `.env` - Environment variables (NOT in git, create from `.env.example`)
- `.env.example` - Environment variable template
- `supabase_keys.txt` - Supabase credentials (TEST, authorized to store)

**Documentation:**
- `README.md` - Main documentation
- `HANDOFF_DOCUMENT.md` - This file
- `IMPLEMENTATION_REVIEW.md` - Complete feature review
- `TECHNICAL_DOCUMENTATION.md` - Technical details
- `docs/YANDEX_INTEGRATION.md` - Yandex setup guide

---

## System Functionality Overview

### 1. Authentication System

**Features:**
- Email/password registration and login
- Yandex ID OAuth integration
- Role-based access (ADMIN, CITIZEN, BUSINESS_OWNER)
- Session management via HTTP-only cookies
- Password strength validation

**Pages:**
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/error` - OAuth error handling

**API:**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user
- `POST /api/auth/yandex/start` - Start Yandex OAuth
- `GET /api/auth/yandex/callback` - Yandex OAuth callback

### 2. User Profile Management

**Features:**
- Profile editing (name, phone, city, language, preferences)
- Avatar upload to Supabase Storage
- Photo gallery with upload/delete
- Set gallery photo as avatar
- Avatar display in Navbar

**Pages:**
- `/settings` - Profile settings page

**API:**
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar
- `GET /api/profile/photos` - List photos
- `POST /api/profile/photos` - Upload photo
- `PATCH /api/profile/photos/[photoId]` - Set as avatar
- `DELETE /api/profile/photos/[photoId]` - Delete photo

### 3. Business Management

**Features:**
- Business registration wizard (3 steps)
- Place management
- Service catalog management
- Yandex business verification
- Service specials (discounts, promotions)

**Pages:**
- `/business/register` - Business registration
- `/business/dashboard` - Business dashboard
- `/business/places` - Places management
- `/business/places/[placeId]/services` - Services management
- `/business/offers` - Offers (placeholder)

**API:**
- `POST /api/business/register` - Register business
- `GET /api/business/places/[placeId]/services` - List services
- `POST /api/business/places/[placeId]/services` - Add service
- `PATCH /api/business/places/[placeId]/services/[serviceId]` - Update service
- `DELETE /api/business/places/[placeId]/services/[serviceId]` - Delete service
- `POST /api/businesses/[id]/link-yandex` - Link Yandex listing

### 4. Public Search & Discovery

**Features:**
- Search places by name/description
- Filter by city
- Filter by service type
- Results with ratings and services
- Click to view place details

**Pages:**
- `/search` - Search page

**API:**
- `GET /api/public/search` - Search places
- `GET /api/public/cities` - List cities
- `GET /api/public/service-types` - List service types

### 5. Public Place Pages

**Features:**
- Detailed place information
- Services list with specials
- Reviews section
- Average rating display
- Business contact information
- Link to map

**Pages:**
- `/places/[id]` - Place detail page

**API:**
- `GET /api/public/places/[placeId]` - Get place
- `GET /api/public/places/[placeId]/reviews` - Get reviews

### 6. Reviews System

**Features:**
- Create reviews (authenticated users)
- Rating 1-5 stars
- Optional title and visit date
- Review display with author names
- Average rating calculation
- Review count display

**Components:**
- `ReviewsSection` - Reviews display and form
- `ReviewForm` - Review creation form

**API:**
- `POST /api/places/[placeId]/reviews` - Create review
- `GET /api/public/places/[placeId]/reviews` - Get reviews

### 7. Maps Integration

**Features:**
- Yandex Maps display
- Place markers on map
- Click map to add new places
- Address geocoding
- View existing places

**Pages:**
- `/map` - Map page

**Components:**
- `YandexMap` - Map component

**API:**
- `GET /api/places` - Get places for map
- `POST /api/places` - Create place
- `GET /api/geocode` - Geocode address

### 8. Admin Panel

**Features:**
- Cities management
- Franchises management
- View place counts
- Assign cities to franchises

**Pages:**
- `/admin` - Admin panel
- `/admin/cities` - Cities management
- `/admin/franchises` - Franchises management

**API:**
- `GET /api/admin/cities` - List cities
- `POST /api/admin/cities` - Create city
- `GET /api/admin/franchises/list` - List franchises
- `POST /api/admin/franchises` - Create franchise

### 9. Yandex Integration

**Features:**
- Sign in with Yandex ID
- Business verification via Yandex Maps
- Search businesses in Yandex directory
- Auto-populate business data

**Components:**
- `YandexSignInButton` - Sign-in button
- `YandexBusinessVerification` - Verification UI

**API:**
- `GET /api/integrations/yandex/places/search` - Search Yandex businesses

**Documentation:** See `docs/YANDEX_INTEGRATION.md`

---

## Database Schema

### Core Models

**User Management:**
- `User` - User accounts (roles: ADMIN, CITIZEN, BUSINESS_OWNER)
- `UserProfile` - Extended profile information
- `OAuthAccount` - Linked OAuth providers (Yandex)
- `UserPhoto` - Photo gallery

**Business:**
- `Business` - Business entities (with Yandex verification)
- `BusinessAccount` - Legacy business accounts
- `Place` - Business locations
- `City` - Cities
- `Franchise` - Franchise accounts
- `FranchiseMember` - Franchise membership

**Services:**
- `ServiceCategory` - Service categories
- `ServiceType` - Service types
- `PlaceService` - Services at places (with specials support)

**Content:**
- `Review` - User reviews for places

### Key Relationships

- User → UserProfile (1:1)
- User → OAuthAccount (1:many)
- User → Business (1:many, owner)
- Business → Place (1:many)
- Place → PlaceService (1:many)
- Place → Review (1:many)
- City → Place (1:many)
- Franchise → City (1:many)

---

## Common Tasks

### Adding a New Feature

**1. Database changes:**
```bash
# Edit prisma/schema.prisma
# Create migration manually or:
npm run prisma:migrate dev --name feature_name
# For Supabase:
npm run prisma:deploy
```

**2. API endpoint:**
- Create file in `app/api/.../route.ts`
- Export `GET`, `POST`, etc. functions
- Use `getSession()` for auth
- Validate with Zod schemas

**3. UI page:**
- Create file in `app/.../page.tsx`
- Server Component (default) or Client Component (`'use client'`)
- Use `getSession()` for server-side auth
- Use `useAuth()` hook for client-side

### Debugging

**Database issues:**
```bash
# Check connection
npx prisma db pull

# View data
npm run prisma:studio

# Check migrations
npx prisma migrate status
```

**API issues:**
- Check browser Network tab
- Check server console logs
- Verify session in cookies
- Check Prisma query logs

**Build issues:**
```bash
# Regenerate Prisma client
npm run prisma:generate

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Testing

**Manual testing checklist:**
1. User registration (CITIZEN, BUSINESS_OWNER)
2. Login/logout
3. Profile editing and avatar upload
4. Business registration
5. Place and service management
6. Review creation
7. Public search
8. Place page viewing
9. Yandex OAuth (if configured)
10. Yandex business verification (if configured)

**Test users:**
- Register via UI at `/auth/register`
- Or create manually in database
- Make user ADMIN: `UPDATE "User" SET role = 'ADMIN' WHERE email = '...';`

---

## Credentials and Secrets Management

### Where Credentials Are Stored

**Local Development:**
- `.env` file in project root (NOT in git)
- `supabase_keys.txt` in project root (TEST credentials, authorized to store)

**Production (Future):**
- Railway environment variables (when deployed)
- Supabase Dashboard (database credentials)

### Credentials in supabase_keys.txt

**File location:** `C:\dev\echocity\supabase_keys.txt`

**Contains:**
- Database password
- Connection strings (pooler and direct)
- Supabase project URL
- Anon public key
- Service role key

**Authorization:** These are TEST credentials explicitly authorized to be stored in this file. They will be rotated after development.

### Environment Variables Setup

**Required for basic functionality:**
- `DATABASE_URL` - From `supabase_keys.txt`
- `NEXT_PUBLIC_SUPABASE_URL` - From `supabase_keys.txt`
- `SUPABASE_SERVICE_ROLE_KEY` - From `supabase_keys.txt`
- `SUPABASE_USER_PHOTOS_BUCKET` - Set to `"user-photos"`

**Optional (Yandex integration):**
- `YANDEX_CLIENT_ID` - Get from Yandex OAuth app
- `YANDEX_CLIENT_SECRET` - Get from Yandex OAuth app
- `YANDEX_OAUTH_REDIRECT_URI` - Set to `"http://localhost:3010/api/auth/yandex/callback"`
- `YANDEX_MAPS_API_KEY` - Get from Yandex Cloud
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` - Same as above

### Security Rules

1. ✅ `.env` is in `.gitignore` - never commit
2. ✅ `supabase_keys.txt` is in `.gitignore` - never commit
3. ✅ Test credentials authorized to store in `supabase_keys.txt`
4. ⚠️ Production credentials will be rotated and stored securely
5. ✅ Use environment variables for all secrets
6. ✅ Never hard-code credentials in code

---

## Development Workflow

### Daily Development

**1. Start development:**
```bash
cd C:\dev\echocity
npm run dev
```

**2. Make changes:**
- Edit files as needed
- Test in browser (http://localhost:3010)
- Check console for errors

**3. Database changes:**
```bash
# Edit schema.prisma
# Create migration
npm run prisma:deploy
npm run prisma:generate
```

**4. Commit changes:**
```bash
git add -A
git commit -m "cursor: description of changes"
git push -u origin HEAD
```

### Git Workflow

**Standard commit message format:**
```
cursor: brief description of changes
```

**Before committing:**
- Check `git status`
- Review changes
- Ensure `.env` and `supabase_keys.txt` are not staged
- Test functionality

**Branching:**
- Use feature branches for major features
- Create PRs for code review
- Merge to `main` when ready

---

## Troubleshooting

### Common Issues

**"Can't reach database server"**
- Check `DATABASE_URL` in `.env`
- Try direct connection instead of pooler
- Verify Supabase project is active
- Check credentials in `supabase_keys.txt`

**"Migration was modified after it was applied"**
- Don't modify applied migrations
- Create new migration instead
- Use `prisma migrate deploy` for Supabase

**"Port 3010 already in use"**
- Change port in `package.json`: `"dev": "next dev -p 3011"`
- Or kill process using port 3010

**"Prisma Client not generated"**
```bash
npm run prisma:generate
```

**"Module not found"**
```bash
npm install
```

**"Bucket not found" (Supabase Storage)**
- Create bucket in Supabase Dashboard
- Or run: `tsx scripts/create-storage-bucket.ts`

**"Yandex OAuth not configured"**
- Add Yandex credentials to `.env`
- See `docs/YANDEX_INTEGRATION.md` for setup

---

## Key Resources

### Documentation Files

- `README.md` - Main project documentation
- `IMPLEMENTATION_REVIEW.md` - Complete feature review
- `HANDOFF_DOCUMENT.md` - This file
- `TECHNICAL_DOCUMENTATION.md` - Technical architecture details
- `docs/YANDEX_INTEGRATION.md` - Yandex setup guide
- `AUDIT_SPEC.md` - Feature audit specification
- `AUDIT_LOG.md` - Audit implementation log
- `TESTING_REPORT.md` - Testing results

### External Resources

**Supabase:**
- Dashboard: https://supabase.com/dashboard/project/renayyeveulagnhgocsd
- Documentation: https://supabase.com/docs

**GitHub:**
- Repository: https://github.com/filippmiller/echocity

**Yandex:**
- OAuth Apps: https://oauth.yandex.com/
- Cloud Console: https://console.cloud.yandex.ru/
- Maps API Docs: https://yandex.com/dev/maps/

**Technology Docs:**
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- TailwindCSS: https://tailwindcss.com/docs

---

## Quick Reference

### Start Development
```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

### Common Commands
```bash
npm run dev              # Start dev server (port 3010)
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:studio    # Open database GUI (port 5555)
npm run prisma:seed      # Seed database
npm run prisma:deploy    # Apply migrations to Supabase
npm run import:services  # Import service catalog
```

### Database
- Provider: Supabase PostgreSQL
- Migrations: `prisma/migrations/`
- Schema: `prisma/schema.prisma`
- Client: `lib/prisma.ts`
- Studio: http://localhost:5555

### Ports
- Dev server: 3010
- Prisma Studio: 5555

### Important Paths
- Project root: `C:\dev\echocity`
- Credentials: `supabase_keys.txt`
- Environment: `.env` (create from `.env.example`)

---

## Next Steps for New Agent

1. **Read this document completely**
2. **Set up environment:**
   - Copy `.env.example` to `.env`
   - Add credentials from `supabase_keys.txt`
   - Run `npm install`
   - Run `npm run prisma:generate`
   - Run `npm run prisma:deploy`
3. **Start development server:**
   - Run `npm run dev`
   - Open http://localhost:3010
4. **Review implementation:**
   - Read `IMPLEMENTATION_REVIEW.md` for complete feature list
   - Check `README.md` for project overview
5. **Test core functionality:**
   - Register a user
   - Create a business
   - Add a place
   - Leave a review
   - Test search
6. **Check current status:**
   - Review `git status`
   - Check for uncommitted changes
   - Review recent commits

---

## Important Notes

1. **Credentials:** Test credentials are in `supabase_keys.txt` and are authorized to be stored there. They will be rotated after development.

2. **Database:** All operations use Supabase PostgreSQL. No local database.

3. **Migrations:** Use `prisma migrate deploy` for Supabase (not `prisma migrate dev`).

4. **Session:** Current session implementation uses simple JSON encoding. For production, should use JWT or encrypted sessions.

5. **Port:** Dev server runs on port 3010 by default.

6. **Git:** Never commit `.env` or `supabase_keys.txt`. They are in `.gitignore`.

7. **Yandex:** Integration is optional. App works without it, but features are hidden if not configured.

---

**Last Updated:** 2025-11-15  
**Maintained by:** Development Team  
**Status:** ✅ Core functionality complete and tested
