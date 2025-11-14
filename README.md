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
   
   The `.env` file is already configured for development with Supabase.
   
   **For production:** Create a `.env` file with your own Supabase credentials:
   ```
   DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require"
   SUPABASE_URL="https://PROJECT_REF.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```
   
   **Note:** Supabase credentials are stored in `supabase_keys.txt` (dev only, not committed to git).

3. **Set up Prisma:**
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

## Database Schema

### Models

- **User** - User accounts with roles (ADMIN, USER, BUSINESS_OWNER)
- **UserProfile** - User profile information
- **BusinessAccount** - Business accounts
- **Place** - Business locations/places (linked to City)
- **City** - Cities (can be linked to Franchise)
- **Franchise** - Franchise accounts for regional management
- **FranchiseMember** - Users linked to franchises with roles

### Roles

- `ADMIN` - Platform administrator
- `USER` - Regular user (citizen)
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
- `/dashboard` - User dashboard
- `/business/dashboard` - Business dashboard
- `/admin` - Admin panel
- `/admin/cities` - Admin: Manage cities (ADMIN only)
- `/admin/franchises` - Admin: Manage franchises (ADMIN only)
- `/for-users` - Information for users
- `/for-businesses` - Information for businesses

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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Create and apply migrations
- `npm run prisma:deploy` - Deploy migrations (production)
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Run seed script to create test data

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

