# Setup Guide - CityEcho

## Supabase Connection

### Current Configuration

- **Project Reference:** `renayyeveulagnhgocsd`
- **Dashboard:** https://supabase.com/dashboard/project/renayyeveulagnhgocsd
- **Database:** PostgreSQL (Supabase)
- **Connection:** Session Pooler (IPv4 compatible)

### Environment Variables

The `.env` file contains:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key (safe for frontend)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (backend only, never expose!)

### First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

3. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```
   This will create all tables in Supabase.

4. **Seed initial data:**
   ```bash
   npm run prisma:seed
   ```
   This creates test cities (SPB, Moscow).

5. **Create ADMIN user:**
   - Register a user via `/auth/register`
   - Update role in Supabase SQL Editor:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

### Production Setup

For production deployment (Railway/Vercel):

1. Set environment variables in your hosting platform
2. Use production Supabase project credentials
3. Run migrations: `npm run prisma:deploy`
4. Never commit `.env` or `supabase_keys.txt` to git

### Security Notes

- ✅ `.env` and `supabase_keys.txt` are in `.gitignore`
- ✅ Never commit real credentials to git
- ✅ Service role key should only be used server-side
- ✅ Anon key can be used in frontend (but don't log it)


