# CityEcho

Voice and text search for local places in your city.

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **TailwindCSS** for styling
- **Prisma** with **Supabase Postgres**
- **bcrypt** for password hashing
- **Zod** for validation

## Project Structure

```
echocity/
├── app/                    # Next.js App Router pages
│   ├── api/auth/          # Auth API endpoints
│   ├── auth/              # Auth pages (login, register)
│   ├── dashboard/         # User dashboard
│   ├── business/          # Business dashboard
│   ├── admin/             # Admin panel
│   └── for-users/         # Static pages
├── components/            # React components
│   └── forms/             # Form components
├── lib/                   # Shared utilities
│   ├── prisma.ts         # Prisma client
│   ├── logger.ts         # Logger utility
│   └── password.ts       # Password validation
├── modules/               # Feature modules
│   └── auth/             # Auth module
│       ├── service.ts   # Auth business logic
│       └── session.ts   # Session management
└── prisma/               # Prisma schema and migrations
    └── schema.prisma    # Database schema
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   **Required variables:**
   - `DATABASE_URL` - Supabase PostgreSQL connection string
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `SUPABASE_USER_PHOTOS_BUCKET` - Storage bucket name (default: "user-photos")
   
   **Optional variables (for Yandex integration):**
   - `YANDEX_CLIENT_ID` - Yandex OAuth client ID (see `docs/YANDEX_INTEGRATION.md`)
   - `YANDEX_CLIENT_SECRET` - Yandex OAuth client secret
   - `YANDEX_OAUTH_REDIRECT_URI` - OAuth callback URL
   - `YANDEX_MAPS_API_KEY` - Yandex Maps API key for business verification
   - `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` - Public Maps API key for map display
   
   **Note:** See `docs/YANDEX_INTEGRATION.md` for detailed Yandex setup instructions.

3. **Set up Supabase Storage:**
   
   Create a storage bucket for user photos:
   
   1. Go to Supabase Dashboard → Storage
   2. Click "New bucket"
   3. Name: `user-photos`
   4. **Public bucket:** ❌ Leave unchecked (Private)
   5. Click "Create bucket"
   
   **Note:** The bucket should be Private. Access is controlled via Service Role Key on the server side.

4. **Set up Prisma:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations (development)
   npm run prisma:migrate
   
   # Or deploy migrations (production)
   npm run prisma:deploy
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3010](http://localhost:3010)

## Features

- **User Authentication**: Email/password and Yandex ID OAuth
- **Business Management**: Business registration, place management, service catalog
- **Yandex Integration**: 
  - Sign in with Yandex ID
  - Business verification via Yandex Maps Places API
- **Reviews**: User reviews for places
- **Service Catalog**: Categorization and pricing of business services
- **Franchise System**: Multi-city franchise management

## Database Schema

### Models

- **User** - User accounts with roles (ADMIN, CITIZEN, BUSINESS_OWNER)
- **UserProfile** - User profile information
- **OAuthAccount** - Linked OAuth accounts (Yandex, etc.)
- **BusinessAccount** - Business accounts (legacy)
- **Business** - Business entities (with Yandex verification fields)
- **Place** - Business locations/places (linked to City)
- **City** - Cities (can be linked to Franchise)
- **Franchise** - Franchise accounts for regional management
- **FranchiseMember** - Users linked to franchises with roles
- **ServiceCategory** - Service categories (e.g., "Красота", "Парикмахерские услуги")
- **ServiceType** - Service types (e.g., "Маникюр", "Стрижка")
- **PlaceService** - Services offered at specific places
- **Review** - User reviews for places

### Roles

- `ADMIN` - Platform administrator
- `CITIZEN` - Regular user (citizen)
- `BUSINESS_OWNER` - Business owner/manager

### Franchise & Cities Schema

The platform supports a franchise model where:
- **Franchises** can own multiple cities
- **Cities** can optionally belong to a franchise (or be managed centrally by ADMIN)
- **Places** are always linked to a City (not directly to Franchise)
- **FranchiseMembers** link users to franchises with roles (OWNER, MANAGER, SUPPORT)

#### Franchise Status

- `DRAFT` - Draft/not active
- `ACTIVE` - Active franchise
- `SUSPENDED` - Temporarily suspended
- `EXPIRED` - Expired franchise

#### Migrations

To apply migrations to Supabase (DATABASE_URL points to Supabase Postgres):

```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migration (development - creates migration files)
npm run prisma:migrate

# Deploy migrations (production - applies existing migrations to Supabase)
npm run prisma:deploy
```

**Note:** 
- `prisma:migrate` creates migration files and applies them (use for development)
- `prisma:deploy` applies existing migrations without creating new files (use for production/Supabase)
- If the database is empty, the migration will create all tables from scratch
- If you have existing data, you'll need to migrate the `Place.city` string field to `Place.cityId` foreign key

#### Seeds

Seed script creates initial test data:

```bash
npm run prisma:seed
```

This creates:
- **Санкт-Петербург** (slug: `spb`, countryCode: `RU`, timezone: `Europe/Moscow`)
- **Москва** (slug: `moscow`, countryCode: `RU`, timezone: `Europe/Moscow`)

Cities are created without franchiseId (managed by central ADMIN).

## Features

### Authentication

- User registration (USER role)
- Business registration (BUSINESS_OWNER role)
- Login with email/password
- Password strength validation
- Show/hide password toggle
- Session management

### Pages

- `/` - Home page
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/dashboard` - User dashboard (legacy)
- `/map` - Map view (CITIZEN)
- `/favorites` - Favorites (CITIZEN)
- `/settings` - Settings (CITIZEN)
- `/business/dashboard` - Business dashboard
- `/business/places` - Business places management
- `/business/places/[placeId]/services` - Manage services for a place
- `/business/register` - Business registration wizard
- `/business/offers` - Business offers (placeholder)
- `/admin` - Admin panel
- `/admin/cities` - Admin: Manage cities (ADMIN only)
- `/admin/franchises` - Admin: Manage franchises (ADMIN only)
- `/for-users` - Information for users
- `/for-businesses` - Information for businesses
- `/dev/reviews-test/[placeId]` - Test page for reviews

### Navbar

The navbar automatically adjusts based on user role:
- **Unauthenticated**: Sign in / Sign up buttons
- **USER**: Dashboard link + user menu
- **BUSINESS_OWNER**: My places link + account menu
- **ADMIN**: Admin, Cities, Franchises links + account menu

## Password Requirements

- Minimum 8 characters
- Must contain letters and numbers
- Rejects common weak passwords (123456, password, etc.)

## Development

### Scripts

- `npm run dev` - Start development server on port 3010
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Create and apply migrations (development)
- `npm run prisma:deploy` - Deploy migrations to Supabase (production)
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Run seed script to create test data
- `npm run import:services` - Import service catalog from example JSON

**Note:** Development server runs on `http://localhost:3010` by default.

## Deployment

1. Set up environment variables in Railway
2. Run migrations: `npm run prisma:deploy`
3. Build and start: `npm run build && npm start`

## Testing Franchise & Cities Module

### How to Test

1. **Run migrations and seed:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

2. **Create an ADMIN user:**
   - Register a user normally, then manually update the role in database:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
   ```

3. **Access admin pages:**
   - Login as ADMIN
   - Navigate to `/admin/cities` - should see list of cities (SPB, Moscow from seed)
   - Navigate to `/admin/franchises` - should see empty list
   - Create a new franchise
   - Create a new city and assign it to the franchise

### Admin Features

- **Cities Management** (`/admin/cities`):
  - View all cities with their details
  - Create new cities
  - Assign cities to franchises
  - See count of places per city

- **Franchises Management** (`/admin/franchises`):
  - View all franchises with status and owner info
  - Create new franchises
  - Assign franchise owner by email
  - See count of cities and members per franchise

## Notes

- All database operations use Supabase Postgres (no local SQLite)
- Secrets and environment variables are managed in Railway
- Password hashing uses bcrypt
- Session management uses cookies (simple implementation for now)
- **Important:** Business registration currently uses string `city` field. This will be updated to use `cityId` in a future update. For now, ensure cities exist before registering businesses.

## Reviews Module

### Overview

Users can leave reviews for places with ratings (1-5), title, body text, and optional visit date.

### API Endpoints

- **POST** `/api/places/[placeId]/reviews` - Create a review (authenticated users)
  - Body: `{ rating: 1-5, title?: string, body: string, visitDate?: string }`
  
- **GET** `/api/public/places/[placeId]/reviews` - Get published reviews for a place (public)
  - Returns: `{ reviews: Review[] }` with author names from UserProfile

### Testing

Use the test page at `/dev/reviews-test/[placeId]` to test review functionality.

## Service Import Module

### Overview

Module for importing service catalogs from external sources (JSON/CSV/HTML). Supports mapping external data to our ServiceCategory and ServiceType models.

### Structure

- `lib/service-import/types.ts` - Type definitions for raw service data
- `lib/service-import/mapper.ts` - Mapping functions (raw → Prisma format)
- `lib/service-import/upsert.ts` - Database upsert operations

### Usage

1. Prepare JSON file in `data/example-services.json` format:
   ```json
   {
     "categories": [
       { "name": "Красота", "description": "...", "icon": "💅" }
     ],
     "services": [
       { "categoryName": "Красота", "name": "Маникюр", "description": "..." }
     ]
   }
   ```

2. Run import:
   ```bash
   npm run import:services
   ```

The script will:
- Create/update categories (by slug or name)
- Create/update service types (by slug or name within category)
- Report statistics (created/updated counts)

### Next Steps

- Connect real external data sources (scrapers, APIs)
- Add CSV/HTML parsers
- Add validation and error handling for edge cases

